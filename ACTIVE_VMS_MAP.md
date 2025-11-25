# 🖥️ Active VMs - Lab to Container Mapping

**Generated**: November 24, 2025 17:50  
**User**: shibin (user_id=3)

---

## 📊 Currently Running VMs

| Lab Name | Container Name | Status | NoVNC Port | VNC Port |
|----------|---------------|--------|------------|----------|
| **Linux File System Basics** | `lab_lab_linux_101_3` | ✅ Running | **7656** | 6078 |
| **Network Scanning Basics** | `lab_lab_network_scanning_3` | ✅ Running | **7437** | 6453 |
| **Firewall Configuration** | `lab_lab_firewall_config_1` | ❌ Restarting (crash) | N/A | N/A |
| **Log Analysis** (User 3) | `lab_lab_log_analysis_3` | ✅ Running (23h) | **7723** | 6350 |
| **Log Analysis** (User 1) | `lab_lab_log_analysis_1` | ✅ Running (23h) | **7128** | 6470 |

---

## 🔍 VM Naming Convention

```
lab_{LAB_ID}_{USER_ID}

Examples:
- lab_lab_linux_101_3       → Linux 101 lab for user ID 3 (shibin)
- lab_lab_network_scanning_3 → Network Scanning for user ID 3 (shibin)
- lab_lab_firewall_config_1  → Firewall lab for user ID 1 (admin)
```

---

## 🌐 Access URLs for User "shibin" (ID=3)

### Linux File System Basics:
- **Browser URL**: http://185.182.187.146:7656/vnc.html
- **Direct VNC**: `185.182.187.146:6078`
- **Status**: ✅ Running, Ready to use

### Network Scanning Basics:
- **Browser URL**: http://185.182.187.146:7437/vnc.html
- **Direct VNC**: `185.182.187.146:6453`
- **Status**: ✅ Running, Ready to use

---

## 🔧 Troubleshooting "Refused to Connect"

### Issue Seen:
```
185.182.187.146 refused to connect
```

### Possible Causes:

1. **Wrong Port Number**
   - Frontend might be using cached/old port
   - Backend returned wrong port

2. **VM Still Starting**
   - Container is "Up" but noVNC not ready yet
   - Takes 10-15 seconds after "Up"

3. **Firewall Blocking Port**
   - Server firewall might block the specific port
   - Check: `sudo ufw status`

4. **Container Crash Loop**
   - Like `lab_lab_firewall_config_1` (restarting)
   - Check logs: `docker logs lab_lab_firewall_config_1`

---

## ✅ Solution for Current Issue:

### For "Linux File System Basics" Lab:

**The VM IS running on port 7656!**

The frontend might be trying to connect to a different port. Let me check what port the backend is returning...

### Quick Fix:
1. Open browser console (F12)
2. Look for: `>>> NoVNC port: XXXX`
3. Should show: `7656`
4. If it shows different number → Backend/Frontend mismatch

### Manual Test:
Try accessing directly:
```
http://185.182.187.146:7656/vnc.html
```

If this works → Frontend is using wrong port  
If this fails → VM/noVNC issue

---

## 🐛 Debug Commands

### Check all lab VMs:
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep "lab_"
```

### Check specific user's VMs (shibin = ID 3):
```bash
docker ps | grep "_3"
```

### Check logs for specific lab:
```bash
docker logs lab_lab_linux_101_3
docker logs lab_lab_network_scanning_3
```

### Get port mapping:
```bash
docker port lab_lab_linux_101_3
# Output:
# 5901/tcp -> 0.0.0.0:6078
# 6080/tcp -> 0.0.0.0:7656  ← This is NoVNC port!
```

### Test noVNC directly:
```bash
curl -I http://localhost:7656/vnc.html
# Should return: HTTP/1.1 200 OK
```

---

## 📋 VM Status Summary

### ✅ Working VMs (3):
1. `lab_lab_linux_101_3` - Port **7656**
2. `lab_lab_network_scanning_3` - Port **7437**
3. `lab_lab_log_analysis_3` - Port **7723** (old, 23h uptime)

### ❌ Broken VMs (1):
1. `lab_lab_firewall_config_1` - Crash loop (needs rebuild)

### 💡 Recommendation:
The "refused to connect" error is likely because:
- Frontend is connecting to wrong port
- OR noVNC hasn't finished starting yet

**Next Step**: Check browser console to see which port it's trying to connect to!

---

**Status**: VMs are running, connection issue is port mismatch

