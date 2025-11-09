// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FreelanceEscrow
 * @dev Decentralized escrow contract for freelance marketplace
 * @notice Handles job creation, payments, and dispute resolution
 */
contract FreelanceEscrow is ReentrancyGuard, Pausable, Ownable {
    
    // ============================================
    // STATE VARIABLES
    // ============================================
    
    uint256 public platformFeePercentage = 2; // 2% platform fee
    uint256 public constant MAX_FEE = 10; // Max 10% fee
    uint256 public jobCounter;
    uint256 public disputeCounter;
    
    address public platformWallet;
    
    // ============================================
    // STRUCTS
    // ============================================
    
    enum JobStatus {
        Open,           // Job posted, waiting for freelancer
        InProgress,     // Freelancer accepted, working
        Submitted,      // Work submitted, awaiting approval
        Completed,      // Work approved, payment released
        Disputed,       // Dispute raised
        Cancelled,      // Job cancelled
        Refunded        // Refunded to client
    }
    
    enum DisputeStatus {
        Pending,
        Voting,
        Resolved
    }
    
    struct Job {
        uint256 id;
        address client;
        address freelancer;
        uint256 amount;
        uint256 deadline;
        string title;
        string ipfsHash;        // IPFS hash for job details
        JobStatus status;
        uint256 createdAt;
        uint256 completedAt;
        bool fundsReleased;
    }
    
    struct Dispute {
        uint256 id;
        uint256 jobId;
        address initiator;
        string reason;
        uint256 clientVotes;
        uint256 freelancerVotes;
        DisputeStatus status;
        uint256 createdAt;
    }
    
    // ============================================
    // MAPPINGS
    // ============================================
    
    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Dispute) public disputes;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => uint256[]) public clientJobs;
    mapping(address => uint256[]) public freelancerJobs;
    
    // ============================================
    // EVENTS
    // ============================================
    
    event JobCreated(
        uint256 indexed jobId,
        address indexed client,
        uint256 amount,
        uint256 deadline
    );
    
    event JobAccepted(
        uint256 indexed jobId,
        address indexed freelancer
    );
    
    event WorkSubmitted(
        uint256 indexed jobId,
        string deliverableHash
    );
    
    event JobCompleted(
        uint256 indexed jobId,
        address indexed freelancer,
        uint256 amount
    );
    
    event JobCancelled(
        uint256 indexed jobId,
        address indexed client
    );
    
    event DisputeRaised(
        uint256 indexed disputeId,
        uint256 indexed jobId,
        address indexed initiator
    );
    
    event DisputeVoted(
        uint256 indexed disputeId,
        address indexed voter,
        bool favorClient
    );
    
    event DisputeResolved(
        uint256 indexed disputeId,
        uint256 indexed jobId,
        bool favorClient
    );
    
    event PlatformFeeUpdated(uint256 newFee);
    
    event FundsWithdrawn(address indexed to, uint256 amount);
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    modifier onlyClient(uint256 _jobId) {
        require(jobs[_jobId].client == msg.sender, "Not the client");
        _;
    }
    
    modifier onlyFreelancer(uint256 _jobId) {
        require(jobs[_jobId].freelancer == msg.sender, "Not the freelancer");
        _;
    }
    
    modifier jobExists(uint256 _jobId) {
        require(_jobId > 0 && _jobId <= jobCounter, "Job does not exist");
        _;
    }
    
    modifier jobInStatus(uint256 _jobId, JobStatus _status) {
        require(jobs[_jobId].status == _status, "Invalid job status");
        _;
    }
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor(address _platformWallet) Ownable(msg.sender) {
        require(_platformWallet != address(0), "Invalid platform wallet");
        platformWallet = _platformWallet;
    }
    
    // ============================================
    // CORE FUNCTIONS
    // ============================================
    
    /**
     * @dev Create a new job with escrowed payment
     * @param _title Job title
     * @param _ipfsHash IPFS hash containing job details
     * @param _deadline Job completion deadline (timestamp)
     */
    function createJob(
        string memory _title,
        string memory _ipfsHash,
        uint256 _deadline
    ) external payable whenNotPaused nonReentrant {
        require(msg.value > 0, "Payment required");
        require(_deadline > block.timestamp, "Invalid deadline");
        require(bytes(_title).length > 0, "Title required");
        
        jobCounter++;
        
        Job storage newJob = jobs[jobCounter];
        newJob.id = jobCounter;
        newJob.client = msg.sender;
        newJob.amount = msg.value;
        newJob.deadline = _deadline;
        newJob.title = _title;
        newJob.ipfsHash = _ipfsHash;
        newJob.status = JobStatus.Open;
        newJob.createdAt = block.timestamp;
        
        clientJobs[msg.sender].push(jobCounter);
        
        emit JobCreated(jobCounter, msg.sender, msg.value, _deadline);
    }
    
    /**
     * @dev Freelancer accepts a job
     * @param _jobId ID of the job to accept
     */
    function acceptJob(uint256 _jobId)
        external
        whenNotPaused
        jobExists(_jobId)
        jobInStatus(_jobId, JobStatus.Open)
    {
        Job storage job = jobs[_jobId];
        require(job.client != msg.sender, "Client cannot accept own job");
        require(job.freelancer == address(0), "Job already accepted");
        
        job.freelancer = msg.sender;
        job.status = JobStatus.InProgress;
        
        freelancerJobs[msg.sender].push(_jobId);
        
        emit JobAccepted(_jobId, msg.sender);
    }
    
    /**
     * @dev Freelancer submits completed work
     * @param _jobId ID of the job
     * @param _deliverableHash IPFS hash of the deliverable
     */
    function submitWork(uint256 _jobId, string memory _deliverableHash)
        external
        whenNotPaused
        jobExists(_jobId)
        onlyFreelancer(_jobId)
        jobInStatus(_jobId, JobStatus.InProgress)
    {
        require(bytes(_deliverableHash).length > 0, "Deliverable required");
        
        Job storage job = jobs[_jobId];
        job.status = JobStatus.Submitted;
        
        emit WorkSubmitted(_jobId, _deliverableHash);
    }
    
    /**
     * @dev Client approves work and releases payment
     * @param _jobId ID of the job
     */
    function approveWork(uint256 _jobId)
        external
        whenNotPaused
        nonReentrant
        jobExists(_jobId)
        onlyClient(_jobId)
        jobInStatus(_jobId, JobStatus.Submitted)
    {
        Job storage job = jobs[_jobId];
        require(!job.fundsReleased, "Funds already released");
        
        job.status = JobStatus.Completed;
        job.completedAt = block.timestamp;
        job.fundsReleased = true;
        
        // Calculate platform fee
        uint256 platformFee = (job.amount * platformFeePercentage) / 100;
        uint256 freelancerPayment = job.amount - platformFee;
        
        // Transfer payments
        (bool successFreelancer, ) = job.freelancer.call{value: freelancerPayment}("");
        require(successFreelancer, "Freelancer payment failed");
        
        (bool successPlatform, ) = platformWallet.call{value: platformFee}("");
        require(successPlatform, "Platform fee transfer failed");
        
        emit JobCompleted(_jobId, job.freelancer, freelancerPayment);
    }
    
    /**
     * @dev Cancel job before freelancer accepts (refund client)
     * @param _jobId ID of the job to cancel
     */
    function cancelJob(uint256 _jobId)
        external
        whenNotPaused
        nonReentrant
        jobExists(_jobId)
        onlyClient(_jobId)
    {
        Job storage job = jobs[_jobId];
        require(
            job.status == JobStatus.Open || job.status == JobStatus.InProgress,
            "Cannot cancel at this stage"
        );
        require(!job.fundsReleased, "Funds already released");
        
        // Can only cancel if no freelancer assigned or before work submitted
        if (job.status == JobStatus.InProgress) {
            require(job.freelancer == address(0), "Freelancer already working");
        }
        
        job.status = JobStatus.Cancelled;
        job.fundsReleased = true;
        
        // Refund client
        (bool success, ) = job.client.call{value: job.amount}("");
        require(success, "Refund failed");
        
        emit JobCancelled(_jobId, job.client);
    }
    
    /**
     * @dev Raise a dispute
     * @param _jobId ID of the job
     * @param _reason Reason for dispute
     */
    function raiseDispute(uint256 _jobId, string memory _reason)
        external
        whenNotPaused
        jobExists(_jobId)
    {
        Job storage job = jobs[_jobId];
        require(
            msg.sender == job.client || msg.sender == job.freelancer,
            "Not authorized"
        );
        require(
            job.status == JobStatus.InProgress || job.status == JobStatus.Submitted,
            "Cannot dispute at this stage"
        );
        require(bytes(_reason).length > 0, "Reason required");
        
        job.status = JobStatus.Disputed;
        
        disputeCounter++;
        Dispute storage dispute = disputes[disputeCounter];
        dispute.id = disputeCounter;
        dispute.jobId = _jobId;
        dispute.initiator = msg.sender;
        dispute.reason = _reason;
        dispute.status = DisputeStatus.Voting;
        dispute.createdAt = block.timestamp;
        
        emit DisputeRaised(disputeCounter, _jobId, msg.sender);
    }
    
    /**
     * @dev Vote on a dispute (simplified version - in production use governance tokens)
     * @param _disputeId ID of the dispute
     * @param _favorClient True if voting in favor of client, false for freelancer
     */
    function voteOnDispute(uint256 _disputeId, bool _favorClient)
        external
        whenNotPaused
    {
        Dispute storage dispute = disputes[_disputeId];
        require(dispute.status == DisputeStatus.Voting, "Not in voting phase");
        require(!hasVoted[_disputeId][msg.sender], "Already voted");
        
        hasVoted[_disputeId][msg.sender] = true;
        
        if (_favorClient) {
            dispute.clientVotes++;
        } else {
            dispute.freelancerVotes++;
        }
        
        emit DisputeVoted(_disputeId, msg.sender, _favorClient);
    }
    
    /**
     * @dev Resolve dispute based on votes
     * @param _disputeId ID of the dispute to resolve
     */
    function resolveDispute(uint256 _disputeId)
        external
        whenNotPaused
        nonReentrant
    {
        Dispute storage dispute = disputes[_disputeId];
        require(dispute.status == DisputeStatus.Voting, "Not in voting phase");
        
        uint256 totalVotes = dispute.clientVotes + dispute.freelancerVotes;
        require(totalVotes >= 3, "Not enough votes"); // Minimum 3 votes
        
        Job storage job = jobs[dispute.jobId];
        require(!job.fundsReleased, "Funds already released");
        
        dispute.status = DisputeStatus.Resolved;
        job.fundsReleased = true;
        
        bool favorClient = dispute.clientVotes > dispute.freelancerVotes;
        
        if (favorClient) {
            // Refund client
            job.status = JobStatus.Refunded;
            (bool success, ) = job.client.call{value: job.amount}("");
            require(success, "Client refund failed");
        } else {
            // Pay freelancer
            job.status = JobStatus.Completed;
            uint256 platformFee = (job.amount * platformFeePercentage) / 100;
            uint256 freelancerPayment = job.amount - platformFee;
            
            (bool successFreelancer, ) = job.freelancer.call{value: freelancerPayment}("");
            require(successFreelancer, "Freelancer payment failed");
            
            (bool successPlatform, ) = platformWallet.call{value: platformFee}("");
            require(successPlatform, "Platform fee transfer failed");
        }
        
        emit DisputeResolved(_disputeId, dispute.jobId, favorClient);
    }
    
    /**
     * @dev Emergency withdrawal after deadline expires
     * @param _jobId ID of the job
     */
    function emergencyWithdraw(uint256 _jobId)
        external
        whenNotPaused
        nonReentrant
        jobExists(_jobId)
    {
        Job storage job = jobs[_jobId];
        require(msg.sender == job.client, "Only client can emergency withdraw");
        require(block.timestamp > job.deadline + 30 days, "Deadline not passed");
        require(!job.fundsReleased, "Funds already released");
        require(
            job.status == JobStatus.Open || job.status == JobStatus.InProgress,
            "Invalid status for withdrawal"
        );
        
        job.status = JobStatus.Refunded;
        job.fundsReleased = true;
        
        (bool success, ) = job.client.call{value: job.amount}("");
        require(success, "Emergency withdrawal failed");
        
        emit FundsWithdrawn(job.client, job.amount);
    }
    
    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    function getJob(uint256 _jobId) external view returns (Job memory) {
        return jobs[_jobId];
    }
    
    function getDispute(uint256 _disputeId) external view returns (Dispute memory) {
        return disputes[_disputeId];
    }
    
    function getClientJobs(address _client) external view returns (uint256[] memory) {
        return clientJobs[_client];
    }
    
    function getFreelancerJobs(address _freelancer) external view returns (uint256[] memory) {
        return freelancerJobs[_freelancer];
    }
    
    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= MAX_FEE, "Fee too high");
        platformFeePercentage = _newFee;
        emit PlatformFeeUpdated(_newFee);
    }
    
    function updatePlatformWallet(address _newWallet) external onlyOwner {
        require(_newWallet != address(0), "Invalid address");
        platformWallet = _newWallet;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============================================
    // FALLBACK
    // ============================================
    
    receive() external payable {
        revert("Direct payments not allowed");
    }
}
