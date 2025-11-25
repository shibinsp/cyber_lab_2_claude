# Lab Page Loading Workflow Analysis

## Issue Description
- Application accessed via IP address (not localhost)
- Lab page shows blank after clicking "Start Lab"
- Issue persists after multiple fix attempts

## Application Flow When Starting a Lab

### 1. User Action
```
User clicks "Start Lab" button on Labs page
↓
Button link: <Link to={`/lab/${lab.id}`}>
↓
Example: /lab/lab_linux_101
```

### 2. React Router Navigation
```
App.jsx Routes Configuration:
<Route path="/lab/:labId" element={<PrivateRoute><CyberRange /></PrivateRoute>} />
↓
Router extracts labId parameter
↓
CyberRange component mounts with labId
```

### 3. CyberRange Component Initialization
```javascript
// Component receives labId from useParams()
const { labId } = useParams();

// useEffect triggers on mount
useEffect(() => {
  console.log('CyberRange mounted with labId:', labId);
  if (!labId) {
    navigate('/labs');
    return;
  }
  fetchLab();
  checkVmStatus();
}, [labId]);
```

### 4. API URL Construction (CRITICAL FOR IP ACCESS)
```javascript
// AuthContext.jsx
export const API_URL = import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `http://${window.location.hostname}:2026`
    : 'http://localhost:2026');
```

**When accessed via IP address (e.g., 192.168.1.100):**
- window.location.hostname = '192.168.1.100'
- API_URL = 'http://192.168.1.100:2026'

### 5. Lab Data Fetch
```javascript
fetchLab() → GET ${API_URL}/labs/${labId}
↓
Example: http://192.168.1.100:2026/labs/lab_linux_101
↓
Backend receives request
↓
Returns lab JSON data with tasks array
```

### 6. Component Rendering
```javascript
if (!lab) {
  return <LoadingSpinner />  // Shows while loading
}

if (!lab.tasks || lab.tasks.length === 0) {
  return <ErrorMessage />  // Shows if no tasks
}

return <LabInterface />  // Shows lab UI
```

## Potential Issues with IP Address Access

### Issue 1: CORS Configuration
**Location:** `backend/app/main.py`
```python
ALLOWED_ORIGINS_STR = os.getenv("ALLOWED_ORIGINS")
if not ALLOWED_ORIGINS_STR:
    ALLOWED_ORIGINS_STR = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:1969,http://127.0.0.1:1969"
```
**Problem:** IP address not in allowed origins!

### Issue 2: Docker Network Configuration
**Location:** `docker-compose.yml`
- Frontend container port mapping
- Backend container port mapping
- Network configuration between containers

### Issue 3: Environment Variables
**Location:** Docker build time
- VITE_API_URL not set during build
- API URL hardcoded at build time vs runtime

### Issue 4: Component State
**Location:** `CyberRange.jsx`
- Initial state of `lab` is `null`
- If fetch fails silently, component stays in loading/blank state

## Investigation Steps

1. ✓ Check if labId is being extracted correctly
2. ✓ Verify API URL construction with IP address
3. ✗ Check CORS allows IP address
4. ✗ Verify API endpoint returns data
5. ✗ Check browser console for errors
6. ✗ Verify Docker network configuration
7. ✗ Check if frontend build has correct API URL

## Root Cause Hypothesis

**Most Likely:** CORS blocking API requests when accessed via IP address
- Frontend: http://IP:1969
- Backend expects: http://localhost:1969
- Backend blocks: http://IP:1969 (not in CORS origins)

**Secondary:** API_URL not correctly configured during Docker build
- Frontend built with VITE_API_URL not set
- API URL determined at runtime may not match backend

## Fix Strategy

1. Update CORS to allow any origin in development (or specific IP)
2. Set VITE_API_URL environment variable in docker-compose.yml
3. Add runtime API URL detection in frontend
4. Add comprehensive error handling and logging
5. Rebuild containers with new configuration
