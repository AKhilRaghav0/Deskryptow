# Network Access Guide

## Your Mac's Network IP
**IP Address:** 192.168.0.33

## Accessing from Another Device

### Step 1: Ensure Both Devices Are on Same Network
- Both devices must be connected to the same Wi-Fi network

### Step 2: Access Frontend
Open in browser on the other laptop:
```
http://192.168.0.33:3000
```

### Step 3: Backend API
The frontend will automatically detect and use:
```
http://192.168.0.33:8000
```

## Troubleshooting

### If Backend Still Not Working:

1. **Check Backend is Running:**
   ```bash
   # On this Mac, verify backend is running:
   curl http://localhost:8000/health
   ```

2. **Test from Other Laptop:**
   Open browser on other laptop and visit:
   ```
   http://192.168.0.33:8000/health
   ```
   Should return: `{"status":"healthy","environment":"development"}`

3. **Check Firewall:**
   - macOS Firewall is currently disabled (good)
   - If enabled, allow Python/uvicorn through firewall

4. **Verify Network:**
   - Both devices must be on same Wi-Fi
   - Try pinging from other laptop: `ping 192.168.0.33`

5. **Manual API URL Override:**
   If auto-detection doesn't work, create `.env` file in `frontend/`:
   ```
   VITE_API_URL=http://192.168.0.33:8000
   ```
   Then restart frontend.

## Current Status
- ✅ Backend running on: 0.0.0.0:8000
- ✅ Frontend running on: 0.0.0.0:3000
- ✅ CORS configured for local network
- ✅ Firewall disabled

## Quick Test Commands

**From other laptop (in browser or terminal):**
```
# Test backend health
http://192.168.0.33:8000/health

# Test backend root
http://192.168.0.33:8000/

# Test API docs
http://192.168.0.33:8000/docs
```
