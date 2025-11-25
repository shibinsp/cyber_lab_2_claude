#!/bin/bash

echo "================================"
echo "Lab Page Debug Test Script"
echo "================================"
echo ""

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "Server IP: $SERVER_IP"
echo ""

# Test frontend
echo "1. Testing Frontend Access..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://$SERVER_IP:1969/)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "   ✓ Frontend accessible (HTTP $FRONTEND_RESPONSE)"
else
    echo "   ✗ Frontend error (HTTP $FRONTEND_RESPONSE)"
fi
echo ""

# Test backend
echo "2. Testing Backend API..."
BACKEND_RESPONSE=$(curl -s http://$SERVER_IP:2026/)
if echo "$BACKEND_RESPONSE" | grep -q "ISC Cyber Range API"; then
    echo "   ✓ Backend accessible"
    echo "   Response: $BACKEND_RESPONSE"
else
    echo "   ✗ Backend error"
fi
echo ""

# Check environment variables
echo "3. Checking Environment Variables..."
echo "   ALLOWED_ORIGINS:"
grep ALLOWED_ORIGINS .env
echo ""
echo "   VITE_API_URL:"
grep VITE_API_URL .env
echo ""

# Check Docker containers
echo "4. Checking Docker Containers..."
docker ps --format "   {{.Names}}: {{.Status}}" --filter "name=cyberlab"
echo ""

# Check backend logs for lab requests
echo "5. Recent Lab API Requests (last 10)..."
docker logs cyberlab_backend 2>&1 | grep "labs/" | tail -10 | sed 's/^/   /'
echo ""

echo "================================"
echo "Test Complete"
echo "================================"
echo ""
echo "To test the lab page:"
echo "1. Open browser: http://$SERVER_IP:1969"
echo "2. Login and go to Labs"
echo "3. Click 'Start Lab' button"
echo "4. Open browser console (F12) and check for:"
echo "   - '>>> FETCHING LAB' messages"
echo "   - '>>> Lab Response Status' messages"
echo "   - '>>> RENDERING' messages"
echo ""
echo "Expected console logs:"
echo "   === CyberRange Component Mounted ==="
echo "   >>> FETCHING LAB: lab_linux_101"
echo "   >>> Lab Response Status: 200"
echo "   >>> ✓ Lab loaded successfully"
echo "   >>> RENDERING: Lab interface"
echo ""
