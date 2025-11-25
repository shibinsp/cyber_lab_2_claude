# 🌐 Cyyberlabs - Domain & SSL Setup

## ✅ **EVERYTHING IS READY!**

Your Cyyberlabs platform has been fully configured and rebranded. All that's left is to configure DNS and get your SSL certificate.

---

## 🎯 **Current Status:**

### ✅ **Completed:**
- ✅ **Application rebranded to "Cyyberlabs"** everywhere
- ✅ **Nginx configured** for cyyberlabs.com domain
- ✅ **Certbot installed** for SSL certificates
- ✅ **Ports opened** (80 for HTTP, 443 for HTTPS)
- ✅ **All 15 courses** working
- ✅ **All labs** with separate VMs
- ✅ **VM password** set to "cyberlab"
- ✅ **VM wallpaper** using your logo
- ✅ **Admin panel** fully functional
- ✅ **Quiz system** tracking scores
- ✅ **VM lifecycle management** (pause/resume)

### ⏳ **Pending (Requires Your Action):**
- [ ] Configure DNS at domain registrar
- [ ] Wait for DNS propagation
- [ ] Run SSL certificate setup

---

## 📋 **DNS Configuration (DO THIS NOW):**

### **Step 1: Login to Your Domain Registrar**

Go to where you bought **cyyberlabs.com** (examples: GoDaddy, Namecheap, Cloudflare, Google Domains, etc.)

### **Step 2: Find DNS Management**

Look for:
- "DNS Settings"
- "DNS Management"
- "Manage DNS"
- "Advanced DNS"

### **Step 3: Add These Records**

**Record 1:**
```
Type: A
Name: @ (or leave blank, or use @)
Value: 185.182.187.146
TTL: 300 (or Auto/Default)
```

**Record 2:**
```
Type: A
Name: www
Value: 185.182.187.146
TTL: 300 (or Auto/Default)
```

### **Step 4: Save and Wait**

- Click "Save" or "Add Record"
- Wait 15-30 minutes for DNS propagation
- In rare cases, can take up to 48 hours

---

## 🧪 **Test DNS (After 15-30 Minutes):**

### **From Your Computer:**

**Windows:**
```cmd
nslookup cyyberlabs.com
```

**Mac/Linux:**
```bash
dig cyyberlabs.com +short
```

**Both methods should return:** `185.182.187.146`

**Or simply:**
```bash
ping cyyberlabs.com
```
Should show: `PING cyyberlabs.com (185.182.187.146)`

---

## 🔒 **Get SSL Certificate (After DNS Works):**

### **Automated Method (Recommended):**

```bash
cd /root/cyber_lab_2_claude
./SSL_SETUP_INSTRUCTIONS.sh
```

This script will:
1. ✅ Check if DNS is configured correctly
2. ✅ Verify Nginx is running
3. ✅ Run certbot to get SSL certificate
4. ✅ Configure automatic HTTPS redirect

### **Manual Method:**

```bash
certbot --nginx -d cyyberlabs.com -d www.cyyberlabs.com
```

### **What You'll Be Asked:**

1. **Email address**: Enter your email (for renewal notices)
   - Example: `your.email@example.com`

2. **Terms of Service**: Type `Y` to agree

3. **Share email with EFF**: Type `N` (or `Y` if you want newsletter)

### **Expected Success Output:**

```
Congratulations! You have successfully enabled HTTPS on:
- https://cyyberlabs.com
- https://www.cyyberlabs.com

Your certificate and chain have been saved at:
/etc/letsencrypt/live/cyyberlabs.com/fullchain.pem
```

---

## 🎉 **After SSL is Installed:**

### **Your Platform Will Be Live At:**

```
✅ https://cyyberlabs.com          (Primary - Secure)
✅ https://www.cyyberlabs.com      (Alternate - Secure)
✅ http://cyyberlabs.com           (Redirects to HTTPS)
✅ http://www.cyyberlabs.com       (Redirects to HTTPS)
```

### **What Your Users Will See:**

1. **🔒 Green Padlock** in browser address bar
2. **"Cyyberlabs"** branding throughout
3. **Secure connection** (HTTPS)
4. **Professional appearance**

---

## 📊 **Test Everything Works:**

### **1. Visit Your Site:**
```
https://cyyberlabs.com
```

### **2. Check SSL:**
- Click the padlock icon in browser
- Should show "Connection is secure"
- Certificate issued by "Let's Encrypt"

### **3. Test Features:**
- ✅ Login page loads
- ✅ Register new account
- ✅ See all 15 courses on dashboard
- ✅ Open any lab
- ✅ Start VM and access with password "cyberlab"
- ✅ Complete quiz and see score
- ✅ Access admin panel
- ✅ VM wallpaper shows your logo

---

## 🔄 **SSL Auto-Renewal:**

**Good news!** Certbot automatically sets up renewal:

```bash
# Certificate renews automatically every 60 days
# Check renewal status:
certbot renew --dry-run

# View renewal timer:
systemctl list-timers | grep certbot
```

**You don't need to do anything!** SSL will auto-renew.

---

## 🔧 **Useful Commands:**

### **Check Services:**
```bash
# Check Nginx
systemctl status nginx

# Check Docker containers
docker ps --filter name=cyberlab

# Check frontend/backend logs
cd /root/cyber_lab_2_claude
docker compose logs -f frontend backend
```

### **Restart Services:**
```bash
# Restart Nginx
systemctl restart nginx

# Restart application
cd /root/cyber_lab_2_claude
docker compose restart

# Full rebuild if needed
docker compose up -d --build
```

### **SSL Management:**
```bash
# View certificates
certbot certificates

# Renew manually (if needed)
certbot renew

# Test renewal (dry run)
certbot renew --dry-run
```

### **View Logs:**
```bash
# Nginx logs
tail -f /var/log/nginx/cyyberlabs-access.log
tail -f /var/log/nginx/cyyberlabs-error.log

# Certbot logs
tail -f /var/log/letsencrypt/letsencrypt.log

# Application logs
cd /root/cyber_lab_2_claude
docker compose logs -f
```

---

## 🐛 **Troubleshooting:**

### **DNS Not Resolving?**

**Problem:** `ping cyyberlabs.com` shows wrong IP or fails

**Solutions:**
1. Double-check DNS records at registrar
2. Make sure you saved the changes
3. Wait longer (can take 30 min to 2 hours)
4. Try from different device/network
5. Clear DNS cache:
   - Windows: `ipconfig /flushdns`
   - Mac: `sudo dscacheutil -flushcache`
   - Linux: `sudo systemd-resolve --flush-caches`

---

### **Certbot Fails?**

**Error:** "Failed authorization procedure"

**Solutions:**
1. **DNS not ready:** Wait longer and retry
2. **Port 80 blocked:** Check firewall
   ```bash
   ufw allow 80/tcp
   netstat -tlnp | grep :80
   ```
3. **Nginx not running:**
   ```bash
   systemctl status nginx
   systemctl restart nginx
   ```
4. **Check logs:**
   ```bash
   tail -f /var/log/letsencrypt/letsencrypt.log
   ```

---

### **SSL Works But Site Doesn't Load?**

**Solutions:**
1. **Check Docker containers:**
   ```bash
   docker compose ps
   docker compose logs frontend backend
   ```

2. **Restart services:**
   ```bash
   docker compose restart
   ```

3. **Check Nginx config:**
   ```bash
   nginx -t
   systemctl restart nginx
   ```

---

### **VM Not Loading?**

**Solutions:**
1. **Check VM password:** It's `cyberlab`
2. **Check Docker:**
   ```bash
   docker ps | grep lab_
   ```
3. **Check backend logs:**
   ```bash
   docker compose logs backend | grep -i vm
   ```

---

## 📱 **Share With Your Students:**

### **Give them:**

**Website:** https://cyyberlabs.com  
**VM Password:** cyberlab  
**Instructions:** Register, login, choose a course, start a lab!

### **Features they'll enjoy:**
- 15 comprehensive cybersecurity courses
- Interactive hands-on labs
- Real VMs with pre-installed tools
- Progress tracking with quizzes
- Professional, modern interface
- Secure HTTPS connection

---

## 📈 **Platform Statistics:**

### **Content:**
- 15 Cybersecurity Courses
- Multiple labs per course
- Beginner to Advanced levels
- Real-world scenarios

### **Technology:**
- Frontend: React (port 1969)
- Backend: FastAPI (port 2026)
- Database: PostgreSQL
- VMs: Docker containers
- Reverse Proxy: Nginx
- SSL: Let's Encrypt

### **Capacity:**
- Multiple concurrent users
- Isolated VMs per user per lab
- Auto-pause idle VMs (resource optimization)
- Dynamic port allocation

---

## ✅ **Quick Checklist:**

```
DNS Configuration:
[ ] Logged into domain registrar
[ ] Added A record: @ → 185.182.187.146
[ ] Added A record: www → 185.182.187.146
[ ] Saved changes
[ ] Waited 15-30 minutes

DNS Testing:
[ ] Ran: ping cyyberlabs.com
[ ] Shows correct IP: 185.182.187.146
[ ] Ran: nslookup cyyberlabs.com
[ ] Returns correct IP

SSL Certificate:
[ ] Ran: ./SSL_SETUP_INSTRUCTIONS.sh
[ ] OR ran: certbot --nginx -d cyyberlabs.com -d www.cyyberlabs.com
[ ] Entered email address
[ ] Agreed to terms (Y)
[ ] Certificate installed successfully

Final Testing:
[ ] Visited: https://cyyberlabs.com
[ ] Green padlock appears 🔒
[ ] "Cyyberlabs" branding visible
[ ] Logged in successfully
[ ] All 15 courses visible
[ ] Lab opens and VM works
[ ] VM password "cyberlab" works
[ ] Logo appears as VM wallpaper
[ ] Quiz completion tracked
[ ] Admin panel accessible

Share With Users:
[ ] Website: https://cyyberlabs.com
[ ] VM Password: cyberlab
[ ] User accounts created/registered
```

---

## 🎯 **Success Criteria:**

**Your platform is 100% ready when:**

✅ `https://cyyberlabs.com` loads with green padlock  
✅ "Cyyberlabs" appears on all pages  
✅ Users can register and login  
✅ All 15 courses are visible and accessible  
✅ Labs load with working VMs  
✅ VM password "cyberlab" works  
✅ Your logo is the VM wallpaper  
✅ Quizzes track scores on dashboard  
✅ Admin panel allows course/lab management  
✅ VM monitoring and optimization works  

---

## 📞 **Support:**

### **If you need help:**

**DNS Issues:**
- Contact your domain registrar's support
- Most have live chat or phone support
- Show them you need to point cyyberlabs.com to 185.182.187.146

**SSL Issues:**
- Check: https://community.letsencrypt.org/
- Common solution: Wait longer for DNS
- Most issues resolve with time

**Application Issues:**
- Check logs: `docker compose logs`
- Restart: `docker compose restart`
- Check docs in `/root/cyber_lab_2_claude/`

---

## 🎊 **You're Almost Done!**

Just three simple steps:

1. **Configure DNS** (5 minutes at your registrar)
2. **Wait for propagation** (15-30 minutes)
3. **Run SSL script** (2 minutes on server)

Then your professional cybersecurity training platform will be **LIVE** at:

# 🌐 https://cyyberlabs.com

---

**Next Step:** Configure DNS at your domain registrar NOW! ⬆️

---

**Platform:** Cyyberlabs Security Training Platform  
**Version:** 2.0.0  
**Domain:** cyyberlabs.com  
**Server:** 185.182.187.146  
**Status:** ✅ Ready for DNS + SSL  

**Created:** November 24, 2025

