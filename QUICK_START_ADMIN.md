# 🚀 Quick Start - Admin System

## What's New?

### ✨ Major Features Added

1. **🔐 VM Password = Login Password**
   - Your VM now uses YOUR login password
   - No more default "student" password
   - Automatic setup for new users

2. **🛠️ Full Admin Control Panel**
   - Manage courses (create, edit, delete)
   - Manage labs (create, edit, delete)
   - Customize tools for each lab
   - Configure VM resources per lab

3. **🔧 Lab-Specific Tools**
   - Add/remove tools for any lab
   - Quick-select from 13+ common security tools
   - Custom tool configuration

4. **📚 Course Management**
   - Create custom courses
   - Assign labs to courses
   - Control difficulty and semester levels

---

## 🎯 Quick Setup (5 Minutes)

### Step 1: Rebuild Containers

```bash
cd /root/cyber_lab_2_claude
docker compose build
docker compose up -d
```

### Step 2: Make Yourself Admin

```bash
# Option A: Via psql
psql -U postgress -d cyberlab -h localhost
UPDATE users SET role = 'admin' WHERE username = 'YOUR_USERNAME';
\q

# Option B: Via docker exec
docker exec -it backend bash
python -c "
from app.database import SessionLocal
from app.models import User
db = SessionLocal()
user = db.query(User).filter(User.username == 'YOUR_USERNAME').first()
user.role = 'admin'
db.commit()
print('Admin role granted!')
"
exit
```

### Step 3: Access Admin Panel

1. Go to `http://YOUR_SERVER_IP:1969`
2. Log in with your credentials
3. Navigate to `/admin` or look for "Admin Panel" link
4. Start managing!

---

## 📖 Common Tasks

### Create a New Lab

1. Go to Admin Panel (`/admin`)
2. Click "🧪 Labs" tab
3. Fill out the form:
   - **Lab ID**: `lab_my_custom_lab` (must start with `lab_`)
   - **Title**: "My Awesome Lab"
   - **Category**: "Network Security"
   - **Difficulty**: Basic/Intermediate/Advanced
   - **Semester Level**: 1-8
   - **VM Enabled**: ✅
4. Click "Create Lab"

### Add Tools to a Lab

1. In Admin Panel, go to Labs tab
2. Find your lab
3. Click "🔧 Tools" button
4. **Quick way**: Click any tool badge (nmap, wireshark, etc.)
5. **Custom way**: Fill out form manually
6. Click "Add Tool"

**Popular tool combinations:**
- **Network Labs**: nmap, wireshark, netcat
- **Web Labs**: burpsuite, sqlmap, nikto
- **Forensics**: exiftool, binwalk, steghide
- **Password**: john, hydra, hashcat

### Create a Course

1. Go to Admin Panel
2. Click "📚 Courses" tab
3. Fill out course details
4. Click "Create Course"

### Assign Labs to Course

**Via API** (use Postman or curl):
```bash
curl -X POST http://localhost:2026/admin/labs/assign-to-course \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "lab_id": "lab_nmap_scanning",
    "course_id": 1,
    "order": 0
  }'
```

---

## 🔐 VM Password System

### For New Users (Registered After Update)
- VM password = Login password automatically ✅
- No configuration needed

### For Existing Users
**Your VM password is currently set to:** `student`

**To use your login password:**
```bash
# Update via SQL
UPDATE users SET vm_password = 'YOUR_LOGIN_PASSWORD' WHERE username = 'YOUR_USERNAME';
```

**Or create a new account** and it will use your login password automatically.

---

## 🎮 Testing the System

### Test 1: Create a Lab
1. Admin Panel → Labs → Create new lab "test_lab"
2. Verify it appears in list
3. Go to Tool Manager for that lab
4. Add nmap and wireshark

### Test 2: Test VM with Your Password
1. As a regular user, open any lab
2. Start VM
3. When noVNC loads, log in with:
   - **Username**: Your username
   - **Password**: Your login password
4. Open terminal and run: `whoami` (should show your username)
5. Try `nmap --version` (if you added it as a tool)

### Test 3: Create a Course
1. Admin Panel → Courses → Create new course
2. Add course details
3. Verify it appears in courses list

---

## 📊 What Was Migrated

✅ **15 Labs Loaded:**
- lab_network_scanning
- lab_firewall_config
- lab_steganography
- lab_hash_cracking_advanced
- lab_wireshark_analysis
- lab_metasploit_basics
- lab_password_cracking
- lab_forensics_basics
- lab_xss_basics
- lab_web_recon
- lab_reverse_shell
- lab_privilege_escalation
- lab_log_analysis
- lab_linux_101
- lab_sql_injection

✅ **Database Tables Created:**
- `labs` - Lab definitions
- `lab_tools` - Tools per lab
- `vm_configurations` - VM customization
- `users.vm_password` - User VM passwords

✅ **Course-Lab Associations:**
- Labs automatically assigned to relevant courses
- Based on category and semester level matching

---

## 🐛 Troubleshooting

### Can't access Admin Panel
**Error**: "Admin access required"
**Fix**:
```sql
UPDATE users SET role = 'admin' WHERE username = 'YOUR_USERNAME';
```

### VM login not working
**Issue**: Password doesn't work
**Fix**: Update your vm_password:
```sql
UPDATE users SET vm_password = 'YOUR_CORRECT_PASSWORD' WHERE username = 'YOUR_USERNAME';
```

### Backend not starting
**Check logs**:
```bash
docker logs backend
```

**Common issue**: Environment variables missing
**Fix**: Ensure `.env` or `docker-compose.yml` has:
```env
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://postgress:shibin@localhost:5432/cyberlab
```

### Frontend not loading admin panel
**Check**: Are you logged in as admin?
**Check**: Does `/admin` route exist in React Router?
**Fix**: Rebuild frontend:
```bash
docker compose build frontend
docker compose restart frontend
```

---

## 🎨 UI Tour

### Admin Panel Layout
```
┌─────────────────────────────────────────┐
│  🛠️ Admin Panel      [Back to Dashboard]│
├─────────────────────────────────────────┤
│  📚 Courses    🧪 Labs                  │ ← Tabs
├──────────────┬──────────────────────────┤
│              │                          │
│  CREATE/EDIT │  LIST OF ITEMS          │
│  FORM        │  (Cards with actions)   │
│  (Sticky)    │  - Edit                 │
│              │  - Delete               │
│              │  - Tools (for labs)     │
│              │                          │
└──────────────┴──────────────────────────┘
```

### Tool Manager Layout
```
┌─────────────────────────────────────────┐
│  🔧 Tool Manager     [Back to Admin]    │
│  Managing tools for: Network Scanning   │
├──────────────┬──────────────────────────┤
│              │                          │
│  QUICK       │  INSTALLED TOOLS        │
│  SELECT      │  ┌──────────────────┐  │
│  [nmap] [wireshark] │  nmap 7.80    │  │
│  [burp] ...  │  └──────────────────┘  │
│              │  ┌──────────────────┐  │
│  ADD TOOL    │  wireshark 3.6    │  │
│  FORM        │  └──────────────────┘  │
│              │                          │
└──────────────┴──────────────────────────┘
```

---

## 🚀 Next Steps

1. ✅ **Access admin panel** - Make yourself admin
2. ✅ **Create a test lab** - Try the system
3. ✅ **Add tools** - Customize your labs
4. ✅ **Test VM password** - Verify it uses your login password
5. ✅ **Create courses** - Build your curriculum
6. 📚 **Read full docs** - Check `ADMIN_SYSTEM_DOCUMENTATION.md`

---

## 📞 Support

**Documentation Files:**
- `ADMIN_SYSTEM_DOCUMENTATION.md` - Complete reference
- `VM_WORKING_PROOF.md` - VM system details
- `DEPLOYMENT_SUMMARY.md` - Deployment guide

**Database Access:**
```bash
psql -U postgress -d cyberlab -h localhost
```

**Useful SQL:**
```sql
-- Check your role
SELECT username, role, vm_password FROM users WHERE username = 'YOU';

-- Make admin
UPDATE users SET role = 'admin' WHERE username = 'YOU';

-- List all labs
SELECT id, title, difficulty FROM labs;

-- List lab tools
SELECT l.title, lt.tool_name 
FROM labs l 
LEFT JOIN lab_tools lt ON l.id = lt.lab_id;
```

---

## 🎉 You're All Set!

Your cyber range now has:
- ✅ Full admin control
- ✅ Custom lab creation
- ✅ Tool management
- ✅ VM using your password
- ✅ Course customization

**Happy Building! 🚀**

