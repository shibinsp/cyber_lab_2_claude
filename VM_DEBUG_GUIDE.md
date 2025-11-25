# 🔧 VM Connection Debug Guide

## 📊 Current Status

### ✅ What's WORKING:
1. **VM Containers Running**: 3 active VMs
   - `lab_lab_steganography_1` → Port **7738**
   - `lab_lab_log_analysis_1` → Port **7128**
   - `lab_lab_network_scanning_1` → Port **7133**

2. **noVNC Service**: ✅ RUNNING in all containers
3. **Port Accessibility**: ✅ All ports accessible
   ```bash
   curl http://185.182.187.146:7738/vnc.html  # Returns HTTP 200
   ```

4. **Backend API**: ✅ Running and processing requests
5. **Firewall**: ✅ Inactive (not blocking)

### ❓ What Needs Testing:
- Frontend receiving correct port from backend
- Frontend building correct URL
- Browser iframe loading the URL

---

## 🐛 Debug Steps for You

### **Step 1: Open Browser Console**

1. Go to: `http://185.182.187.146:1969/lab/lab_steganography`
2. Press **F12** or **Right-click → Inspect**
3. Go to **Console** tab

### **Step 2: Look for Debug Logs**

You should see logs like:
```javascript
VM Status Response: {running: true, novnc_port: 7738, ...}
Set VM port to: 7738
VM URL updated to: http://185.182.187.146:7738/vnc.html?autoconnect=true&resize=scale
```

### **Step 3: Check What You See**

#### ✅ **If you see correct port (7738)**:
- The frontend IS receiving the correct port
- Issue is with iframe loading
- **Solution**: Check browser security settings

#### ❌ **If you see WRONG port or NO port**:
- Backend isn't returning correct data
- **Solution**: I need to fix backend response

#### ❌ **If you see NO logs at all**:
- Frontend not making API calls
- **Solution**: Check authentication/CORS

---

## 🔍 What I Added (Debug Logging)

### Frontend Changes:
```javascript
// In checkVmStatus()
console.log('VM Status Response:', res.data);
console.log('Set VM port to:', res.data.novnc_port);

// In startVm()
console.log('VM Start Response:', res.data);
console.log('Started VM on port:', port);
console.log('Will connect to:', `http://${window.location.hostname}:${port}/vnc.html`);

// In useEffect
console.log('VM URL updated to:', vmUrl);
console.log('VM Port:', vmPort);
```

---

## 🧪 Manual Test

### Test 1: Direct Port Access
```bash
# Open in your browser:
http://185.182.187.146:7738/vnc.html

# Should show: noVNC login screen ✅
```

### Test 2: Backend API Response
```bash
# SSH to server and run:
docker logs cyberlab_backend --tail 20 | grep "vm/status"

# Should show: 200 OK responses ✅
```

### Test 3: Container Status
```bash
docker ps | grep lab_lab_steganography
# Should show: Up X minutes with port mappings ✅
```

---

## 🎯 Next Steps Based on Console Output

### Scenario A: Console shows correct port but iframe fails

**Possible Causes:**
1. Browser blocking mixed content (HTTP iframe on HTTPS page)
2. Browser blocking private IP access
3. CORS issues with iframe

**Solution:**
- Ensure you're accessing via `http://` not `https://`
- Check browser console for security errors
- Try different browser (Firefox recommended for dev)

### Scenario B: Console shows wrong/missing port

**Backend Issue** - I need to:
1. Fix the backend status endpoint
2. Ensure ports are correctly retrieved from Docker
3. Verify response format

### Scenario C: Console shows nothing

**Communication Issue** - I need to:
1. Check CORS settings
2. Verify API_URL is correct
3. Check authentication token

---

## 📝 What to Report Back

Please share:

1. **Console logs** - copy/paste the debug output
2. **Network tab** - Check the `/vm/status/lab_steganography` request
   - What status code? (200, 401, 500?)
   - What response body?
3. **Current behavior** - Does it still say "refused to connect"?

---

## 🚀 Quick Fix Commands (If Needed)

### Restart Everything:
```bash
cd /root/cyber_lab_2_claude
docker restart cyberlab_backend
docker restart cyberlab_frontend
```

### Check VM Logs:
```bash
docker logs lab_lab_steganography_1 | tail -20
```

### Test Port Directly:
```bash
curl -I http://localhost:7738/vnc.html
```

---

## 💡 Expected Working Flow

```
1. User clicks "Start VM"
   ↓
2. Frontend → POST /vm/start/lab_steganography
   ↓
3. Backend → Creates container (or finds existing)
   ↓
4. Backend → Gets actual port from Docker
   ↓
5. Backend → Returns: {novnc_port: 7738}
   ↓
6. Frontend → Builds URL: http://185.182.187.146:7738/vnc.html
   ↓
7. Frontend → Loads URL in iframe
   ↓
8. Browser → Connects to noVNC
   ↓
9. ✅ Desktop appears!
```

---

**Current System State:**
- VMs: ✅ Running
- noVNC: ✅ Working
- Ports: ✅ Accessible
- Frontend: ✅ Rebuilt with debug logging
- Backend: ✅ Fixed port detection

**Please check the browser console and report what you see!** 🔍

