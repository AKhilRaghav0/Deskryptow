#!/bin/bash

################################################################################
# 🛑 STOP SCRIPT
# Freelance Escrow Platform - Stop all services
################################################################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# PID file locations
BACKEND_PID_FILE=".backend.pid"
FRONTEND_PID_FILE=".frontend.pid"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   🛑 Stopping Freelance Escrow Platform 🛑                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

STOPPED_COUNT=0

################################################################################
# STOP BACKEND
################################################################################

if [ -f "$BACKEND_PID_FILE" ]; then
    BACKEND_PID=$(cat $BACKEND_PID_FILE)
    
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${BLUE}Stopping backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null
        
        # Wait for process to stop
        for i in {1..5}; do
            if ! ps -p $BACKEND_PID > /dev/null 2>&1; then
                break
            fi
            sleep 1
        done
        
        # Force kill if still running
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo -e "${YELLOW}Force killing backend...${NC}"
            kill -9 $BACKEND_PID 2>/dev/null
        fi
        
        echo -e "${GREEN}✓ Backend stopped${NC}"
        STOPPED_COUNT=$((STOPPED_COUNT + 1))
    else
        echo -e "${YELLOW}⚠ Backend PID file exists but process is not running${NC}"
    fi
    
    rm -f $BACKEND_PID_FILE
else
    echo -e "${YELLOW}⚠ Backend is not running${NC}"
fi

echo ""

################################################################################
# STOP FRONTEND
################################################################################

if [ -f "$FRONTEND_PID_FILE" ]; then
    FRONTEND_PID=$(cat $FRONTEND_PID_FILE)
    
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${BLUE}Stopping frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null
        
        # Wait for process to stop
        for i in {1..5}; do
            if ! ps -p $FRONTEND_PID > /dev/null 2>&1; then
                break
            fi
            sleep 1
        done
        
        # Force kill if still running
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            echo -e "${YELLOW}Force killing frontend...${NC}"
            kill -9 $FRONTEND_PID 2>/dev/null
        fi
        
        echo -e "${GREEN}✓ Frontend stopped${NC}"
        STOPPED_COUNT=$((STOPPED_COUNT + 1))
    else
        echo -e "${YELLOW}⚠ Frontend PID file exists but process is not running${NC}"
    fi
    
    rm -f $FRONTEND_PID_FILE
else
    echo -e "${YELLOW}⚠ Frontend is not running${NC}"
fi

echo ""

################################################################################
# CLEANUP
################################################################################

# Also kill any stray uvicorn or vite processes (optional)
echo -e "${BLUE}Cleaning up any stray processes...${NC}"

# Kill stray uvicorn processes on port 8000
STRAY_BACKEND=$(lsof -ti:8000 2>/dev/null)
if [ ! -z "$STRAY_BACKEND" ]; then
    echo -e "${YELLOW}Found stray backend process on port 8000, killing...${NC}"
    kill $STRAY_BACKEND 2>/dev/null || true
fi

# Kill stray vite processes on port 3000
STRAY_FRONTEND=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$STRAY_FRONTEND" ]; then
    echo -e "${YELLOW}Found stray frontend process on port 3000, killing...${NC}"
    kill $STRAY_FRONTEND 2>/dev/null || true
fi

echo ""

################################################################################
# SUMMARY
################################################################################

if [ $STOPPED_COUNT -gt 0 ]; then
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║           🎉 All Services Stopped! 🎉                      ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${GREEN}✅ Stopped $STOPPED_COUNT service(s)${NC}"
else
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║           ℹ️  No Services Running ℹ️                       ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${BLUE}No services were running${NC}"
fi

echo ""
echo "💡 To start services again, run:"
echo "   ${YELLOW}./start.sh${NC}"
echo ""

exit 0
