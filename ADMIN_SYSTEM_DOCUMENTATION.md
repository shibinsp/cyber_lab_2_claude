# 🛠️ Admin System Documentation

## Overview

This comprehensive admin system allows administrators to fully customize and manage the cyber range platform, including courses, labs, tools, and VM configurations.

## Features

### ✅ Implemented Features

1. **VM User Password Integration**
   - Each user's VM now uses their login password
   - Automatic password sync when users register
   - Existing users default to "student" password (can be updated)

2. **Full Lab Management**
   - Create, Read, Update, Delete (CRUD) operations for labs
   - Lab metadata (title, description, category, difficulty, duration)
   - Semester level assignment
   - VM enable/disable per lab
   - Active/inactive status

3. **Lab-Specific Tool Management**
   - Add/remove tools for each lab
   - Tool metadata (name, version, install command, description)
   - Preinstalled flag
   - Quick-select common security tools
   - Docker image customization support

4. **Full Course Management**
   - Create, Read, Update, Delete courses
   - Course metadata (title, description, category, difficulty)
   - Semester level assignment
   - Image URL for course thumbnails
   - Active/inactive status

5. **Course-Lab Association**
   - Assign labs to courses
   - Remove lab assignments
   - Ordering support
   - Multiple labs per course

6. **VM Configuration (Advanced)**
   - Per-lab resource limits (CPU, RAM, disk)
   - Network mode configuration
   - Custom port exposures
   - Environment variables
   - Startup scripts
   - Custom Docker images

---

## Database Schema

### New Tables

#### `labs` Table
```sql
CREATE TABLE labs (
    id VARCHAR PRIMARY KEY,  -- e.g., lab_nmap_scanning
    title VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR,
    difficulty VARCHAR DEFAULT 'Basic',
    duration VARCHAR,
    semester_level INTEGER DEFAULT 1,
    tasks JSON,  -- List of tasks/steps
    objectives JSON,  -- Learning objectives
    tools_required JSON,  -- List of tools needed
    vm_enabled BOOLEAN DEFAULT TRUE,
    vm_custom_image VARCHAR,
    vm_resources JSON,
    vm_preload_files JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
```

#### `lab_tools` Table
```sql
CREATE TABLE lab_tools (
    id SERIAL PRIMARY KEY,
    lab_id VARCHAR REFERENCES labs(id),
    tool_name VARCHAR NOT NULL,
    tool_version VARCHAR,
    install_command TEXT,
    description TEXT,
    is_preinstalled BOOLEAN DEFAULT TRUE
);
```

#### `vm_configurations` Table
```sql
CREATE TABLE vm_configurations (
    id SERIAL PRIMARY KEY,
    lab_id VARCHAR REFERENCES labs(id) UNIQUE,
    cpu_limit VARCHAR DEFAULT '50%',
    ram_limit VARCHAR DEFAULT '2g',
    disk_limit VARCHAR,
    network_mode VARCHAR DEFAULT 'bridge',
    expose_ports JSON,
    env_vars JSON,
    startup_script TEXT,
    custom_image VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);
```

### Updated Tables

#### `users` Table (Added Column)
```sql
ALTER TABLE users ADD COLUMN vm_password VARCHAR;
```

#### `course_labs` Table (Updated)
```sql
-- Now uses foreign key relationship to labs table
ALTER TABLE course_labs 
    ADD CONSTRAINT fk_lab FOREIGN KEY (lab_id) REFERENCES labs(id);
```

---

## API Endpoints

### Admin Lab Management (`/admin/labs`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin/labs/` | Get all labs | Admin |
| POST | `/admin/labs/` | Create new lab | Admin |
| GET | `/admin/labs/{lab_id}` | Get lab details | Admin |
| PUT | `/admin/labs/{lab_id}` | Update lab | Admin |
| DELETE | `/admin/labs/{lab_id}` | Delete lab | Admin |

### Lab Tools Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin/labs/{lab_id}/tools` | Get lab tools | Admin |
| POST | `/admin/labs/{lab_id}/tools` | Add tool to lab | Admin |
| DELETE | `/admin/labs/{lab_id}/tools/{tool_id}` | Remove tool | Admin |

### VM Configuration

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin/labs/{lab_id}/vm-config` | Get VM config | Admin |
| POST | `/admin/labs/{lab_id}/vm-config` | Set VM config | Admin |

### Course-Lab Association

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/admin/labs/assign-to-course` | Assign lab to course | Admin |
| DELETE | `/admin/labs/unassign-from-course` | Remove lab from course | Admin |

### Admin Course Management (`/admin/courses`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin/courses/` | Get all courses | Admin |
| POST | `/admin/courses/` | Create new course | Admin |
| GET | `/admin/courses/{course_id}` | Get course details | Admin |
| PUT | `/admin/courses/{course_id}` | Update course | Admin |
| DELETE | `/admin/courses/{course_id}` | Delete course | Admin |
| GET | `/admin/courses/{course_id}/labs` | Get course labs | Admin |

---

## Frontend Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/admin` | `AdminPanel` | Main admin dashboard |
| `/admin/labs/:labId/tools` | `ToolManager` | Lab-specific tool management |

---

## Usage Guide

### 1. Accessing Admin Panel

1. Log in as admin user (role = "admin")
2. Navigate to `/admin`
3. You'll see tabs for Courses and Labs

### 2. Creating a New Lab

```javascript
// Via API
POST /admin/labs/
{
  "id": "lab_custom_lab",
  "title": "My Custom Lab",
  "description": "Lab description",
  "category": "Network Security",
  "difficulty": "Intermediate",
  "duration": "3 hours",
  "semester_level": 2,
  "vm_enabled": true,
  "is_active": true
}
```

Or use the UI form in the Admin Panel.

### 3. Adding Tools to a Lab

1. Navigate to Admin Panel
2. Go to "Labs" tab
3. Click "🔧 Tools" button on a lab
4. Use quick-select for common tools or add custom tools
5. Tools will be pre-installed in the VM for that lab

### 4. Creating a Course

```javascript
// Via API
POST /admin/courses/
{
  "title": "Advanced Network Security",
  "description": "Course description",
  "category": "Network Security",
  "difficulty": "Advanced",
  "duration": "12 weeks",
  "semester_level": 4,
  "image_url": "https://example.com/image.jpg",
  "is_active": true
}
```

### 5. Assigning Labs to Courses

```javascript
// Via API
POST /admin/labs/assign-to-course
{
  "lab_id": "lab_nmap_scanning",
  "course_id": 1,
  "order": 0
}
```

### 6. VM Password Configuration

**For New Users:**
- Password is automatically set to their login password when they register
- No additional configuration needed

**For Existing Users:**
- Run migration script (already done)
- Or manually update via SQL:
  ```sql
  UPDATE users SET vm_password = 'their_password' WHERE username = 'user123';
  ```

### 7. Customizing VM Configuration

```javascript
// Via API
POST /admin/labs/{lab_id}/vm-config
{
  "cpu_limit": "75%",
  "ram_limit": "4g",
  "network_mode": "bridge",
  "expose_ports": {"80": 8080, "443": 8443},
  "env_vars": {"CUSTOM_VAR": "value"},
  "startup_script": "#!/bin/bash\necho 'VM starting...'"
}
```

---

## VM Password Implementation

### How It Works

1. **Registration**: When a user registers, their password is stored in two places:
   - `hashed_password`: BCrypt hash for authentication
   - `vm_password`: Plain text for VM access (consider encrypting in production)

2. **VM Start**: When starting a VM:
   ```python
   user_password = current_user.vm_password or "student"  # Fallback
   
   container = docker_client.containers.run(
       "cyberlab-vm:latest",
       environment={
           "USER": current_user.username,
           "PASSWORD": user_password,  # User's login password
           "VNC_PASSWORD": user_password,
           "RESOLUTION": "1280x720"
       },
       # ... other config
   )
   ```

3. **VM Access**: Users can log into their VM using:
   - **Username**: Their account username
   - **Password**: Their login password

### Security Considerations

⚠️ **For Production:**
- Encrypt `vm_password` field using AES or similar
- Consider using a separate password for VMs
- Add password rotation functionality
- Implement password strength requirements

---

## Common Tools Pre-configured

The admin panel includes quick-select for these common security tools:

- **nmap**: Network scanning
- **wireshark**: Network protocol analyzer
- **metasploit-framework**: Penetration testing
- **john**: Password cracker
- **hydra**: Brute force tool
- **sqlmap**: SQL injection
- **burpsuite**: Web security testing
- **nikto**: Web server scanner
- **aircrack-ng**: WiFi security
- **hashcat**: Password recovery
- **steghide**: Steganography
- **binwalk**: Firmware analysis
- **exiftool**: Metadata analysis

---

## Migration Script

The migration script (`migrate_database.py`) performs:

1. Creates new tables (labs, lab_tools, lab_files, vm_configurations)
2. Adds `vm_password` column to users table
3. Sets default VM password for existing users
4. Loads labs from JSON files
5. Associates labs with courses

**To run:**
```bash
cd backend
source venv/bin/activate
export SECRET_KEY="your-secret-key"
export DATABASE_URL="postgresql://postgress:shibin@localhost:5432/cyberlab"
python migrate_database.py
```

---

## Environment Variables

Update your `.env` or `docker-compose.yml`:

```bash
# Required
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://postgress:shibin@localhost:5432/cyberlab
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Optional
MISTRAL_API_KEY=your-mistral-api-key
ALLOWED_ORIGINS=http://localhost:1969,http://your-domain.com:1969
```

---

## Frontend Components

### AdminPanel.jsx
- Main admin dashboard
- Tabbed interface (Courses, Labs)
- Side-by-side form and list layout
- Full CRUD operations
- Real-time updates

### ToolManager.jsx
- Lab-specific tool management
- Quick-select common tools
- Custom tool addition
- Install command preview
- Visual tool cards

### CSS Styling
- Modern, responsive design
- Card-based layouts
- Color-coded badges (active/inactive, difficulty)
- Smooth transitions and hover effects
- Mobile-friendly

---

## Testing

### 1. Test Admin Access
```bash
# Create admin user (via SQL or API)
UPDATE users SET role = 'admin' WHERE username = 'admin';
```

### 2. Test Lab Creation
1. Log in as admin
2. Navigate to `/admin`
3. Go to "Labs" tab
4. Fill out form and create a lab
5. Verify lab appears in list

### 3. Test Tool Management
1. Create a lab
2. Click "🔧 Tools" button
3. Add nmap, wireshark
4. Start VM for that lab
5. Verify tools are available in VM

### 4. Test VM Password
1. Register new user with password "mypassword123"
2. Start a lab VM
3. Access noVNC
4. Log in with username and "mypassword123"
5. Verify successful login

---

## Troubleshooting

### Issue: "Admin access required" error
**Solution:** Update user role to admin:
```sql
UPDATE users SET role = 'admin' WHERE username = 'your_username';
```

### Issue: Labs not showing
**Solution:** Check that labs are marked as active:
```sql
UPDATE labs SET is_active = TRUE WHERE id = 'lab_id';
```

### Issue: VM password not working
**Solution:** Update user's VM password:
```sql
UPDATE users SET vm_password = 'correct_password' WHERE username = 'user';
```

### Issue: Tools not in VM
**Solution:** 
1. Check lab_tools table for that lab_id
2. Rebuild VM image to include tools
3. Or use install_command to install at runtime

---

## Future Enhancements

### Planned Features
- [ ] Lab templates
- [ ] Bulk tool assignment
- [ ] VM resource monitoring
- [ ] Lab analytics (completion rates, time spent)
- [ ] User management (create/edit users from admin panel)
- [ ] Course enrollment management
- [ ] Lab prerequisites and dependencies
- [ ] Automatic tool installation in VMs
- [ ] Lab cloning/duplication
- [ ] Import/export lab configurations

### Security Improvements
- [ ] Encrypt vm_password field
- [ ] Password rotation
- [ ] Audit logging for admin actions
- [ ] Role-based access control (more granular than admin/student)
- [ ] Two-factor authentication for admins

---

## Summary

✅ **What's Implemented:**
- Full admin panel for managing courses and labs
- Lab-specific tool management
- VM password uses user's login password
- Course-lab association
- Database migration complete
- Admin API endpoints
- Beautiful, responsive UI

✅ **Database Changes:**
- New tables: `labs`, `lab_tools`, `vm_configurations`
- Updated: `users` (added `vm_password`), `course_labs` (foreign key)
- 15 labs migrated from JSON to database

✅ **VM Integration:**
- Each user gets their own isolated VM per lab
- VM username = user's username
- VM password = user's login password
- Dynamic port assignment

🎉 **Ready to Use!**
- Admin panel accessible at `/admin`
- Tool manager at `/admin/labs/:labId/tools`
- All existing functionality preserved
- New labs created via admin panel will work immediately

---

**Documentation Version:** 1.0  
**Last Updated:** 2025-11-23  
**Author:** Claude AI Assistant

