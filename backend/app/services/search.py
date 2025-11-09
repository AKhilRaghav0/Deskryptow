"""
Redis-based search service
"""

import redis
from typing import List, Dict, Any, Optional
import json
import logging

from app.database import get_redis
from app.config import settings

logger = logging.getLogger(__name__)

class SearchService:
    """Service for indexing and searching jobs using Redis"""
    
    def __init__(self):
        self.redis = get_redis()
        self.job_index_prefix = "job:"
        self.search_index_key = "search:jobs"
        self.tag_index_prefix = "tag:"
    
    def index_job(self, job_id: str, job_data: Dict[str, Any]) -> bool:
        """
        Index a job for search
        
        Args:
            job_id: Job ID
            job_data: Job data dictionary with title, description, tags, etc.
        
        Returns:
            True if successful
        """
        if not self.redis:
            logger.warning("Redis not available, skipping indexing")
            return False
        
        try:
            # Store full job data
            job_key = f"{self.job_index_prefix}{job_id}"
            self.redis.setex(
                job_key,
                86400 * 30,  # 30 days TTL
                json.dumps(job_data)
            )
            
            # Index by title, description, and skills_required (simple word indexing)
            searchable_text = f"{job_data.get('title', '')} {job_data.get('description', '')} {' '.join(job_data.get('skills_required', []))}".lower()
            words = searchable_text.split()
            
            # Add to search index - index words and create n-grams for partial matching
            for word in words:
                # Remove punctuation and clean word
                clean_word = ''.join(c for c in word if c.isalnum())
                if len(clean_word) >= 2:  # Index words 2+ characters
                    self.redis.sadd(f"{self.search_index_key}:{clean_word}", job_id)
                    
                    # Create n-grams for partial matching (prefixes)
                    # Index prefixes of 2, 3, 4 characters for partial matching
                    for n in [2, 3, 4]:
                        if len(clean_word) >= n:
                            prefix = clean_word[:n]
                            self.redis.sadd(f"{self.search_index_key}:prefix:{prefix}", job_id)
            
            # Index by tags
            tags = job_data.get('tags', [])
            for tag in tags:
                tag_key = f"{self.tag_index_prefix}{tag.lower()}"
                self.redis.sadd(tag_key, job_id)
                self.redis.sadd(f"{self.search_index_key}:tags", tag.lower())
            
            # Index by category
            category = job_data.get('category', '').lower()
            if category:
                self.redis.sadd(f"{self.search_index_key}:category:{category}", job_id)
            
            # Index by status
            status = job_data.get('status', '').lower()
            if status:
                self.redis.sadd(f"{self.search_index_key}:status:{status}", job_id)
            
            return True
        
        except Exception as e:
            logger.error(f"Error indexing job {job_id}: {e}")
            return False
    
    def search_jobs(
        self,
        query: Optional[str] = None,
        tags: Optional[List[str]] = None,
        category: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50
    ) -> List[str]:
        """
        Search for jobs
        
        Args:
            query: Text search query
            tags: List of tags to filter by
            category: Category filter
            status: Status filter
            limit: Maximum number of results
        
        Returns:
            List of job IDs
        """
        if not self.redis:
            logger.warning("Redis not available, returning empty results")
            return []
        
        try:
            result_keys = []
            
            # Start with all jobs if no filters
            if not query and not tags and not category and not status:
                # Get all job IDs
                pattern = f"{self.job_index_prefix}*"
                keys = self.redis.keys(pattern)
                result_keys = [key.replace(self.job_index_prefix, "") for key in keys]
            else:
                # Build intersection of filters
                sets_to_intersect = []
                
                # Text search - supports partial word matching
                if query:
                    query_lower = query.lower().strip()
                    if len(query_lower) >= 2:  # Allow searches with 2+ characters
                        # Get all job keys to search through
                        all_job_keys = self.redis.keys(f"{self.job_index_prefix}*")
                        matching_job_ids = set()
                        
                        # Search through job data for partial matches
                        for job_key in all_job_keys:
                            try:
                                job_data_str = self.redis.get(job_key)
                                if job_data_str:
                                    job_data = json.loads(job_data_str)
                                    
                                    # Search in title, description, tags, skills, and category
                                    searchable_fields = [
                                        job_data.get('title', ''),
                                        job_data.get('description', ''),
                                        ' '.join(job_data.get('tags', [])),
                                        job_data.get('category', ''),
                                        ' '.join(job_data.get('skills_required', []))
                                    ]
                                    searchable_text = ' '.join(searchable_fields).lower()
                                    
                                    # Check if query appears anywhere (partial match)
                                    if query_lower in searchable_text:
                                        job_id = job_key.replace(self.job_index_prefix, "")
                                        matching_job_ids.add(job_id)
                            except Exception as e:
                                logger.warning(f"Error processing job {job_key}: {e}")
                                continue
                        
                        # Store matching IDs temporarily for intersection
                        if matching_job_ids:
                            temp_key = f"{self.search_index_key}:temp:query:{hash(query_lower)}"
                            # Clean up old temp key if exists
                            self.redis.delete(temp_key)
                            if matching_job_ids:
                                self.redis.sadd(temp_key, *matching_job_ids)
                                self.redis.expire(temp_key, 60)  # 60 second TTL
                            sets_to_intersect.append(temp_key)
                        else:
                            # No matches, create empty set to ensure no results
                            temp_key = f"{self.search_index_key}:temp:query:empty:{hash(query_lower)}"
                            self.redis.delete(temp_key)
                            self.redis.sadd(temp_key, "no_match_placeholder")
                            self.redis.expire(temp_key, 60)
                            sets_to_intersect.append(temp_key)
                
                # Tag filter
                if tags:
                    tag_sets = [f"{self.tag_index_prefix}{tag.lower()}" for tag in tags]
                    if len(tag_sets) == 1:
                        sets_to_intersect.append(tag_sets[0])
                    else:
                        temp_key = f"{self.search_index_key}:temp:tags"
                        self.redis.sunionstore(temp_key, *tag_sets)
                        sets_to_intersect.append(temp_key)
                
                # Category filter
                if category:
                    sets_to_intersect.append(f"{self.search_index_key}:category:{category.lower()}")
                
                # Status filter
                if status:
                    sets_to_intersect.append(f"{self.search_index_key}:status:{status.lower()}")
                
                # Intersect all sets
                if sets_to_intersect:
                    if len(sets_to_intersect) == 1:
                        result_keys = list(self.redis.smembers(sets_to_intersect[0]))
                    else:
                        temp_result_key = f"{self.search_index_key}:temp:result"
                        self.redis.sinterstore(temp_result_key, *sets_to_intersect)
                        result_keys = list(self.redis.smembers(temp_result_key))
                        self.redis.delete(temp_result_key)
                    
                    # Filter out placeholder values
                    result_keys = [k for k in result_keys if k != "no_match_placeholder"]
                    
                    # Clean up temp keys
                    temp_keys_to_clean = []
                    for key in sets_to_intersect:
                        if ':temp:' in key:
                            temp_keys_to_clean.append(key)
                    for key in temp_keys_to_clean:
                        try:
                            self.redis.delete(key)
                        except:
                            pass
            
            # Limit results
            return result_keys[:limit]
        
        except Exception as e:
            logger.error(f"Error searching jobs: {e}")
            return []
    
    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job data from Redis cache"""
        if not self.redis:
            return None
        
        try:
            job_key = f"{self.job_index_prefix}{job_id}"
            job_data = self.redis.get(job_key)
            if job_data:
                return json.loads(job_data)
            return None
        except Exception as e:
            logger.error(f"Error getting job {job_id}: {e}")
            return None
    
    def delete_job(self, job_id: str) -> bool:
        """Remove job from search index"""
        if not self.redis:
            return False
        
        try:
            job_key = f"{self.job_index_prefix}{job_id}"
            job_data = self.redis.get(job_key)
            
            if job_data:
                job = json.loads(job_data)
                
                # Remove from word indexes
                searchable_text = f"{job.get('title', '')} {job.get('description', '')}".lower()
                words = searchable_text.split()
                for word in words:
                    if len(word) > 2:
                        self.redis.srem(f"{self.search_index_key}:{word}", job_id)
                
                # Remove from tag indexes
                tags = job.get('tags', [])
                for tag in tags:
                    tag_key = f"{self.tag_index_prefix}{tag.lower()}"
                    self.redis.srem(tag_key, job_id)
                
                # Remove from category and status indexes
                category = job.get('category', '').lower()
                if category:
                    self.redis.srem(f"{self.search_index_key}:category:{category}", job_id)
                
                status = job.get('status', '').lower()
                if status:
                    self.redis.srem(f"{self.search_index_key}:status:{status}", job_id)
            
            # Delete job data
            self.redis.delete(job_key)
            return True
        
        except Exception as e:
            logger.error(f"Error deleting job {job_id}: {e}")
            return False
    
    def get_all_tags(self) -> List[str]:
        """Get all available tags"""
        if not self.redis:
            return []
        
        try:
            tags = self.redis.smembers(f"{self.search_index_key}:tags")
            return sorted(list(tags))
        except Exception as e:
            logger.error(f"Error getting tags: {e}")
            return []


# Singleton instance
search_service = SearchService()

