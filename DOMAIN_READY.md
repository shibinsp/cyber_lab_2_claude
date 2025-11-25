# 🌐 Domain Setup Complete: cyyberlabs.com

## ✅ **What's Been Done:**

### 1. **✅ Nginx Installed & Configured**
   - Reverse proxy configured for cyyberlabs.com
   - HTTP (port 80) ready for SSL certificate validation
   - Ports 80 and 443 opened in firewall

### 2. **✅ Certbot Installed**
   - Let's Encrypt SSL certificate tool ready
   - Auto-renewal configured

### 3. **✅ Application Rebranded to "Cyyberlabs"**
   - ✅ Login page
   - ✅ Register page
   - ✅ Dashboard
   - ✅ Admin Panel
   - ✅ Layout/Navigation
   - ✅ Page title
   - ✅ Backend API name
   - ✅ All frontend components

### 4. **✅ Services Restarted**
   - Frontend and backend rebuilt with new branding
   - Running and accessible

---

## 📋 **WHAT YOU NEED TO DO NOW:**

### ⚠️ **CRITICAL: Configure DNS First!**

You MUST point your domain to your server IP before SSL will work.

### **Step 1: Login to Your Domain Registrar**

Where did you buy `cyyberlabs.com`?
- GoDaddy?
- Namecheap?
- Google Domains?
- Cloudflare?
- Other?

**Login there NOW.**

---

### **Step 2: Add DNS Records**

Find the DNS Management section and add these records:

```
┌──────────────────────────────────────────────┐
│  DNS RECORDS TO ADD                          │
├──────────────────────────────────────────────┤
│  Type: A                                     │
│  Name: @                                     │
│  Value: 185.182.187.146                      │
│  TTL: 300 (or leave default)                 │
├──────────────────────────────────────────────┤
│  Type: A                                     │
│  Name: www                                   │
│  Value: 185.182.187.146                      │
│  TTL: 300 (or leave default)                 │
└──────────────────────────────────────────────┘
```

**Screenshot Example (varies by registrar):**
```
Record Type: A
Host: @
Points to: 185.182.187.146
TTL: Automatic

Record Type: A
Host: www
Points to: 185.182.187.146
TTL: Automatic
```

---

### **Step 3: Wait for DNS Propagation**

After adding DNS records:
- **Minimum wait:** 5-10 minutes
- **Typical wait:** 15-30 minutes
- **Maximum wait:** Up to 48 hours (rare)

### **Test DNS from your computer:**

**On Windows:**
```cmd
nslookup cyyberlabs.com
```

**On Mac/Linux:**
```bash
dig cyyberlabs.com +short
```

**Both should return:** `185.182.187.146`

---

### **Step 4: Get SSL Certificate**

Once DNS is working, run this command on your server:

```bash
cd /root/cyber_lab_2_claude
./SSL_SETUP_INSTRUCTIONS.sh
```

**OR manually:**

```bash
certbot --nginx -d cyyberlabs.com -d www.cyyberlabs.com
```

**What you'll be asked:**
1. **Email**: Enter your email (for certificate renewal notices)
2. **Terms of Service**: Type `Y` (yes, agree)
3. **Newsletter**: Type `N` (optional, up to you)

**Expected Success Message:**
```
Congratulations! You have successfully enabled HTTPS on:
- https://cyyberlabs.com
- https://www.cyyberlabs.com
```

---

## 🎯 **After SSL Certificate is Installed:**

### Your application will be live at:

```
✅ https://cyyberlabs.com          (secure, with padlock 🔒)
✅ https://www.cyyberlabs.com      (secure, with padlock 🔒)
✅ http://cyyberlabs.com           (redirects to https://)
✅ http://www.cyyberlabs.com       (redirects to https://)
```

### What works:
- ✅ **Login/Register** with "Cyyberlabs" branding
- ✅ **All 15 Courses** visible on dashboard
- ✅ **All Labs** with working VMs
- ✅ **Quiz system** with score tracking
- ✅ **Admin Panel** with full customization
- ✅ **VM Management** (pause/resume/monitor)
- ✅ **Secure HTTPS** with green padlock

---

## 🔧 **Quick Commands:**

### Test DNS (run from your computer):
```bash
# Should return: 185.182.187.146
ping cyyberlabs.com
```

### Get SSL Certificate (run on server after DNS works):
```bash
certbot --nginx -d cyyberlabs.com -d www.cyyberlabs.com
```

### Check Nginx Status:
```bash
systemctl status nginx
```

### View Nginx Logs:
```bash
tail -f /var/log/nginx/cyyberlabs-access.log
tail -f /var/log/nginx/cyyberlabs-error.log
```

### Restart Services:
```bash
cd /root/cyber_lab_2_claude
docker compose restart frontend backend
```

### Test SSL (after installation):
```bash
curl -I https://cyyberlabs.com
# Should show: HTTP/2 200
```

---

## 📊 **Current Application Status:**

### ✅ Working Now:
- **IP Access**: http://185.182.187.146:1969
- **Application Name**: "Cyyberlabs" (updated)
- **All Features**: Courses, Labs, VMs, Quizzes, Admin Panel
- **VM Password**: cyberlab
- **VM Wallpaper**: Your logo.jpeg

### ⏳ Waiting For:
- **DNS Configuration** (you need to do this)
- **SSL Certificate** (after DNS is working)

---

## 🐛 **Troubleshooting:**

### DNS not working?
```bash
# Check if DNS record exists
dig cyyberlabs.com

# If it shows wrong IP or no results:
# 1. Double-check your domain registrar settings
# 2. Make sure you saved the DNS records
# 3. Wait 15-30 more minutes
# 4. Try from a different device/network
```

### Certbot fails?
```
Error: "Failed authorization procedure"
```
**Solution:** DNS is not pointing to your server yet. Wait and retry.

### Can't access site after SSL?
```bash
# Check if Nginx is running
systemctl status nginx

# Restart Nginx
systemctl restart nginx

# Check certificate
certbot certificates
```

### Firewall blocking?
```bash
# Open ports
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload
```

---

## 📞 **Need Help with DNS?**

### Common Registrar Help Links:

**GoDaddy:**
https://www.godaddy.com/help/add-an-a-record-19238

**Namecheap:**
https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain

**Google Domains:**
https://support.google.com/domains/answer/3290350

**Cloudflare:**
https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/

---

## ✅ **CHECKLIST:**

Use this to track your progress:

```
DNS Configuration:
[ ] Logged into domain registrar
[ ] Added A record: @ → 185.182.187.146
[ ] Added A record: www → 185.182.187.146
[ ] Saved DNS changes
[ ] Waited 15-30 minutes
[ ] Tested: ping cyyberlabs.com shows correct IP

SSL Certificate:
[ ] Ran: ./SSL_SETUP_INSTRUCTIONS.sh
[ ] Entered email address
[ ] Agreed to terms (Y)
[ ] Certificate installed successfully
[ ] Visited: https://cyyberlabs.com
[ ] Green padlock appears in browser

Application:
[ ] Login page shows "Cyyberlabs"
[ ] All 15 courses visible
[ ] Labs load correctly
[ ] VMs work with password "cyberlab"
[ ] Quiz scores display properly
[ ] Admin panel accessible
```

---

## 🎉 **Success Criteria:**

You'll know everything is working when:

1. ✅ `https://cyyberlabs.com` loads with green padlock 🔒
2. ✅ Login page shows "Cyyberlabs" branding
3. ✅ You can login and see all courses
4. ✅ Labs open and VMs work
5. ✅ No browser security warnings

---

## 📝 **Summary of Changes:**

### Files Updated:
- `/etc/nginx/sites-available/cyyberlabs.com` - Nginx config
- `frontend/src/pages/Login.jsx` - Branding
- `frontend/src/pages/Register.jsx` - Branding
- `frontend/src/pages/Dashboard.jsx` - Branding
- `frontend/src/pages/AdminPanel.jsx` - Branding
- `frontend/src/components/Layout.jsx` - Branding
- `frontend/index.html` - Page title
- `backend/app/main.py` - API name

### Packages Installed:
- `nginx` - Web server / reverse proxy
- `certbot` - SSL certificate management
- `python3-certbot-nginx` - Nginx plugin for certbot

### Ports Opened:
- `80/tcp` - HTTP
- `443/tcp` - HTTPS

---

## 🚀 **NEXT STEPS:**

### 1. **Configure DNS NOW** ⬅️ START HERE
   - Login to domain registrar
   - Add the A records shown above
   - Wait 15-30 minutes

### 2. **Test DNS**
   ```bash
   ping cyyberlabs.com
   # Should show: 185.182.187.146
   ```

### 3. **Get SSL Certificate**
   ```bash
   cd /root/cyber_lab_2_claude
   ./SSL_SETUP_INSTRUCTIONS.sh
   ```

### 4. **Test Your Site**
   - Visit: https://cyyberlabs.com
   - Login and verify everything works

### 5. **Celebrate! 🎉**
   - Your cyber range is now live on the internet!
   - With SSL security!
   - Professional branding!

---

**Status**: 🟡 **Waiting for DNS configuration**  
**Action Required**: **Configure DNS at your domain registrar**  
**Server Ready**: ✅ **Yes, all systems go!**

---

**Created**: November 24, 2025  
**Domain**: cyyberlabs.com  
**Server IP**: 185.182.187.146  
**Application**: Cyyberlabs Security Training Platform  
**Version**: 2.0.0

