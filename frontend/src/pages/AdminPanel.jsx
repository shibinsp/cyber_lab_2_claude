import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import Layout from '../components/Layout';
import {
  Users, BookOpen, ClipboardCheck, Settings, Trash2, Shield, Plus, RefreshCw,
  Beaker, GraduationCap, Wrench, Upload, Video, FileText, File, ChevronDown,
  ChevronRight, Edit, X, FolderPlus, Terminal, Server, Layers, Eye, Image,
  Link2, Unlink, Check, ArrowRight
} from 'lucide-react';
import './AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [coursePagination, setCoursePagination] = useState({ page: 1, per_page: 10, total: 0, total_pages: 0 });
  const [courseSearch, setCourseSearch] = useState('');
  const [courseForm, setCourseForm] = useState({
    title: '', description: '', category: '', difficulty: 'Beginner',
    duration: '', semester_level: 1, image_url: '', is_active: true
  });
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseModules, setCourseModules] = useState([]);
  const [expandedModules, setExpandedModules] = useState({});
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showContentForm, setShowContentForm] = useState(null);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', order: 0 });
  const [contentForm, setContentForm] = useState({
    content_type: 'text', title: '', description: '', text_content: '',
    linked_lab_id: '', order: 0, is_required: true, estimated_duration: 0
  });
  const [availableLabs, setAvailableLabs] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [labs, setLabs] = useState([]);
  const [labPagination, setLabPagination] = useState({ page: 1, per_page: 10, total: 0, total_pages: 0 });
  const [labSearch, setLabSearch] = useState('');
  const [labForm, setLabForm] = useState({
    id: '', title: '', description: '', category: '', difficulty: 'Basic',
    duration: '', semester_level: 1, terminal_type: 'vm', vm_enabled: true, is_active: true,
    tasks: [], objectives: [], tools_required: []
  });
  const [editingLab, setEditingLab] = useState(null);
  const [showLabBuilder, setShowLabBuilder] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);
  const [vms, setVms] = useState([]);
  const [vmStats, setVmStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Course-Lab Linker state
  const [linkerCourses, setLinkerCourses] = useState([]);
  const [linkerLabs, setLinkerLabs] = useState([]);
  const [selectedLinkerCourse, setSelectedLinkerCourse] = useState(null);
  const [courseLinkedLabs, setCourseLinkedLabs] = useState([]);
  const [linkingLab, setLinkingLab] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchData();
  }, [activeTab, navigate]);

  const getAuthHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stats') await fetchStats();
      else if (activeTab === 'users') await fetchUsers();
      else if (activeTab === 'courses') await fetchCourses();
      else if (activeTab === 'labs') await fetchLabs();
      else if (activeTab === 'quizzes') await fetchQuizzes();
      else if (activeTab === 'vms') await fetchVMs();
      else if (activeTab === 'linker') await fetchLinkerData();
    } catch (err) { console.error('Error:', err); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try { const res = await axios.get(`${API_URL}/admin/stats`, getAuthHeaders()); setStats(res.data); }
    catch (err) { console.error('Error:', err); }
  };

  const fetchUsers = async () => {
    try { const res = await axios.get(`${API_URL}/admin/users`, getAuthHeaders()); setUsers(res.data); }
    catch (err) { console.error('Error:', err); }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Delete this user?')) return;
    try { await axios.delete(`${API_URL}/admin/users/${userId}`, getAuthHeaders()); fetchUsers(); }
    catch (err) { console.error('Error:', err); }
  };

  const fetchQuizzes = async () => {
    try { const res = await axios.get(`${API_URL}/admin/quizzes`, getAuthHeaders()); setQuizzes(res.data); }
    catch (err) { console.error('Error:', err); }
  };

  const deleteQuiz = async (quizId) => {
    if (!confirm('Delete this quiz?')) return;
    try { await axios.delete(`${API_URL}/admin/quizzes/${quizId}`, getAuthHeaders()); fetchQuizzes(); }
    catch (err) { console.error('Error:', err); }
  };

  const fetchCourses = async (page = 1, search = '') => {
    try {
      const params = new URLSearchParams({ page: page.toString(), per_page: '10', include_inactive: 'true' });
      if (search) params.append('search', search);
      const res = await axios.get(`${API_URL}/admin/courses/?${params.toString()}`, getAuthHeaders());
      setCourses(Array.isArray(res.data.courses) ? res.data.courses : res.data || []);
      if (res.data.pagination) setCoursePagination(res.data.pagination);
    } catch (err) { setError('Failed to fetch courses'); setCourses([]); }
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingCourse) {
        await axios.put(`${API_URL}/admin/courses/${editingCourse.id}`, courseForm, getAuthHeaders());
        setSuccess('Course updated!');
      } else {
        await axios.post(`${API_URL}/admin/courses/`, courseForm, getAuthHeaders());
        setSuccess('Course created!');
      }
      resetCourseForm(); fetchCourses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.detail || 'Failed'); setTimeout(() => setError(''), 5000); }
    finally { setLoading(false); }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Delete this course?')) return;
    try {
      await axios.delete(`${API_URL}/admin/courses/${courseId}`, getAuthHeaders());
      setSuccess('Course deleted!'); fetchCourses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError('Failed to delete'); setTimeout(() => setError(''), 5000); }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title, description: course.description || '', category: course.category || '',
      difficulty: course.difficulty, duration: course.duration || '', semester_level: course.semester_level,
      image_url: course.image_url || '', is_active: course.is_active
    });
  };

  const resetCourseForm = () => {
    setEditingCourse(null);
    setCourseForm({ title: '', description: '', category: '', difficulty: 'Beginner', duration: '', semester_level: 1, image_url: '', is_active: true });
  };

  const openCourseBuilder = async (course) => {
    setSelectedCourse(course);
    await fetchCourseModules(course.id);
    await fetchAvailableLabs();
  };

  const closeCourseBuilder = () => { setSelectedCourse(null); setCourseModules([]); setExpandedModules({}); };

  const fetchCourseModules = async (courseId) => {
    try {
      const res = await axios.get(`${API_URL}/admin/content/courses/${courseId}/modules`, getAuthHeaders());
      setCourseModules(res.data.modules || []);
    } catch (err) { console.error('Error:', err); setCourseModules([]); }
  };

  const fetchAvailableLabs = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/content/available-labs`, getAuthHeaders());
      setAvailableLabs(res.data.labs || []);
    } catch (err) { console.error('Error:', err); }
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/admin/content/courses/${selectedCourse.id}/modules`, moduleForm, getAuthHeaders());
      setSuccess('Module created!'); setShowModuleForm(false);
      setModuleForm({ title: '', description: '', order: courseModules.length });
      fetchCourseModules(selectedCourse.id);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError('Failed to create module'); setTimeout(() => setError(''), 5000); }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Delete this module?')) return;
    try {
      await axios.delete(`${API_URL}/admin/content/modules/${moduleId}`, getAuthHeaders());
      fetchCourseModules(selectedCourse.id); setSuccess('Module deleted!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError('Failed'); setTimeout(() => setError(''), 5000); }
  };

  const handleCreateContent = async (e, moduleId) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/admin/content/modules/${moduleId}/contents`, contentForm, getAuthHeaders());
      setSuccess('Content added!'); setShowContentForm(null);
      setContentForm({ content_type: 'text', title: '', description: '', text_content: '', linked_lab_id: '', order: 0, is_required: true, estimated_duration: 0 });
      fetchCourseModules(selectedCourse.id);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError('Failed'); setTimeout(() => setError(''), 5000); }
  };

  const handleDeleteContent = async (contentId) => {
    if (!confirm('Delete this content?')) return;
    try {
      await axios.delete(`${API_URL}/admin/content/contents/${contentId}`, getAuthHeaders());
      fetchCourseModules(selectedCourse.id); setSuccess('Content deleted!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError('Failed'); setTimeout(() => setError(''), 5000); }
  };

  const handleFileUpload = async (moduleId, file) => {
    if (!file) return;
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.split('.')[0]);
      formData.append('description', '');
      formData.append('order', '0');
      formData.append('is_required', 'true');
      formData.append('estimated_duration', '0');
      await axios.post(`${API_URL}/admin/content/modules/${moduleId}/upload-content`, formData,
        { ...getAuthHeaders(), headers: { ...getAuthHeaders().headers, 'Content-Type': 'multipart/form-data' } });
      setSuccess('File uploaded!'); fetchCourseModules(selectedCourse.id);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError('Upload failed'); setTimeout(() => setError(''), 5000); }
    finally { setUploadingFile(false); }
  };

  const toggleModule = (moduleId) => { setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] })); };

  const fetchLabs = async (page = 1, search = '') => {
    try {
      const params = new URLSearchParams({ page: page.toString(), per_page: '10', include_inactive: 'true' });
      if (search) params.append('search', search);
      const res = await axios.get(`${API_URL}/admin/labs/?${params.toString()}`, getAuthHeaders());
      setLabs(Array.isArray(res.data.labs) ? res.data.labs : res.data || []);
      if (res.data.pagination) setLabPagination(res.data.pagination);
    } catch (err) { setError('Failed to fetch labs'); setLabs([]); }
  };

  const handleLabSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingLab) {
        await axios.put(`${API_URL}/admin/labs/${editingLab.id}`, labForm, getAuthHeaders());
        setSuccess('Lab updated!');
      } else {
        await axios.post(`${API_URL}/admin/labs/`, labForm, getAuthHeaders());
        setSuccess('Lab created!');
      }
      resetLabForm(); fetchLabs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.detail || 'Failed'); setTimeout(() => setError(''), 5000); }
    finally { setLoading(false); }
  };

  const handleDeleteLab = async (labId) => {
    if (!confirm('Delete this lab permanently? Consider deactivating instead.')) return;
    try {
      await axios.delete(`${API_URL}/admin/labs/${labId}`, getAuthHeaders());
      setSuccess('Lab deleted!'); fetchLabs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError('Failed'); setTimeout(() => setError(''), 5000); }
  };

  const handleDeactivateLab = async (labId) => {
    try {
      await axios.post(`${API_URL}/admin/labs/${labId}/deactivate`, {}, getAuthHeaders());
      setSuccess('Lab deactivated!'); fetchLabs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError('Failed to deactivate'); setTimeout(() => setError(''), 5000); }
  };

  const handleActivateLab = async (labId) => {
    try {
      await axios.post(`${API_URL}/admin/labs/${labId}/activate`, {}, getAuthHeaders());
      setSuccess('Lab activated!'); fetchLabs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError('Failed to activate'); setTimeout(() => setError(''), 5000); }
  };

  const handleEditLab = (lab) => {
    setEditingLab(lab);
    setLabForm({
      id: lab.id, title: lab.title, description: lab.description || '', category: lab.category || '',
      difficulty: lab.difficulty, duration: lab.duration || '', semester_level: lab.semester_level,
      terminal_type: lab.terminal_type || (lab.vm_enabled ? 'vm' : 'none'),
      vm_enabled: lab.vm_enabled, is_active: lab.is_active,
      tasks: lab.tasks || [], objectives: lab.objectives || [], tools_required: lab.tools_required || []
    });
  };

  const resetLabForm = () => {
    setEditingLab(null);
    setLabForm({ id: '', title: '', description: '', category: '', difficulty: 'Basic', duration: '', semester_level: 1, terminal_type: 'vm', vm_enabled: true, is_active: true, tasks: [], objectives: [], tools_required: [] });
  };

  const openLabBuilder = (lab) => { setSelectedLab(lab); setShowLabBuilder(true); };
  const navigateToToolManager = (labId) => { navigate(`/admin/labs/${labId}/tools`); };

  const fetchVMs = async () => {
    try {
      const res = await axios.get(`${API_URL}/vm/admin/all-vms`, getAuthHeaders());
      setVms(res.data.vms || []);
      setVmStats({
        total: res.data.total_vms || 0,
        running: res.data.vms?.filter(v => v.status === 'running').length || 0,
        paused: res.data.vms?.filter(v => v.status === 'paused').length || 0,
        stopped: res.data.vms?.filter(v => v.status === 'exited' || v.status === 'stopped').length || 0
      });
    } catch (err) { console.error('Failed:', err); setVms([]); setVmStats(null); }
  };

  const runOptimization = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/vm/admin/optimize`, {}, getAuthHeaders());
      setSuccess(`Optimized: Paused ${res.data.optimization_result.paused}, Stopped ${res.data.optimization_result.stopped}`);
      await fetchVMs();
    } catch (err) { setError('Optimization failed'); }
    finally { setLoading(false); }
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4 text-red-400" />;
      case 'pdf': return <FileText className="w-4 h-4 text-orange-400" />;
      case 'document': return <File className="w-4 h-4 text-blue-400" />;
      case 'lab_link': return <Terminal className="w-4 h-4 text-emerald-400" />;
      case 'quiz': return <ClipboardCheck className="w-4 h-4 text-purple-400" />;
      case 'image': return <Image className="w-4 h-4 text-pink-400" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  // Course-Lab Linker Functions
  const fetchLinkerData = async () => {
    try {
      const [coursesRes, labsRes] = await Promise.all([
        axios.get(`${API_URL}/admin/content/all-courses-with-labs`, getAuthHeaders()),
        axios.get(`${API_URL}/admin/content/available-labs`, getAuthHeaders())
      ]);
      setLinkerCourses(coursesRes.data.courses || []);
      setLinkerLabs(labsRes.data.labs || []);
    } catch (err) {
      console.error('Failed to fetch linker data:', err);
      setLinkerCourses([]);
      setLinkerLabs([]);
    }
  };

  const selectCourseForLinking = async (course) => {
    setSelectedLinkerCourse(course);
    try {
      const res = await axios.get(`${API_URL}/admin/content/courses/${course.id}/linked-labs`, getAuthHeaders());
      setCourseLinkedLabs(res.data.linked_labs || []);
    } catch (err) {
      console.error('Failed to fetch linked labs:', err);
      setCourseLinkedLabs([]);
    }
  };

  const linkLabToCourse = async (labId) => {
    if (!selectedLinkerCourse) return;
    setLinkingLab(labId);
    try {
      const formData = new FormData();
      formData.append('lab_id', labId);
      await axios.post(
        `${API_URL}/admin/content/courses/${selectedLinkerCourse.id}/link-lab`,
        formData,
        getAuthHeaders()
      );
      setSuccess('Lab linked to course successfully!');
      await selectCourseForLinking(selectedLinkerCourse);
      await fetchLinkerData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to link lab');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLinkingLab(null);
    }
  };

  const unlinkLabFromCourse = async (contentId) => {
    if (!selectedLinkerCourse) return;
    if (!confirm('Remove this lab from the course?')) return;
    try {
      await axios.delete(
        `${API_URL}/admin/content/courses/${selectedLinkerCourse.id}/unlink-lab/${contentId}`,
        getAuthHeaders()
      );
      setSuccess('Lab unlinked from course!');
      await selectCourseForLinking(selectedLinkerCourse);
      await fetchLinkerData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to unlink lab');
      setTimeout(() => setError(''), 5000);
    }
  };

  const getUnlinkedLabs = () => {
    const linkedLabIds = courseLinkedLabs.map(l => l.lab_id);
    return linkerLabs.filter(lab => !linkedLabIds.includes(lab.id));
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Shield className="w-8 h-8 text-emerald-400" />
              Admin Panel
            </h1>
            <p className="text-gray-400">Low-Code Course & Lab Builder</p>
          </div>

          {error && <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">{error}</div>}
          {success && <div className="mb-4 p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-200">{success}</div>}

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[
              { id: 'stats', icon: Settings, label: 'Dashboard' },
              { id: 'users', icon: Users, label: 'Users' },
              { id: 'courses', icon: GraduationCap, label: 'Course Management' },
              { id: 'labs', icon: Beaker, label: 'Lab Management' },
              { id: 'linker', icon: Link2, label: 'Course-Lab Linker' },
              { id: 'quizzes', icon: ClipboardCheck, label: 'Quizzes' },
              { id: 'vms', icon: Server, label: 'VM Monitoring' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                <tab.icon className="w-4 h-4" />{tab.label}
              </button>
            ))}
          </div>

          <div className="bg-gray-800 rounded-lg p-6">

            {/* Stats Tab */}
            {activeTab === 'stats' && stats && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Platform Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <Users className="w-8 h-8 text-blue-400 mb-2" />
                    <p className="text-gray-400">Total Users</p>
                    <p className="text-3xl font-bold">{stats.total_users}</p>
                  </div>
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <BookOpen className="w-8 h-8 text-green-400 mb-2" />
                    <p className="text-gray-400">Total Courses</p>
                    <p className="text-3xl font-bold">{stats.total_courses}</p>
                  </div>
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <Beaker className="w-8 h-8 text-purple-400 mb-2" />
                    <p className="text-gray-400">Total Labs</p>
                    <p className="text-3xl font-bold">{stats.total_labs || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <ClipboardCheck className="w-8 h-8 text-yellow-400 mb-2" />
                    <p className="text-gray-400">Total Quizzes</p>
                    <p className="text-3xl font-bold">{stats.total_quizzes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">User Management</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-700">
                      <th className="text-left p-3">Username</th>
                      <th className="text-left p-3">Email</th>
                      <th className="text-left p-3">Department</th>
                      <th className="text-left p-3">Role</th>
                      <th className="text-left p-3">Actions</th>
                    </tr></thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="p-3">{user.username}</td>
                          <td className="p-3">{user.email}</td>
                          <td className="p-3">{user.department}</td>
                          <td className="p-3"><span className={`px-2 py-1 rounded ${user.role === 'admin' ? 'bg-yellow-600' : 'bg-blue-600'}`}>{user.role}</span></td>
                          <td className="p-3"><button onClick={() => deleteUser(user.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quizzes Tab */}
            {activeTab === 'quizzes' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Quiz Management</h2>
                  <button className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg flex items-center gap-2"><Plus className="w-4 h-4" />Create Quiz</button>
                </div>
                <div className="space-y-4">
                  {quizzes.map(quiz => (
                    <div key={quiz.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <h3 className="font-bold">{quiz.title}</h3>
                        <p className="text-gray-400 text-sm">{quiz.course_title} • {quiz.total_questions} questions</p>
                      </div>
                      <button onClick={() => deleteQuiz(quiz.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Management Tab */}
            {activeTab === 'courses' && !selectedCourse && (
              <div>
                {/* Header with Create Button */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Course Management</h2>
                    <p className="text-gray-400 text-sm">Create and manage your courses</p>
                  </div>
                  <button 
                    onClick={() => navigate('/admin/create?type=course')}
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 px-6 py-3 rounded-lg flex items-center gap-2 font-semibold shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Course
                  </button>
                </div>

                {/* Quick Edit Form (shown only when editing) */}
                {editingCourse && (
                  <div className="bg-gray-700 p-6 rounded-lg mb-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Edit className="w-5 h-5" /> Edit Course
                    </h3>
                    <form onSubmit={handleCourseSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm mb-1">Title *</label>
                          <input type="text" value={courseForm.title} onChange={(e) => setCourseForm({...courseForm, title: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" required />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm mb-1">Category</label>
                            <input type="text" value={courseForm.category} onChange={(e) => setCourseForm({...courseForm, category: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" />
                          </div>
                          <div>
                            <label className="block text-sm mb-1">Difficulty</label>
                            <select value={courseForm.difficulty} onChange={(e) => setCourseForm({...courseForm, difficulty: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2">
                              <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Description</label>
                        <textarea value={courseForm.description} onChange={(e) => setCourseForm({...courseForm, description: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" rows="2" />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-sm mb-1">Duration</label>
                          <input type="text" value={courseForm.duration} onChange={(e) => setCourseForm({...courseForm, duration: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Semester</label>
                          <input type="number" min="1" max="8" value={courseForm.semester_level} onChange={(e) => setCourseForm({...courseForm, semester_level: parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Image URL</label>
                          <input type="url" value={courseForm.image_url} onChange={(e) => setCourseForm({...courseForm, image_url: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" />
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center gap-2 pb-2">
                            <input type="checkbox" checked={courseForm.is_active} onChange={(e) => setCourseForm({...courseForm, is_active: e.target.checked})} className="rounded" />Active
                          </label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg disabled:opacity-50">Update</button>
                        <button type="button" onClick={resetCourseForm} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Course List */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Existing Courses ({coursePagination.total})</h3>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Search..." value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && fetchCourses(1, e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm" />
                      <button onClick={() => fetchCourses(1, courseSearch)} className="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded text-sm">Search</button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {courses.length === 0 ? (
                      <div className="bg-gray-800 p-8 rounded-lg text-center text-gray-400">
                        <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No courses found.</p>
                        <button onClick={() => navigate('/admin/create?type=course')} className="mt-4 text-emerald-400 hover:text-emerald-300">Create your first course →</button>
                      </div>
                    ) : courses.map(course => (
                      <div key={course.id} className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg">{course.title}</h3>
                          <span className={`px-2 py-1 rounded text-sm ${course.is_active ? 'bg-green-600' : 'bg-red-600'}`}>{course.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{course.description}</p>
                        <div className="flex gap-3 text-sm text-gray-400 mb-3">
                          <span>📂 {course.category}</span><span>📊 {course.difficulty}</span><span>🎓 Semester {course.semester_level}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => openCourseBuilder(course)} className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-sm flex items-center gap-1"><Layers className="w-3 h-3" />Course Builder</button>
                          <button onClick={() => handleEditCourse(course)} className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm">✏️ Edit</button>
                          <button onClick={() => handleDeleteCourse(course.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm">🗑️ Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}


            {/* Course Builder View */}
            {activeTab === 'courses' && selectedCourse && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <button onClick={closeCourseBuilder} className="p-2 hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
                    <div>
                      <h2 className="text-2xl font-bold flex items-center gap-2"><Layers className="w-6 h-6 text-cyan-400" />Course Builder: {selectedCourse.title}</h2>
                      <p className="text-gray-400 text-sm">Add modules, videos, PDFs, and link labs</p>
                    </div>
                  </div>
                  <button onClick={() => { setShowModuleForm(true); setModuleForm({ title: '', description: '', order: courseModules.length }); }} className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg flex items-center gap-2"><FolderPlus className="w-4 h-4" />Add Module</button>
                </div>

                {showModuleForm && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
                      <h3 className="text-xl font-bold mb-4">Create New Module</h3>
                      <form onSubmit={handleCreateModule} className="space-y-4">
                        <div><label className="block text-sm mb-1">Module Title *</label><input type="text" value={moduleForm.title} onChange={(e) => setModuleForm({...moduleForm, title: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2" required /></div>
                        <div><label className="block text-sm mb-1">Description</label><textarea value={moduleForm.description} onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2" rows="3" /></div>
                        <div className="flex gap-2">
                          <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg">Create Module</button>
                          <button type="button" onClick={() => setShowModuleForm(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg">Cancel</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {showContentForm !== null && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                      <h3 className="text-xl font-bold mb-4">Add Content</h3>
                      <form onSubmit={(e) => handleCreateContent(e, showContentForm)} className="space-y-4">
                        <div><label className="block text-sm mb-1">Content Type *</label>
                          <select value={contentForm.content_type} onChange={(e) => setContentForm({...contentForm, content_type: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
                            <option value="text">📝 Text/Markdown</option><option value="video">🎬 Video</option><option value="pdf">📄 PDF</option><option value="document">📁 Document</option><option value="lab_link">🖥️ Link to Lab</option><option value="quiz">📋 Quiz</option>
                          </select>
                        </div>
                        <div><label className="block text-sm mb-1">Title *</label><input type="text" value={contentForm.title} onChange={(e) => setContentForm({...contentForm, title: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2" required /></div>
                        <div><label className="block text-sm mb-1">Description</label><textarea value={contentForm.description} onChange={(e) => setContentForm({...contentForm, description: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2" rows="2" /></div>
                        {contentForm.content_type === 'text' && (
                          <div><label className="block text-sm mb-1">Content (Markdown)</label><textarea value={contentForm.text_content} onChange={(e) => setContentForm({...contentForm, text_content: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 font-mono text-sm" rows="8" placeholder="# Heading..." /></div>
                        )}
                        {contentForm.content_type === 'lab_link' && (
                          <div><label className="block text-sm mb-1">Select Lab</label>
                            <select value={contentForm.linked_lab_id} onChange={(e) => setContentForm({...contentForm, linked_lab_id: e.target.value})} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
                              <option value="">-- Select a Lab --</option>
                              {availableLabs.map(lab => <option key={lab.id} value={lab.id}>{lab.title} ({lab.difficulty})</option>)}
                            </select>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-sm mb-1">Duration (min)</label><input type="number" value={contentForm.estimated_duration} onChange={(e) => setContentForm({...contentForm, estimated_duration: parseInt(e.target.value) || 0})} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2" /></div>
                          <div className="flex items-end"><label className="flex items-center gap-2"><input type="checkbox" checked={contentForm.is_required} onChange={(e) => setContentForm({...contentForm, is_required: e.target.checked})} className="rounded" />Required</label></div>
                        </div>
                        <div className="flex gap-2">
                          <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg">Add Content</button>
                          <button type="button" onClick={() => setShowContentForm(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg">Cancel</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {courseModules.length === 0 ? (
                    <div className="bg-gray-700 p-12 rounded-lg text-center">
                      <FolderPlus className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">No modules yet</p>
                      <p className="text-gray-500 text-sm">Click "Add Module" to start building your course</p>
                    </div>
                  ) : courseModules.map((module, moduleIndex) => (
                    <div key={module.id} className="bg-gray-700 rounded-lg overflow-hidden">
                      <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-600/50" onClick={() => toggleModule(module.id)}>
                        <div className="flex items-center gap-3">
                          {expandedModules[module.id] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                          <div><h3 className="font-bold">Module {moduleIndex + 1}: {module.title}</h3><p className="text-gray-400 text-sm">{module.contents?.length || 0} items</p></div>
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setShowContentForm(module.id)} className="p-2 bg-emerald-600 hover:bg-emerald-700 rounded" title="Add Content"><Plus className="w-4 h-4" /></button>
                          <label className="p-2 bg-cyan-600 hover:bg-cyan-700 rounded cursor-pointer" title="Upload File">
                            <Upload className="w-4 h-4" />
                            <input type="file" className="hidden" accept=".mp4,.webm,.mov,.pdf,.doc,.docx,.txt,.md,.ppt,.pptx,.jpg,.jpeg,.png,.gif" onChange={(e) => handleFileUpload(module.id, e.target.files[0])} />
                          </label>
                          <button onClick={() => handleDeleteModule(module.id)} className="p-2 bg-red-600 hover:bg-red-700 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      {expandedModules[module.id] && (
                        <div className="border-t border-gray-600 p-4 space-y-2">
                          {module.contents?.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">No content yet. Add content or upload files.</p>
                          ) : module.contents?.map((content, contentIndex) => (
                            <div key={content.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="text-gray-500 text-sm w-6">{contentIndex + 1}.</span>
                                {getContentIcon(content.content_type)}
                                <div><p className="font-medium">{content.title}</p><p className="text-gray-500 text-xs">{content.content_type} {content.estimated_duration ? `• ${content.estimated_duration} min` : ''} {content.file_name && `• ${content.file_name}`}</p></div>
                              </div>
                              <div className="flex items-center gap-2">
                                {content.file_url && <a href={`${API_URL.replace('/api', '')}${content.file_url}`} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-gray-700 rounded" title="Preview"><Eye className="w-4 h-4 text-gray-400" /></a>}
                                <button onClick={() => handleDeleteContent(content.id)} className="p-1 hover:bg-red-600 rounded" title="Delete"><Trash2 className="w-4 h-4 text-red-400" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {uploadingFile && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-gray-800 p-6 rounded-lg flex items-center gap-4"><RefreshCw className="w-6 h-6 animate-spin text-emerald-400" /><span>Uploading...</span></div></div>}
              </div>
            )}


            {/* Lab Management Tab */}
            {activeTab === 'labs' && !showLabBuilder && (
              <div>
                {/* Header with Create Button */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Lab Management</h2>
                    <p className="text-gray-400 text-sm">Create and manage hands-on labs</p>
                  </div>
                  <button 
                    onClick={() => navigate('/admin/create?type=lab')}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 py-3 rounded-lg flex items-center gap-2 font-semibold shadow-lg shadow-purple-500/20 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Lab
                  </button>
                </div>

                {/* Quick Edit Form (shown only when editing) */}
                {editingLab && (
                  <div className="bg-gray-700 p-6 rounded-lg mb-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Edit className="w-5 h-5" /> Edit Lab
                    </h3>
                    <form onSubmit={handleLabSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm mb-1">Lab ID</label>
                          <input type="text" value={labForm.id} disabled className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 opacity-50" />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Title *</label>
                          <input type="text" value={labForm.title} onChange={(e) => setLabForm({...labForm, title: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" required />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Description</label>
                        <textarea value={labForm.description} onChange={(e) => setLabForm({...labForm, description: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" rows="2" />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <label className="block text-sm mb-1">Category</label>
                          <input type="text" value={labForm.category} onChange={(e) => setLabForm({...labForm, category: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Difficulty</label>
                          <select value={labForm.difficulty} onChange={(e) => setLabForm({...labForm, difficulty: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2">
                            <option>Basic</option><option>Intermediate</option><option>Advanced</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Duration</label>
                          <input type="text" value={labForm.duration} onChange={(e) => setLabForm({...labForm, duration: e.target.value})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" />
                        </div>
                        <div>
                          <label className="block text-sm mb-1">Semester</label>
                          <input type="number" min="1" max="8" value={labForm.semester_level} onChange={(e) => setLabForm({...labForm, semester_level: parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2" />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="terminal_type_edit" checked={labForm.terminal_type === 'none'} onChange={() => setLabForm({...labForm, terminal_type: 'none', vm_enabled: false})} />
                          <span className="text-sm">No Terminal</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name="terminal_type_edit" checked={labForm.terminal_type === 'simple'} onChange={() => setLabForm({...labForm, terminal_type: 'simple', vm_enabled: false})} />
                          <span className="text-sm">Simple Terminal</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name="terminal_type_edit" checked={labForm.terminal_type === 'vm'} onChange={() => setLabForm({...labForm, terminal_type: 'vm', vm_enabled: true})} />
                          <span className="text-sm">Full VM</span>
                        </label>
                        <label className="flex items-center gap-2 ml-4">
                          <input type="checkbox" checked={labForm.is_active} onChange={(e) => setLabForm({...labForm, is_active: e.target.checked})} className="rounded" />Active
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg disabled:opacity-50">Update</button>
                        <button type="button" onClick={resetLabForm} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Lab List */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Existing Labs ({labPagination.total})</h3>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Search labs..." value={labSearch} onChange={(e) => setLabSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchLabs(1, e.target.value)} className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm" />
                      <button onClick={() => fetchLabs(1, labSearch)} className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm">Search</button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {labs.length === 0 ? (
                      <div className="bg-gray-800 p-8 rounded-lg text-center text-gray-400">
                        <Beaker className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No labs found.</p>
                        <button onClick={() => navigate('/admin/create?type=lab')} className="mt-4 text-purple-400 hover:text-purple-300">Create your first lab →</button>
                      </div>
                    ) : labs.map(lab => (
                      <div key={lab.id} className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div><h3 className="font-bold text-lg">{lab.title}</h3><p className="text-gray-500 text-xs font-mono">{lab.id}</p></div>
                          <div className="flex items-center gap-2">
                            {lab.terminal_type === 'vm' || lab.vm_enabled ? (
                              <span className="px-2 py-1 rounded text-xs bg-cyan-600/20 text-cyan-400 flex items-center gap-1"><Terminal className="w-3 h-3" />VM</span>
                            ) : lab.terminal_type === 'simple' ? (
                              <span className="px-2 py-1 rounded text-xs bg-yellow-600/20 text-yellow-400 flex items-center gap-1"><Terminal className="w-3 h-3" />Terminal</span>
                            ) : null}
                            <span className={`px-2 py-1 rounded text-sm ${lab.is_active ? 'bg-green-600' : 'bg-red-600'}`}>{lab.is_active ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{lab.description}</p>
                        <div className="flex gap-3 text-sm text-gray-400 mb-3"><span>📂 {lab.category}</span><span>📊 {lab.difficulty}</span><span>🎓 Semester {lab.semester_level}</span>{lab.duration && <span>⏱️ {lab.duration}</span>}</div>
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => openLabBuilder(lab)} className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm flex items-center gap-1"><Layers className="w-3 h-3" />Lab Builder</button>
                          <button onClick={() => navigateToToolManager(lab.id)} className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-sm flex items-center gap-1"><Wrench className="w-3 h-3" />Tools</button>
                          <button onClick={() => handleEditLab(lab)} className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm">✏️ Edit</button>
                          {lab.is_active ? (
                            <button onClick={() => handleDeactivateLab(lab.id)} className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-sm">⏸️ Deactivate</button>
                          ) : (
                            <button onClick={() => handleActivateLab(lab.id)} className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm">▶️ Activate</button>
                          )}
                          <button onClick={() => handleDeleteLab(lab.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm">🗑️ Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {labPagination.total_pages > 1 && (
                    <div className="mt-6 flex justify-center items-center gap-2">
                      <button onClick={() => fetchLabs(labPagination.page - 1)} disabled={!labPagination.has_prev} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50">‹ Previous</button>
                      <span className="px-4 py-1 bg-gray-700 rounded">Page {labPagination.page} of {labPagination.total_pages}</span>
                      <button onClick={() => fetchLabs(labPagination.page + 1)} disabled={!labPagination.has_next} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50">Next ›</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lab Builder View */}
            {activeTab === 'labs' && showLabBuilder && selectedLab && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <button onClick={() => { setShowLabBuilder(false); setSelectedLab(null); }} className="p-2 hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
                    <div><h2 className="text-2xl font-bold flex items-center gap-2"><Beaker className="w-6 h-6 text-purple-400" />Lab Builder: {selectedLab.title}</h2><p className="text-gray-400 text-sm">Configure tasks, objectives, and VM settings</p></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-emerald-400" />Lab Tasks</h3>
                    <p className="text-gray-400 text-sm mb-4">Define step-by-step tasks for students</p>
                    <div className="space-y-3 mb-4">
                      {(selectedLab.tasks || []).map((task, index) => (
                        <div key={index} className="bg-gray-800 p-3 rounded flex items-start gap-3">
                          <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">{index + 1}</span>
                          <div className="flex-1"><p className="font-medium">{task.title || task}</p>{task.description && <p className="text-gray-400 text-sm">{task.description}</p>}</div>
                        </div>
                      ))}
                      {(!selectedLab.tasks || selectedLab.tasks.length === 0) && <p className="text-gray-500 text-center py-4">No tasks defined yet</p>}
                    </div>
                    <button className="w-full py-2 border border-dashed border-gray-500 rounded-lg text-gray-400 hover:border-emerald-500 hover:text-emerald-400 flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Add Task</button>
                  </div>
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Server className="w-5 h-5 text-cyan-400" />VM Configuration</h3>
                    <p className="text-gray-400 text-sm mb-4">Configure the virtual machine environment</p>
                    <div className="space-y-4">
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2"><span className="font-medium">VM Status</span><span className={`px-2 py-1 rounded text-sm ${selectedLab.vm_enabled ? 'bg-green-600' : 'bg-gray-600'}`}>{selectedLab.vm_enabled ? 'Enabled' : 'Disabled'}</span></div>
                        <p className="text-gray-400 text-sm">{selectedLab.vm_enabled ? 'Students have access to a Linux terminal' : 'This lab runs without a VM'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800 p-4 rounded-lg"><p className="text-gray-400 text-sm mb-1">CPU Limit</p><p className="font-bold">50%</p></div>
                        <div className="bg-gray-800 p-4 rounded-lg"><p className="text-gray-400 text-sm mb-1">RAM Limit</p><p className="font-bold">2 GB</p></div>
                      </div>
                      <button onClick={() => navigateToToolManager(selectedLab.id)} className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg flex items-center justify-center gap-2"><Wrench className="w-5 h-5" />Manage Tools & Software</button>
                    </div>
                  </div>
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5 text-yellow-400" />Learning Objectives</h3>
                    <div className="space-y-2 mb-4">
                      {(selectedLab.objectives || []).map((obj, index) => <div key={index} className="flex items-start gap-2 text-gray-300"><span className="text-yellow-400">•</span><span>{obj}</span></div>)}
                      {(!selectedLab.objectives || selectedLab.objectives.length === 0) && <p className="text-gray-500 text-center py-4">No objectives defined yet</p>}
                    </div>
                    <button className="w-full py-2 border border-dashed border-gray-500 rounded-lg text-gray-400 hover:border-yellow-500 hover:text-yellow-400 flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Add Objective</button>
                  </div>
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Wrench className="w-5 h-5 text-orange-400" />Required Tools</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(selectedLab.tools_required || []).map((tool, index) => <span key={index} className="px-3 py-1 bg-gray-800 rounded-full text-sm">{tool}</span>)}
                      {(!selectedLab.tools_required || selectedLab.tools_required.length === 0) && <p className="text-gray-500 w-full text-center py-4">No tools specified yet</p>}
                    </div>
                    <button className="w-full py-2 border border-dashed border-gray-500 rounded-lg text-gray-400 hover:border-orange-500 hover:text-orange-400 flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Add Tool</button>
                  </div>
                </div>
              </div>
            )}

            {/* VM Monitoring Tab */}
            {activeTab === 'vms' && (
              <div className="space-y-6">
                {vmStats && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-700 p-6 rounded-lg"><div className="text-gray-400 text-sm mb-1">Total VMs</div><div className="text-3xl font-bold text-white">{vmStats.total}</div></div>
                    <div className="bg-green-600/20 border border-green-600/50 p-6 rounded-lg"><div className="text-green-300 text-sm mb-1">Running</div><div className="text-3xl font-bold text-green-400">{vmStats.running}</div></div>
                    <div className="bg-blue-600/20 border border-blue-600/50 p-6 rounded-lg"><div className="text-blue-300 text-sm mb-1">Paused</div><div className="text-3xl font-bold text-blue-400">{vmStats.paused}</div></div>
                    <div className="bg-gray-600/20 border border-gray-600/50 p-6 rounded-lg"><div className="text-gray-300 text-sm mb-1">Stopped</div><div className="text-3xl font-bold text-gray-400">{vmStats.stopped}</div></div>
                  </div>
                )}
                <div className="bg-gray-700 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div><h3 className="text-lg font-bold text-white mb-2">Resource Optimization</h3><p className="text-gray-400 text-sm">Auto-pause idle VMs (10+ min) and stop very idle VMs (30+ min)</p></div>
                    <button onClick={runOptimization} disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />Run Optimization</button>
                  </div>
                </div>
                <div className="bg-gray-700 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Active VMs ({vms.length})</h2>
                    <button onClick={fetchVMs} className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm"><RefreshCw className="w-4 h-4" />Refresh</button>
                  </div>
                  {vms.length === 0 ? <p className="text-gray-400 text-center py-8">No active VMs</p> : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="border-b border-gray-600"><tr><th className="pb-3 text-gray-300 font-semibold">Container</th><th className="pb-3 text-gray-300 font-semibold">Lab</th><th className="pb-3 text-gray-300 font-semibold">User</th><th className="pb-3 text-gray-300 font-semibold">Status</th><th className="pb-3 text-gray-300 font-semibold">Idle Time</th></tr></thead>
                        <tbody className="divide-y divide-gray-600">
                          {vms.map(vm => (
                            <tr key={vm.container_id} className="hover:bg-gray-600/50">
                              <td className="py-3 text-gray-300 font-mono text-sm">{vm.container_name?.substring(0, 30)}...</td>
                              <td className="py-3 text-gray-300">{vm.lab_id || 'N/A'}</td>
                              <td className="py-3 text-gray-300">User {vm.user_id || 'N/A'}</td>
                              <td className="py-3"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${vm.status === 'running' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : vm.status === 'paused' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'}`}>{vm.status}</span></td>
                              <td className="py-3 text-gray-400">{vm.idle_minutes !== undefined ? `${vm.idle_minutes.toFixed(1)} min` : 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Course-Lab Linker Tab */}
            {activeTab === 'linker' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Link2 className="w-6 h-6 text-cyan-400" />
                    Course-Lab Linker
                  </h2>
                  <p className="text-gray-400">Connect labs to courses to build complete learning paths</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Course Selection */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-emerald-400" />
                      Select a Course
                    </h3>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {linkerCourses.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No courses available</p>
                      ) : linkerCourses.map(course => (
                        <div
                          key={course.id}
                          onClick={() => selectCourseForLinking(course)}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            selectedLinkerCourse?.id === course.id
                              ? 'bg-emerald-600/20 border-2 border-emerald-500'
                              : 'bg-gray-800 hover:bg-gray-600 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{course.title}</h4>
                              <p className="text-gray-400 text-xs">{course.category} • {course.difficulty}</p>
                            </div>
                            <span className="px-2 py-1 bg-purple-600/30 text-purple-300 rounded text-xs">
                              {course.linked_labs_count} labs
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Linked Labs */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Check className="w-5 h-5 text-green-400" />
                      Linked Labs
                      {selectedLinkerCourse && <span className="text-gray-400 text-sm font-normal">({courseLinkedLabs.length})</span>}
                    </h3>
                    {!selectedLinkerCourse ? (
                      <div className="text-center py-12 text-gray-500">
                        <ArrowRight className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Select a course to see linked labs</p>
                      </div>
                    ) : courseLinkedLabs.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Beaker className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No labs linked yet</p>
                        <p className="text-sm">Add labs from the right panel</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {courseLinkedLabs.map((link, index) => (
                          <div key={link.content_id} className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex items-start gap-3">
                                <span className="bg-emerald-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                                  {index + 1}
                                </span>
                                <div>
                                  <h4 className="font-medium">{link.lab_title}</h4>
                                  <p className="text-gray-400 text-xs">{link.lab_category} • {link.lab_difficulty}</p>
                                  <p className="text-gray-500 text-xs mt-1">In: {link.module_title}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => unlinkLabFromCourse(link.content_id)}
                                className="p-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded transition-colors"
                                title="Unlink lab"
                              >
                                <Unlink className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Available Labs */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Beaker className="w-5 h-5 text-purple-400" />
                      Available Labs
                      {selectedLinkerCourse && <span className="text-gray-400 text-sm font-normal">({getUnlinkedLabs().length})</span>}
                    </h3>
                    {!selectedLinkerCourse ? (
                      <div className="text-center py-12 text-gray-500">
                        <Beaker className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Select a course first</p>
                      </div>
                    ) : getUnlinkedLabs().length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Check className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>All labs are linked!</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {getUnlinkedLabs().map(lab => (
                          <div key={lab.id} className="bg-gray-800 p-3 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{lab.title}</h4>
                                <p className="text-gray-400 text-xs">{lab.category} • {lab.difficulty}</p>
                              </div>
                              <button
                                onClick={() => linkLabToCourse(lab.id)}
                                disabled={linkingLab === lab.id}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded text-sm flex items-center gap-1 transition-colors"
                              >
                                {linkingLab === lab.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Plus className="w-3 h-3" />
                                )}
                                Link
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                {selectedLinkerCourse && (
                  <div className="mt-6 bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 border border-emerald-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <GraduationCap className="w-10 h-10 text-emerald-400" />
                        <div>
                          <h3 className="font-bold text-lg">{selectedLinkerCourse.title}</h3>
                          <p className="text-gray-400 text-sm">{selectedLinkerCourse.category} • Semester {selectedLinkerCourse.semester_level}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-emerald-400">{courseLinkedLabs.length}</p>
                        <p className="text-gray-400 text-sm">Labs Linked</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminPanel;
