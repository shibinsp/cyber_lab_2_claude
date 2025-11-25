import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import Layout from '../components/Layout';
import {
  Users,
  BookOpen,
  ClipboardCheck,
  Settings,
  Trash2,
  Shield,
  Plus,
  RefreshCw,
  Beaker,
  GraduationCap,
  Wrench
} from 'lucide-react';
import './AdminPanel.css';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stats');
  
  // Old admin features state
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [oldCourses, setOldCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  
  // New admin features state
  const [courses, setCourses] = useState([]);
  const [labs, setLabs] = useState([]);
  const [vms, setVms] = useState([]);
  const [vmStats, setVmStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination state for courses
  const [coursePagination, setCoursePagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  });
  const [courseSearch, setCourseSearch] = useState('');

  // Pagination state for labs
  const [labPagination, setLabPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    total_pages: 0
  });
  const [labSearch, setLabSearch] = useState('');
  const [labCategoryFilter, setLabCategoryFilter] = useState('');
  const [labDifficultyFilter, setLabDifficultyFilter] = useState('');

  // Course form state
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'Beginner',
    duration: '',
    semester_level: 1,
    image_url: '',
    is_active: true
  });

  // Lab form state
  const [labForm, setLabForm] = useState({
    id: '',
    title: '',
    description: '',
    category: '',
    difficulty: 'Basic',
    duration: '',
    semester_level: 1,
    vm_enabled: true,
    is_active: true
  });

  const [editingCourse, setEditingCourse] = useState(null);
  const [editingLab, setEditingLab] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    fetchData();
  }, [activeTab, navigate]);

  const getAuthHeaders = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  // Fetch data based on active tab
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stats') {
        await fetchStats();
      } else if (activeTab === 'users') {
        await fetchUsers();
      } else if (activeTab === 'old-courses') {
        await fetchOldCourses();
      } else if (activeTab === 'quizzes') {
        await fetchQuizzes();
      } else if (activeTab === 'courses') {
        await fetchCourses();
      } else if (activeTab === 'labs') {
        await fetchLabs();
      } else if (activeTab === 'vms') {
        await fetchVMs();
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Old admin functions
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/stats`, getAuthHeaders());
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/users`, getAuthHeaders());
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchOldCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/courses`, getAuthHeaders());
      setOldCourses(response.data);
    } catch (err) {
      console.error('Error fetching old courses:', err);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/quizzes`, getAuthHeaders());
      setQuizzes(response.data);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`${API_URL}/admin/users/${userId}`, getAuthHeaders());
      fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const deleteQuiz = async (quizId) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await axios.delete(`${API_URL}/admin/quizzes/${quizId}`, getAuthHeaders());
      fetchQuizzes();
    } catch (err) {
      console.error('Error deleting quiz:', err);
    }
  };

  // New admin functions - Courses
  const fetchCourses = async (page = coursePagination.page, search = courseSearch) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: coursePagination.per_page.toString(),
        include_inactive: 'true'
      });

      if (search) {
        params.append('search', search);
      }

      const response = await axios.get(
        `${API_URL}/admin/courses/?${params.toString()}`,
        getAuthHeaders()
      );

      setCourses(response.data.courses || []);
      setCoursePagination({
        ...coursePagination,
        ...response.data.pagination
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch courses');
    }
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingCourse) {
        await axios.put(`${API_URL}/admin/courses/${editingCourse.id}`, courseForm, getAuthHeaders());
        setSuccess('Course updated successfully!');
      } else {
        await axios.post(`${API_URL}/admin/courses/`, courseForm, getAuthHeaders());
        setSuccess('Course created successfully!');
      }
      
      resetCourseForm();
      fetchCourses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save course');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    
    try {
      await axios.delete(`${API_URL}/admin/courses/${courseId}`, getAuthHeaders());
      setSuccess('Course deleted successfully!');
      fetchCourses();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete course');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description || '',
      category: course.category || '',
      difficulty: course.difficulty,
      duration: course.duration || '',
      semester_level: course.semester_level,
      image_url: course.image_url || '',
      is_active: course.is_active
    });
  };

  const resetCourseForm = () => {
    setEditingCourse(null);
    setCourseForm({
      title: '',
      description: '',
      category: '',
      difficulty: 'Beginner',
      duration: '',
      semester_level: 1,
      image_url: '',
      is_active: true
    });
  };

  // New admin functions - Labs
  const fetchLabs = async (page = labPagination.page, search = labSearch) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: labPagination.per_page.toString(),
        include_inactive: 'true'
      });

      if (search) {
        params.append('search', search);
      }
      if (labCategoryFilter) {
        params.append('category', labCategoryFilter);
      }
      if (labDifficultyFilter) {
        params.append('difficulty', labDifficultyFilter);
      }

      const response = await axios.get(
        `${API_URL}/admin/labs/?${params.toString()}`,
        getAuthHeaders()
      );

      setLabs(response.data.labs || []);
      setLabPagination({
        ...labPagination,
        ...response.data.pagination
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch labs');
    }
  };

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
      setError('');
    } catch (err) {
      console.error('Failed to fetch VMs:', err);
      setError('Failed to fetch VMs');
      setVms([]);
      setVmStats(null);
    }
  };

  const runOptimization = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/vm/admin/optimize`, {}, getAuthHeaders());
      setSuccess(`Optimization complete: Paused ${res.data.optimization_result.paused} VMs, Stopped ${res.data.optimization_result.stopped} VMs`);
      await fetchVMs();
    } catch (err) {
      setError('Failed to run optimization');
    } finally {
      setLoading(false);
    }
  };

  const handleLabSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingLab) {
        await axios.put(`${API_URL}/admin/labs/${editingLab.id}`, labForm, getAuthHeaders());
        setSuccess('Lab updated successfully!');
      } else {
        await axios.post(`${API_URL}/admin/labs/`, labForm, getAuthHeaders());
        setSuccess('Lab created successfully!');
      }
      
      resetLabForm();
      fetchLabs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save lab');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLab = async (labId) => {
    if (!confirm('Are you sure you want to delete this lab?')) return;
    
    try {
      await axios.delete(`${API_URL}/admin/labs/${labId}`, getAuthHeaders());
      setSuccess('Lab deleted successfully!');
      fetchLabs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete lab');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleEditLab = (lab) => {
    setEditingLab(lab);
    setLabForm({
      id: lab.id,
      title: lab.title,
      description: lab.description || '',
      category: lab.category || '',
      difficulty: lab.difficulty,
      duration: lab.duration || '',
      semester_level: lab.semester_level,
      vm_enabled: lab.vm_enabled,
      is_active: lab.is_active
    });
  };

  const resetLabForm = () => {
    setEditingLab(null);
    setLabForm({
      id: '',
      title: '',
      description: '',
      category: '',
      difficulty: 'Basic',
      duration: '',
      semester_level: 1,
      vm_enabled: true,
      is_active: true
    });
  };

  const navigateToToolManager = (labId) => {
    navigate(`/admin/labs/${labId}/tools`);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Shield className="w-8 h-8 text-emerald-400" />
              Admin Panel
            </h1>
            <p className="text-gray-400">Manage your Cyyberlabs platform</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-200">
              {success}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === 'stats'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === 'users'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Users
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === 'courses'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Course Management
            </button>
            <button
              onClick={() => setActiveTab('labs')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === 'labs'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Beaker className="w-4 h-4" />
              Lab Management
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === 'quizzes'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              Quizzes
            </button>
            <button
              onClick={() => setActiveTab('vms')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                activeTab === 'vms'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              VM Monitoring
            </button>
          </div>

          {/* Content */}
          <div className="bg-gray-800 rounded-lg p-6">
            {/* Stats Tab */}
            {activeTab === 'stats' && stats && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Platform Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">Users by Role</h3>
                    <div className="space-y-2">
                      {stats.users_by_role?.map((role) => (
                        <div key={role.role} className="flex justify-between">
                          <span className="capitalize">{role.role}</span>
                          <span className="font-bold">{role.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">Users by Department</h3>
                    <div className="space-y-2">
                      {stats.users_by_department?.map((dept) => (
                        <div key={dept.department} className="flex justify-between">
                          <span>{dept.department}</span>
                          <span className="font-bold">{dept.count}</span>
                        </div>
                      ))}
                    </div>
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
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-3">Username</th>
                        <th className="text-left p-3">Email</th>
                        <th className="text-left p-3">Department</th>
                        <th className="text-left p-3">Role</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="p-3">{user.username}</td>
                          <td className="p-3">{user.email}</td>
                          <td className="p-3">{user.department}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded ${
                              user.role === 'admin' ? 'bg-yellow-600' : 'bg-blue-600'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
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
                  <button className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Quiz
                  </button>
                </div>
                <div className="space-y-4">
                  {quizzes.map((quiz) => (
                    <div key={quiz.id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                      <div>
                        <h3 className="font-bold">{quiz.title}</h3>
                        <p className="text-gray-400 text-sm">{quiz.course_title}</p>
                        <p className="text-gray-400 text-sm">{quiz.total_questions} questions</p>
                      </div>
                      <button
                        onClick={() => deleteQuiz(quiz.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Course Management Tab */}
            {activeTab === 'courses' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="bg-gray-700 p-6 rounded-lg">
                  <h2 className="text-xl font-bold mb-4">
                    {editingCourse ? 'Edit Course' : 'Create New Course'}
                  </h2>
                  <form onSubmit={handleCourseSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1">Title *</label>
                      <input
                        type="text"
                        value={courseForm.title}
                        onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Description</label>
                      <textarea
                        value={courseForm.description}
                        onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                        rows="3"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm mb-1">Category</label>
                        <input
                          type="text"
                          value={courseForm.category}
                          onChange={(e) => setCourseForm({...courseForm, category: e.target.value})}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Difficulty</label>
                        <select
                          value={courseForm.difficulty}
                          onChange={(e) => setCourseForm({...courseForm, difficulty: e.target.value})}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                        >
                          <option>Beginner</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm mb-1">Duration</label>
                        <input
                          type="text"
                          value={courseForm.duration}
                          onChange={(e) => setCourseForm({...courseForm, duration: e.target.value})}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                          placeholder="4 weeks"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Semester</label>
                        <input
                          type="number"
                          min="1"
                          max="8"
                          value={courseForm.semester_level}
                          onChange={(e) => setCourseForm({...courseForm, semester_level: parseInt(e.target.value)})}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Image URL</label>
                      <input
                        type="url"
                        value={courseForm.image_url}
                        onChange={(e) => setCourseForm({...courseForm, image_url: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={courseForm.is_active}
                          onChange={(e) => setCourseForm({...courseForm, is_active: e.target.checked})}
                          className="rounded"
                        />
                        Active
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg disabled:opacity-50"
                      >
                        {editingCourse ? 'Update' : 'Create'}
                      </button>
                      {editingCourse && (
                        <button
                          type="button"
                          onClick={resetCourseForm}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2">
                  <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Existing Courses ({coursePagination.total})</h2>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Search courses..."
                        value={courseSearch}
                        onChange={(e) => {
                          setCourseSearch(e.target.value);
                          setCoursePagination({...coursePagination, page: 1});
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && fetchCourses(1, e.target.value)}
                        className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => fetchCourses(1, courseSearch)}
                        className="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded text-sm"
                      >
                        Search
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {courses.length === 0 ? (
                      <div className="bg-gray-700 p-8 rounded-lg text-center text-gray-400">
                        <p>No courses found. Create your first course using the form.</p>
                      </div>
                    ) : (
                      courses.map(course => (
                      <div key={course.id} className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg">{course.title}</h3>
                          <span className={`px-2 py-1 rounded text-sm ${
                            course.is_active ? 'bg-green-600' : 'bg-red-600'
                          }`}>
                            {course.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{course.description}</p>
                        <div className="flex gap-3 text-sm text-gray-400 mb-3">
                          <span>📂 {course.category}</span>
                          <span>📊 {course.difficulty}</span>
                          <span>🎓 Semester {course.semester_level}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditCourse(course)}
                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(course.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {coursePagination.total_pages > 1 && (
                    <div className="mt-6 flex justify-center items-center gap-2">
                      <button
                        onClick={() => fetchCourses(1)}
                        disabled={coursePagination.page === 1}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ««
                      </button>
                      <button
                        onClick={() => fetchCourses(coursePagination.page - 1)}
                        disabled={!coursePagination.has_prev}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ‹ Previous
                      </button>
                      <span className="px-4 py-1 bg-gray-700 rounded">
                        Page {coursePagination.page} of {coursePagination.total_pages}
                      </span>
                      <button
                        onClick={() => fetchCourses(coursePagination.page + 1)}
                        disabled={!coursePagination.has_next}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next ›
                      </button>
                      <button
                        onClick={() => fetchCourses(coursePagination.total_pages)}
                        disabled={coursePagination.page === coursePagination.total_pages}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        »»
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lab Management Tab */}
            {activeTab === 'labs' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="bg-gray-700 p-6 rounded-lg">
                  <h2 className="text-xl font-bold mb-4">
                    {editingLab ? 'Edit Lab' : 'Create New Lab'}
                  </h2>
                  <form onSubmit={handleLabSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1">
                        Lab ID * {!editingLab && <span className="text-gray-400">(lab_xxx)</span>}
                      </label>
                      <input
                        type="text"
                        value={labForm.id}
                        onChange={(e) => setLabForm({...labForm, id: e.target.value})}
                        disabled={editingLab}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 disabled:opacity-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Title *</label>
                      <input
                        type="text"
                        value={labForm.title}
                        onChange={(e) => setLabForm({...labForm, title: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Description</label>
                      <textarea
                        value={labForm.description}
                        onChange={(e) => setLabForm({...labForm, description: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                        rows="3"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm mb-1">Category</label>
                        <input
                          type="text"
                          value={labForm.category}
                          onChange={(e) => setLabForm({...labForm, category: e.target.value})}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Difficulty</label>
                        <select
                          value={labForm.difficulty}
                          onChange={(e) => setLabForm({...labForm, difficulty: e.target.value})}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                        >
                          <option>Basic</option>
                          <option>Intermediate</option>
                          <option>Advanced</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm mb-1">Duration</label>
                        <input
                          type="text"
                          value={labForm.duration}
                          onChange={(e) => setLabForm({...labForm, duration: e.target.value})}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                          placeholder="2 hours"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Semester</label>
                        <input
                          type="number"
                          min="1"
                          max="8"
                          value={labForm.semester_level}
                          onChange={(e) => setLabForm({...labForm, semester_level: parseInt(e.target.value)})}
                          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={labForm.vm_enabled}
                          onChange={(e) => setLabForm({...labForm, vm_enabled: e.target.checked})}
                          className="rounded"
                        />
                        VM Enabled
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={labForm.is_active}
                          onChange={(e) => setLabForm({...labForm, is_active: e.target.checked})}
                          className="rounded"
                        />
                        Active
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg disabled:opacity-50"
                      >
                        {editingLab ? 'Update' : 'Create'}
                      </button>
                      {editingLab && (
                        <button
                          type="button"
                          onClick={resetLabForm}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold mb-3">Existing Labs ({labPagination.total})</h2>

                    {/* Search and Filters */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="Search labs..."
                        value={labSearch}
                        onChange={(e) => {
                          setLabSearch(e.target.value);
                          setLabPagination({...labPagination, page: 1});
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && fetchLabs(1, e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
                      />
                      <select
                        value={labDifficultyFilter}
                        onChange={(e) => {
                          setLabDifficultyFilter(e.target.value);
                          setLabPagination({...labPagination, page: 1});
                          fetchLabs(1, labSearch);
                        }}
                        className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm"
                      >
                        <option value="">All Difficulties</option>
                        <option>Basic</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </select>
                      <button
                        onClick={() => fetchLabs(1, labSearch)}
                        className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded text-sm"
                      >
                        Search
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {labs.length === 0 ? (
                      <div className="bg-gray-700 p-8 rounded-lg text-center text-gray-400">
                        <p>No labs found. Create your first lab using the form.</p>
                      </div>
                    ) : (
                      labs.map(lab => (
                      <div key={lab.id} className="bg-gray-700 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg">{lab.title}</h3>
                          <span className={`px-2 py-1 rounded text-sm ${
                            lab.is_active ? 'bg-green-600' : 'bg-red-600'
                          }`}>
                            {lab.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{lab.description}</p>
                        <div className="flex gap-3 text-sm text-gray-400 mb-3">
                          <span>📂 {lab.category}</span>
                          <span>📊 {lab.difficulty}</span>
                          <span>🎓 Semester {lab.semester_level}</span>
                          <span>🖥️ {lab.vm_enabled ? 'VM Enabled' : 'No VM'}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigateToToolManager(lab.id)}
                            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-sm flex items-center gap-1"
                          >
                            <Wrench className="w-3 h-3" />
                            Tools
                          </button>
                          <button
                            onClick={() => handleEditLab(lab)}
                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteLab(lab.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {labPagination.total_pages > 1 && (
                    <div className="mt-6 flex justify-center items-center gap-2">
                      <button
                        onClick={() => fetchLabs(1)}
                        disabled={labPagination.page === 1}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ««
                      </button>
                      <button
                        onClick={() => fetchLabs(labPagination.page - 1)}
                        disabled={!labPagination.has_prev}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ‹ Previous
                      </button>
                      <span className="px-4 py-1 bg-gray-700 rounded">
                        Page {labPagination.page} of {labPagination.total_pages}
                      </span>
                      <button
                        onClick={() => fetchLabs(labPagination.page + 1)}
                        disabled={!labPagination.has_next}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next ›
                      </button>
                      <button
                        onClick={() => fetchLabs(labPagination.total_pages)}
                        disabled={labPagination.page === labPagination.total_pages}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        »»
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VM Monitoring Tab */}
            {activeTab === 'vms' && (
              <div className="space-y-6">
                {/* VM Stats */}
                {vmStats && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-700 p-6 rounded-lg">
                      <div className="text-gray-400 text-sm mb-1">Total VMs</div>
                      <div className="text-3xl font-bold text-white">{vmStats.total}</div>
                    </div>
                    <div className="bg-green-600/20 border border-green-600/50 p-6 rounded-lg">
                      <div className="text-green-300 text-sm mb-1">Running</div>
                      <div className="text-3xl font-bold text-green-400">{vmStats.running}</div>
                    </div>
                    <div className="bg-blue-600/20 border border-blue-600/50 p-6 rounded-lg">
                      <div className="text-blue-300 text-sm mb-1">Paused</div>
                      <div className="text-3xl font-bold text-blue-400">{vmStats.paused}</div>
                    </div>
                    <div className="bg-gray-600/20 border border-gray-600/50 p-6 rounded-lg">
                      <div className="text-gray-300 text-sm mb-1">Stopped</div>
                      <div className="text-3xl font-bold text-gray-400">{vmStats.stopped}</div>
                    </div>
                  </div>
                )}

                {/* Optimization Control */}
                <div className="bg-gray-700 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">Resource Optimization</h3>
                      <p className="text-gray-400 text-sm">
                        Auto-pause idle VMs (10+ min) and stop very idle VMs (30+ min) to save resources
                      </p>
                    </div>
                    <button
                      onClick={runOptimization}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                      Run Optimization
                    </button>
                  </div>
                </div>

                {/* VM List */}
                <div className="bg-gray-700 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Active VMs ({vms.length})</h2>
                    <button
                      onClick={fetchVMs}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                  </div>

                  {vms.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">No active VMs</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="border-b border-gray-600">
                          <tr>
                            <th className="pb-3 text-gray-300 font-semibold">Container</th>
                            <th className="pb-3 text-gray-300 font-semibold">Lab</th>
                            <th className="pb-3 text-gray-300 font-semibold">User</th>
                            <th className="pb-3 text-gray-300 font-semibold">Status</th>
                            <th className="pb-3 text-gray-300 font-semibold">Idle Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-600">
                          {vms.map((vm) => (
                            <tr key={vm.container_id} className="hover:bg-gray-600/50">
                              <td className="py-3 text-gray-300 font-mono text-sm">
                                {vm.container_name?.substring(0, 30)}...
                              </td>
                              <td className="py-3 text-gray-300">{vm.lab_id || 'N/A'}</td>
                              <td className="py-3 text-gray-300">User {vm.user_id || 'N/A'}</td>
                              <td className="py-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  vm.status === 'running' 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                                    : vm.status === 'paused'
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                                    : 'bg-gray-500/20 text-gray-400 border border-gray-500/50'
                                }`}>
                                  {vm.status}
                                </span>
                              </td>
                              <td className="py-3 text-gray-400">
                                {vm.idle_minutes !== undefined 
                                  ? `${vm.idle_minutes.toFixed(1)} min` 
                                  : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* System Info */}
                <div className="bg-gray-700 p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-white mb-4">System Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 mb-1">Auto-pause Threshold:</p>
                      <p className="text-white font-semibold">10 minutes idle</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Auto-stop Threshold:</p>
                      <p className="text-white font-semibold">30 minutes idle</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Optimization Interval:</p>
                      <p className="text-white font-semibold">Every 5 minutes</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">VM Resources:</p>
                      <p className="text-white font-semibold">2GB RAM, 50% CPU</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminPanel;
