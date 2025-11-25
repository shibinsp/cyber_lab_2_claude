# 🌐 Domain Setup: cyyberlabs.com with SSL

## ✅ Step 1: Nginx & Certbot Installed

**Completed**: November 24, 2025

---

## 📋 **DNS Configuration Required (YOU MUST DO THIS FIRST!)**

### ⚠️ **IMPORTANT: Point your domain to your server IP**

Before getting SSL certificate, you MUST configure DNS records:

```
Domain Registrar DNS Settings:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type: A Record
Host: @
Value: 185.182.187.146
TTL: 300 (or default)

Type: A Record  
Host: www
Value: 185.182.187.146
TTL: 300 (or default)
```

###  **How to Configure DNS:**

1. **Login to your domain registrar** (where you bought cyyberlabs.com)
   - Examples: GoDaddy, Namecheap, Google Domains, Cloudflare, etc.

2. **Find DNS Settings**
   - Look for: "DNS Management", "DNS Records", "Nameservers", or "DNS Settings"

3. **Add/Update A Records:**
   ```
   @ (root domain)     → 185.182.187.146
   www                 → 185.182.187.146
   ```

4. **Wait for DNS propagation**
   - Usually 5-30 minutes
   - Can take up to 48 hours in rare cases

---

## ✅ **Verify DNS is Working:**

### Test from your local computer:
```bash
# Test root domain
ping cyyberlabs.com
# Should show: 185.182.187.146

# Test www subdomain
ping www.cyyberlabs.com
# Should show: 185.182.187.146

# Or use nslookup
nslookup cyyberlabs.com
nslookup www.cyyberlabs.com
```

### Test from server:
```bash
dig cyyberlabs.com +short
# Should return: 185.182.187.146

dig www.cyyberlabs.com +short
# Should return: 185.182.187.146
```

---

## 🔒 **Step 2: Get SSL Certificate (Run AFTER DNS is configured)**

### Once DNS is pointing to your server, run:

```bash
# Get SSL certificate for both cyyberlabs.com and www.cyyberlabs.com
certbot --nginx -d cyyberlabs.com -d www.cyyberlabs.com
```

### During the process, you'll be asked:
1. **Email**: Enter your email for renewal notices
2. **Terms**: Agree to terms of service (Y)
3. **Newsletter**: Optional (N is fine)
4. **Redirect**: Choose 2 (redirect HTTP to HTTPS)

### Expected output:
```
Congratulations! You have successfully enabled HTTPS on...
- https://cyyberlabs.com
- https://www.cyyberlabs.com
```

---

## 🎯 **Step 3: Update Application Branding**

I'll update all "CyberLabs" to "Cyyberlabs" in:
- ✅ Frontend (Login, Register, Dashboard, etc.)
- ✅ Backend API name
- ✅ VM wallpaper (already has your logo)
- ✅ All documentation

---

## 📝 **Current Status:**

### ✅ Completed:
- [x] Nginx installed
- [x] Certbot installed
- [x] Nginx configuration created
- [x] HTTP access working (test: http://cyyberlabs.com)

### ⏳ Pending (requires YOUR action):
- [ ] **DNS configured** (YOU need to do this at your domain registrar)
- [ ] DNS propagated (wait 5-30 minutes after configuring)
- [ ] SSL certificate obtained (run certbot command after DNS works)
- [ ] Application rebranded to "Cyyberlabs"

---

## 🚀 **After SSL Certificate is Installed:**

### Your application will be accessible at:
- ✅ **https://cyyberlabs.com** (secure, SSL)
- ✅ **https://www.cyyberlabs.com** (secure, SSL)
- ✅ http://cyyberlabs.com (redirects to HTTPS)
- ✅ http://www.cyyberlabs.com (redirects to HTTPS)

### What works:
- Frontend (React app)
- Backend API
- VM access via noVNC
- All labs and features

---

## 🔧 **Firewall Configuration:**

### Make sure ports are open:
```bash
# Allow HTTP (port 80)
ufw allow 80/tcp

# Allow HTTPS (port 443)
ufw allow 443/tcp

# Check status
ufw status
```

---

## 📊 **Testing After SSL:**

### 1. Test HTTPS access:
```bash
curl -I https://cyyberlabs.com
# Should return: HTTP/2 200
```

### 2. Test redirect:
```bash
curl -I http://cyyberlabs.com
# Should return: 301 redirect to https://
```

### 3. Test in browser:
- Go to: https://cyyberlabs.com
- Should show green padlock 🔒
- Should load your Cyyberlabs application

---

## 🔄 **Auto-Renewal:**

Certbot automatically sets up renewal:
```bash
# Check renewal status
certbot renew --dry-run

# Renewal happens automatically every 60 days
systemctl list-timers | grep certbot
```

---

## 🐛 **Troubleshooting:**

### DNS not resolving?
```bash
# Check if DNS is updated
dig cyyberlabs.com

# If showing old/wrong IP:
# - Wait longer (DNS propagation)
# - Check your domain registrar settings
# - Try from different network/device
```

### Certbot fails?
```bash
# Common error: "Failed authorization procedure"
# Solution: DNS not pointing to server yet. Wait and retry.

# Check Nginx logs
tail -f /var/log/nginx/cyyberlabs-error.log
```

### Port 80/443 not accessible?
```bash
# Check if Nginx is running
systemctl status nginx

# Check if ports are open
netstat -tlnp | grep -E ':80|:443'

# Check firewall
ufw status verbose
```

---

## 📋 **Quick Command Reference:**

```bash
# Restart Nginx
systemctl restart nginx

# Check Nginx config
nginx -t

# View logs
tail -f /var/log/nginx/cyyberlabs-access.log
tail -f /var/log/nginx/cyyberlabs-error.log

# Get SSL cert (after DNS is ready)
certbot --nginx -d cyyberlabs.com -d www.cyyberlabs.com

# Renew SSL manually
certbot renew

# Test SSL renewal
certbot renew --dry-run
```

---

## ✅ **NEXT STEPS:**

### 1. **Configure DNS NOW**
   - Login to your domain registrar
   - Point cyyberlabs.com → 185.182.187.146
   - Point www.cyyberlabs.com → 185.182.187.146

### 2. **Wait for DNS Propagation** (5-30 minutes)
   - Test with: `ping cyyberlabs.com`

### 3. **Run Certbot Command:**
   ```bash
   certbot --nginx -d cyyberlabs.com -d www.cyyberlabs.com
   ```

### 4. **Test Your Site:**
   - Visit: https://cyyberlabs.com
   - Login and use all features

### 5. **Rebrand Application:**
   - I'll update all "CyberLabs" → "Cyyberlabs"

---

**Status**: 🟡 Waiting for DNS configuration  
**Action Required**: Configure DNS at your domain registrar  
**After DNS**: Run certbot command to get SSL

---

**Created**: November 24, 2025  
**Domain**: cyyberlabs.com  
**Server IP**: 185.182.187.146

