# VM Start Issue - Enhanced Debugging Deployed

## Changes Made

### Enhanced Error Logging in Frontend

Added comprehensive console logging to `CyberRange.jsx` startVm function:

```javascript
const startVm = async () => {
  console.log('>>> Starting VM for lab:', labId);

  // Makes API call
  const res = await axios.post(`${API_URL}/vm/start/${labId}`, ...);

  console.log('>>> VM Start Response:', res.data);
  console.log('>>> Response status:', res.data.status);
  console.log('>>> NoVNC port:', res.data.novnc_port);

  // Validates port exists
  if (!port) {
    throw new Error('No NoVNC port returned from server');
  }

  // Sets VM state
  setVmPort(port);
  setVmStatus('running');

  // Shows alert on error
  catch (err) {
    alert(`VM Start Failed: ${errorMsg}`);
  }
}
```

## Deployment

✅ **New Bundle**: `index-H35_86hp.js` (597KB)
✅ **Frontend Rebuilt and Deployed**
✅ **Backend Running**: Healthy

## How to Debug VM Start Issue

### Step 1: Clear Browser Cache
```
Ctrl + Shift + Delete
Clear "Cached images and files"
Time: "All time"
```

### Step 2: Hard Refresh
```
Ctrl + F5
```

### Step 3: Open Browser Console
```
Press F12
Go to Console tab
```

### Step 4: Try to Start VM

Click "Start VM" button and watch the console. You'll see:

#### If Successful:
```
>>> Starting VM for lab: lab_linux_101
>>> VM Start Response: {status: "started", novnc_port: 7123, ...}
>>> Response status: started
>>> NoVNC port: 7123
>>> ✓ VM started successfully on port: 7123
>>> Will connect to: http://185.182.187.146:7123/vnc.html
```

#### If Error Occurs:
```
>>> Starting VM for lab: lab_linux_101
>>> VM Start Error: Error: [specific error]
>>> Error response: {detail: "[error message]"}
>>> Error message: [description]
```

**Plus an alert popup showing the error!**

## Common VM Start Issues

### Issue 1: VM Image Not Found
**Error**: "VM image not found. Please build it first."

**Solution**:
```bash
cd vm/
docker build -t cyberlab-vm:latest .
```

**Check**:
```bash
docker images | grep cyberlab-vm
```

### Issue 2: Port Already in Use
**Error**: "Port is already allocated"

**Solution**:
```bash
# Stop conflicting container
docker ps | grep lab_
docker stop [container_name]
```

### Issue 3: Docker Permission Denied
**Error**: "Permission denied while trying to connect to Docker daemon"

**Solution**:
```bash
# Check Docker socket permissions
ls -la /var/run/docker.sock

# Should show permissions like: srw-rw---- docker
# Backend container needs access
```

### Issue 4: Memory/CPU Limit
**Error**: "Cannot allocate memory" or "CPU quota exceeded"

**Solution**: Check Docker resources:
```bash
docker system info | grep -i memory
docker system info | grep -i cpu
```

### Issue 5: Container Name Conflict
**Error**: "Container name already in use"

**Solution**:
```bash
# Remove old container
docker rm -f lab_[lab_id]_[user_id]
```

## Backend VM API Status

### Check Backend Logs:
```bash
docker logs cyberlab_backend 2>&1 | grep "POST /vm/start" | tail -10
```

### Expected Response from `/vm/start/{lab_id}`:
```json
{
  "status": "started",
  "container_id": "abc123def456",
  "vnc_port": 6123,
  "novnc_port": 7123,
  "message": "VM started successfully"
}
```

### Check Running VMs:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "lab_"
```

## Current VM Status

Based on logs, VMs ARE starting:
```
✓ POST /vm/start/lab_network_scanning HTTP/1.1 200 OK
✓ POST /vm/start/lab_firewall_config HTTP/1.1 200 OK
✓ POST /vm/start/lab_steganography HTTP/1.1 200 OK
```

**This means backend is working!**

## Frontend Checks

### Verify New Bundle is Loaded:
1. Open browser to: http://185.182.187.146:1969
2. Press F12 → Network tab
3. Click "Start Lab"
4. Look for: `index-H35_86hp.js`
5. If you see old bundle (`index-BRnFHd19.js`), clear cache!

### Check API URL:
Open console and type:
```javascript
console.log(window.location.hostname)
// Should show: 185.182.187.146
```

## Testing VM Connectivity

### Check NoVNC Port is Open:
```bash
# If VM started on port 7123
curl -s http://185.182.187.146:7123/vnc.html | head -5
```

Should return HTML content.

### Check VNC Port:
```bash
# If VNC port is 6123
nc -zv 185.182.187.146 6123
```

Should show "Connection successful"

## What to Share if Still Having Issues

1. **Browser Console Output** (F12 → Console)
   - Copy all messages starting with `>>>`
   - Include any error messages

2. **Backend Logs**:
   ```bash
   docker logs cyberlab_backend 2>&1 | tail -50
   ```

3. **Running Containers**:
   ```bash
   docker ps
   ```

4. **Network Tab** (F12 → Network)
   - Filter: `/vm/start`
   - Show Request/Response

## Quick Test

Run this to test VM start manually:
```bash
# Get a valid user token first (login via browser)
# Then test:
curl -X POST "http://185.182.187.146:2026/vm/start/lab_linux_101" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

Should return:
```json
{
  "status": "started",
  "novnc_port": 7XXX,
  ...
}
```

## Summary

✅ Enhanced error logging deployed
✅ Alert popup added for errors
✅ Detailed console logging active
✅ Backend returning 200 OK for VM starts
✅ cyberlab-vm image exists

**Next Step**: Clear cache, refresh, click "Start VM", and check console!

The detailed logs will tell us exactly what's happening.

---

**Deployed**: 2025-11-24 10:44
**Bundle**: `index-H35_86hp.js`
**Status**: Ready for testing
