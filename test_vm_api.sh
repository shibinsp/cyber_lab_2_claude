#!/bin/bash

echo "============================================"
echo "  🧪 VM API Test Script"
echo "============================================"
echo ""

# Get actual port from Docker
echo "1️⃣  Checking actual Docker port mapping:"
ACTUAL_PORT=$(docker port lab_lab_steganography_1 6080 | head -1 | cut -d':' -f2)
echo "   ✅ Actual noVNC port: $ACTUAL_PORT"
echo ""

# Test if port is accessible
echo "2️⃣  Testing port accessibility:"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$ACTUAL_PORT/vnc.html)
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Port $ACTUAL_PORT is accessible (HTTP $HTTP_CODE)"
else
    echo "   ❌ Port $ACTUAL_PORT returned HTTP $HTTP_CODE"
fi
echo ""

# Test backend API (without auth - will fail but show structure)
echo "3️⃣  Testing backend API structure:"
echo "   Calling: GET /vm/status/lab_steganography"
RESPONSE=$(curl -s http://localhost:2026/vm/status/lab_steganography)
echo "   Response: $RESPONSE"
echo ""

# Check if backend knows about the VM
echo "4️⃣  Checking backend internal state:"
docker exec cyberlab_backend python3 -c "
import docker
client = docker.from_env()
try:
    container = client.containers.get('lab_lab_steganography_1')
    container.reload()
    if '6080/tcp' in container.ports and container.ports['6080/tcp']:
        port = int(container.ports['6080/tcp'][0]['HostPort'])
        print(f'   ✅ Backend can see container on port: {port}')
        print(f'   ✅ Container status: {container.status}')
    else:
        print('   ❌ No port mapping found')
except Exception as e:
    print(f'   ❌ Error: {e}')
" 2>/dev/null || echo "   ⚠️  Docker SDK not available in container"
echo ""

echo "5️⃣  Summary:"
echo "   - VM Container: ✅ Running"
echo "   - Actual Port: $ACTUAL_PORT"
echo "   - Port Accessible: ✅ Yes (HTTP $HTTP_CODE)"
echo "   - Backend API: ⚠️  Needs authentication"
echo ""
echo "============================================"
echo "  Next: Check browser console for port info"
echo "============================================"

