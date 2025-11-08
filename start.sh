#!/bin/bash

################################################################################
# 🚀 START SCRIPT
# Freelance Escrow Platform - Start all services
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# PID file locations
BACKEND_PID_FILE=".backend.pid"
FRONTEND_PID_FILE=".frontend.pid"

# Log files
BACKEND_LOG="logs/backend.log"
FRONTEND_LOG="logs/frontend.log"

# Create logs directory
mkdir -p logs

################################################################################
# HELP
################################################################################

show_help() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║   🚀 Freelance Escrow Platform - Start Script 🚀          ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Usage: ./start.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help          Show this help message"
    echo "  --backend-only  Start only the backend server"
    echo "  --frontend-only Start only the frontend dev server"
    echo "  --check         Check status of running services"
    echo ""
    echo "Examples:"
    echo "  ./start.sh                # Start all services"
    echo "  ./start.sh --backend-only # Start only backend"
    echo "  ./start.sh --check        # Check status"
    echo ""
    exit 0
}

################################################################################
# CHECK STATUS
################################################################################

check_status() {
    echo -e "${BLUE}Checking service status...${NC}"
    echo ""
    
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat $BACKEND_PID_FILE)
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Backend is running (PID: $BACKEND_PID)${NC}"
            echo "  URL: http://localhost:8000"
            echo "  Docs: http://localhost:8000/docs"
        else
            echo -e "${RED}✗ Backend PID file exists but process is not running${NC}"
            rm -f $BACKEND_PID_FILE
        fi
    else
        echo -e "${YELLOW}✗ Backend is not running${NC}"
    fi
    
    echo ""
    
    if [ -f "$FRONTEND_PID_FILE" ]; then
        FRONTEND_PID=$(cat $FRONTEND_PID_FILE)
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            echo -e "${GREEN}✓ Frontend is running (PID: $FRONTEND_PID)${NC}"
            echo "  URL: http://localhost:3000"
        else
            echo -e "${RED}✗ Frontend PID file exists but process is not running${NC}"
            rm -f $FRONTEND_PID_FILE
        fi
    else
        echo -e "${YELLOW}✗ Frontend is not running${NC}"
    fi
    
    echo ""
    exit 0
}

################################################################################
# STOP EXISTING SERVICES
################################################################################

stop_existing() {
    if [ -f "$BACKEND_PID_FILE" ]; then
        BACKEND_PID=$(cat $BACKEND_PID_FILE)
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping existing backend (PID: $BACKEND_PID)...${NC}"
            kill $BACKEND_PID 2>/dev/null || true
            rm -f $BACKEND_PID_FILE
        fi
    fi
    
    if [ -f "$FRONTEND_PID_FILE" ]; then
        FRONTEND_PID=$(cat $FRONTEND_PID_FILE)
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping existing frontend (PID: $FRONTEND_PID)...${NC}"
            kill $FRONTEND_PID 2>/dev/null || true
            rm -f $FRONTEND_PID_FILE
        fi
    fi
}

################################################################################
# START BACKEND
################################################################################

start_backend() {
    echo -e "${BLUE}[1/2] Starting backend server...${NC}"
    
    cd backend
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo -e "${RED}❌ Virtual environment not found!${NC}"
        echo "Please run ./install.sh first"
        exit 1
    fi
    
    # Activate virtual environment and start server
    source venv/bin/activate
    
    echo "Starting FastAPI server..."
    nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > "../$BACKEND_LOG" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "../$BACKEND_PID_FILE"
    
    cd ..
    
    # Wait a moment and check if it started
    sleep 2
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend started successfully (PID: $BACKEND_PID)${NC}"
        echo "  URL: ${CYAN}http://localhost:8000${NC}"
        echo "  Docs: ${CYAN}http://localhost:8000/docs${NC}"
        echo "  Logs: ${CYAN}tail -f $BACKEND_LOG${NC}"
    else
        echo -e "${RED}❌ Backend failed to start. Check logs: tail -f $BACKEND_LOG${NC}"
        exit 1
    fi
    
    echo ""
}

################################################################################
# START FRONTEND
################################################################################

start_frontend() {
    echo -e "${BLUE}[2/2] Starting frontend dev server...${NC}"
    
    cd frontend
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${RED}❌ node_modules not found!${NC}"
        echo "Please run ./install.sh first"
        exit 1
    fi
    
    echo "Starting Vite dev server..."
    nohup npm run dev > "../$FRONTEND_LOG" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "../$FRONTEND_PID_FILE"
    
    cd ..
    
    # Wait a moment and check if it started
    sleep 3
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend started successfully (PID: $FRONTEND_PID)${NC}"
        echo "  URL: ${CYAN}http://localhost:3000${NC}"
        echo "  Logs: ${CYAN}tail -f $FRONTEND_LOG${NC}"
    else
        echo -e "${RED}❌ Frontend failed to start. Check logs: tail -f $FRONTEND_LOG${NC}"
        exit 1
    fi
    
    echo ""
}

################################################################################
# MAIN
################################################################################

# Parse arguments
BACKEND_ONLY=false
FRONTEND_ONLY=false

for arg in "$@"; do
    case $arg in
        --help)
            show_help
            ;;
        --backend-only)
            BACKEND_ONLY=true
            ;;
        --frontend-only)
            FRONTEND_ONLY=true
            ;;
        --check)
            check_status
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   🚀 Starting Freelance Escrow Platform 🚀                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Stop existing services
stop_existing

# Start services based on flags
if [ "$BACKEND_ONLY" = true ]; then
    start_backend
elif [ "$FRONTEND_ONLY" = true ]; then
    start_frontend
else
    start_backend
    start_frontend
fi

################################################################################
# SUCCESS
################################################################################

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              🎉 All Services Started! 🎉                   ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Platform is running!${NC}"
echo ""
echo "🌐 URLs:"
echo "  Frontend:  ${CYAN}http://localhost:3000${NC}"
echo "  Backend:   ${CYAN}http://localhost:8000${NC}"
echo "  API Docs:  ${CYAN}http://localhost:8000/docs${NC}"
echo ""
echo "📊 View Logs:"
echo "  Backend:   ${YELLOW}tail -f $BACKEND_LOG${NC}"
echo "  Frontend:  ${YELLOW}tail -f $FRONTEND_LOG${NC}"
echo ""
echo "🛑 Stop Services:"
echo "  Run: ${YELLOW}./stop.sh${NC}"
echo ""
echo "📝 Check Status:"
echo "  Run: ${YELLOW}./start.sh --check${NC}"
echo ""
echo "🎬 Ready to develop! Open http://localhost:3000 in your browser."
echo ""

exit 0
