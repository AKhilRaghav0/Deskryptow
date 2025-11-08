#!/bin/bash

################################################################################
# 📊 STATUS SCRIPT
# Freelance Escrow Platform - Check status of all services
################################################################################

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

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   📊 Freelance Escrow Platform - Status 📊                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

################################################################################
# CHECK BACKEND
################################################################################

echo -e "${BLUE}━━━ Backend Status ━━━${NC}"
if [ -f "$BACKEND_PID_FILE" ]; then
    BACKEND_PID=$(cat $BACKEND_PID_FILE)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Running${NC} (PID: $BACKEND_PID)"
        echo "  URL: ${CYAN}http://localhost:8000${NC}"
        echo "  API Docs: ${CYAN}http://localhost:8000/docs${NC}"
        echo "  Logs: tail -f logs/backend.log"
        
        # Check if port is actually listening
        if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "  ${GREEN}✓ Port 8000 is listening${NC}"
        else
            echo -e "  ${YELLOW}⚠ Port 8000 is not listening${NC}"
        fi
    else
        echo -e "${RED}✗ Not running${NC} (stale PID file)"
        rm -f $BACKEND_PID_FILE
    fi
else
    echo -e "${YELLOW}✗ Not running${NC}"
fi

echo ""

################################################################################
# CHECK FRONTEND
################################################################################

echo -e "${BLUE}━━━ Frontend Status ━━━${NC}"
if [ -f "$FRONTEND_PID_FILE" ]; then
    FRONTEND_PID=$(cat $FRONTEND_PID_FILE)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Running${NC} (PID: $FRONTEND_PID)"
        echo "  URL: ${CYAN}http://localhost:3000${NC}"
        echo "  Logs: tail -f logs/frontend.log"
        
        # Check if port is actually listening
        if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "  ${GREEN}✓ Port 3000 is listening${NC}"
        else
            echo -e "  ${YELLOW}⚠ Port 3000 is not listening${NC}"
        fi
    else
        echo -e "${RED}✗ Not running${NC} (stale PID file)"
        rm -f $FRONTEND_PID_FILE
    fi
else
    echo -e "${YELLOW}✗ Not running${NC}"
fi

echo ""

################################################################################
# CHECK PORTS
################################################################################

echo -e "${BLUE}━━━ Port Status ━━━${NC}"

# Check port 8000 (Backend)
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    PORT_8000_PID=$(lsof -ti:8000)
    echo -e "Port 8000: ${GREEN}✓ In use${NC} (PID: $PORT_8000_PID)"
else
    echo -e "Port 8000: ${YELLOW}✗ Available${NC}"
fi

# Check port 3000 (Frontend)
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    PORT_3000_PID=$(lsof -ti:3000)
    echo -e "Port 3000: ${GREEN}✓ In use${NC} (PID: $PORT_3000_PID)"
else
    echo -e "Port 3000: ${YELLOW}✗ Available${NC}"
fi

echo ""

################################################################################
# CHECK ENVIRONMENT
################################################################################

echo -e "${BLUE}━━━ Environment ━━━${NC}"

# Check .env file
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
else
    echo -e "${RED}✗ .env file missing${NC}"
    echo "  Run: cp .env.example .env"
fi

# Check if dependencies are installed
if [ -d "blockchain/node_modules" ]; then
    echo -e "${GREEN}✓ Blockchain dependencies installed${NC}"
else
    echo -e "${YELLOW}✗ Blockchain dependencies not installed${NC}"
    echo "  Run: cd blockchain && npm install"
fi

if [ -d "backend/venv" ]; then
    echo -e "${GREEN}✓ Backend virtual environment exists${NC}"
else
    echo -e "${YELLOW}✗ Backend virtual environment missing${NC}"
    echo "  Run: cd backend && python3 -m venv venv"
fi

if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${YELLOW}✗ Frontend dependencies not installed${NC}"
    echo "  Run: cd frontend && npm install"
fi

echo ""

################################################################################
# SUMMARY & COMMANDS
################################################################################

echo -e "${BLUE}━━━ Quick Commands ━━━${NC}"
echo "  Start:   ${CYAN}./start.sh${NC}"
echo "  Stop:    ${CYAN}./stop.sh${NC}"
echo "  Restart: ${CYAN}./restart.sh${NC}"
echo "  Status:  ${CYAN}./status.sh${NC}"
echo ""

exit 0
