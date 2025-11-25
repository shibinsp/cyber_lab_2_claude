#!/bin/bash
# SSL Certificate Setup Script for cyyberlabs.com
# Run this AFTER you've configured DNS to point to your server

echo "═══════════════════════════════════════════════════"
echo "  🔒 SSL Certificate Setup for cyyberlabs.com"
echo "═══════════════════════════════════════════════════"
echo ""

# Check if DNS is resolving
echo "📡 Step 1: Checking DNS configuration..."
echo ""

DNS_IP=$(dig +short cyyberlabs.com | tail -n1)
SERVER_IP="185.182.187.146"

if [ "$DNS_IP" == "$SERVER_IP" ]; then
    echo "✅ DNS is correctly configured!"
    echo "   cyyberlabs.com → $DNS_IP"
    echo ""
else
    echo "❌ DNS is NOT pointing to your server!"
    echo "   Expected: $SERVER_IP"
    echo "   Got: $DNS_IP"
    echo ""
    echo "⚠️  PLEASE CONFIGURE DNS FIRST:"
    echo "   1. Login to your domain registrar"
    echo "   2. Add A record: @ → $SERVER_IP"
    echo "   3. Add A record: www → $SERVER_IP"
    echo "   4. Wait 5-30 minutes for DNS propagation"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Check if Nginx is running
echo "🔧 Step 2: Checking Nginx..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
    echo ""
else
    echo "❌ Nginx is not running. Starting it..."
    systemctl start nginx
    echo ""
fi

# Get SSL certificate
echo "🔒 Step 3: Getting SSL certificate from Let's Encrypt..."
echo ""
echo "You will be asked:"
echo "  - Email address (for renewal notices)"
echo "  - Agree to Terms of Service (Y)"
echo "  - Share email with EFF (optional, N is fine)"
echo ""
read -p "Press ENTER to continue..."
echo ""

certbot --nginx -d cyyberlabs.com -d www.cyyberlabs.com

# Check if successful
if [ $? -eq 0 ]; then
    echo ""
    echo "═══════════════════════════════════════════════════"
    echo "  🎉 SSL CERTIFICATE INSTALLED SUCCESSFULLY!"
    echo "═══════════════════════════════════════════════════"
    echo ""
    echo "Your application is now accessible at:"
    echo "  ✅ https://cyyberlabs.com"
    echo "  ✅ https://www.cyyberlabs.com"
    echo ""
    echo "HTTP traffic will automatically redirect to HTTPS."
    echo ""
    echo "🔄 Auto-renewal is configured and will run automatically."
    echo ""
    echo "═══════════════════════════════════════════════════"
else
    echo ""
    echo "❌ SSL certificate installation failed."
    echo ""
    echo "Common issues:"
    echo "  - DNS not fully propagated yet (wait 30 min, try again)"
    echo "  - Port 80 blocked by firewall"
    echo "  - Nginx not running properly"
    echo ""
    echo "Check logs: tail -f /var/log/letsencrypt/letsencrypt.log"
fi

