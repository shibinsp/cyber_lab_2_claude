import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';
import Layout from '../components/Layout';
import {
  Users,
  BookOpen,
  ClipboardCheck,
  Settings,
  Trash2,
  Shield,
  Plus,
  RefreshCw
} from 'lucide-react';

export default function Admin() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'stats':
          const statsRes = await axios.get(`${API_URL}/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setStats(statsRes.data);
          break;
        case 'users':
          const usersRes = await axios.get(`${API_URL}/admin/users`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUsers(usersRes.data);
          break;
        case 'courses':
          const coursesRes = await axios.get(`${API_URL}/admin/courses`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCourses(coursesRes.data);
          break;
        case 'quizzes':
          const quizzesRes = await axios.get(`${API_URL}/admin/quizzes`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setQuizzes(quizzesRes.data);
          break;
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeData = async () => {
    try {
      await axios.post(`${API_URL}/admin/init-data`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Sample data initialized successfully!');
      fetchData();
    } catch (error) {
      alert('Failed to initialize data');
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      await axios.put(`${API_URL}/admin/users/${userId}/role?role=${role}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      alert('Failed to update user role');
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const deleteCourse = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await axios.delete(`${API_URL}/admin/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      alert('Failed to delete course');
    }
  };

  const deleteQuiz = async (quizId) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await axios.delete(`${API_URL}/admin/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      alert('Failed to delete quiz');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-400">Admin access required</p>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'stats', label: 'Dashboard', icon: Settings },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'quizzes', label: 'Quizzes', icon: ClipboardCheck },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400">Manage your LMS platform</p>
          </div>
          <button
            onClick={initializeData}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            <RefreshCw className="w-4 h-4" />
            Initialize Sample Data
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-700 pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-white'
                  : 'text-gray-400 hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
          </div>
        ) : (
          <>
            {/* Stats Tab */}
            {activeTab === 'stats' && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <p className="text-gray-400 text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.total_users}</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <p className="text-gray-400 text-sm">Total Courses</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.total_courses}</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <p className="text-gray-400 text-sm">Total Enrollments</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.total_enrollments}</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                    <p className="text-gray-400 text-sm">Quiz Completed</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.quiz_completed}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Users by Role</h3>
                    <div className="space-y-3">
                      {stats.users_by_role?.map((role, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-gray-300 capitalize">{role.role}</span>
                          <span className={`font-semibold ${role.role === 'admin' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                            {role.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">Users by Department</h3>
                    <div className="space-y-3">
                      {stats.users_by_department?.map((dept, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-gray-300">{dept.department}</span>
                          <span className="text-emerald-400 font-semibold">{dept.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Users</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-400">
                          <th className="pb-3">Username</th>
                          <th className="pb-3">Email</th>
                          <th className="pb-3">Department</th>
                          <th className="pb-3">Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {stats.recent_users?.map((user) => (
                          <tr key={user.id}>
                            <td className="py-2 text-white">{user.username}</td>
                            <td className="py-2 text-gray-400">{user.email}</td>
                            <td className="py-2 text-gray-400">{user.department || 'N/A'}</td>
                            <td className="py-2">
                              <span className={`px-2 py-1 text-xs rounded ${
                                user.role === 'admin' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Username</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Department</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {users.map(u => (
                      <tr key={u.id}>
                        <td className="px-4 py-3 text-sm text-white">{u.username}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{u.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{u.department}</td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => updateUserRole(u.id, e.target.value)}
                            className="bg-gray-700 text-sm text-white rounded px-2 py-1"
                          >
                            <option value="student">Student</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => deleteUser(u.id)}
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
            )}

            {/* Courses Tab */}
            {activeTab === 'courses' && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Title</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Category</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Difficulty</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Duration</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {courses.map(course => (
                      <tr key={course.id}>
                        <td className="px-4 py-3 text-sm text-white">{course.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{course.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{course.difficulty}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{course.duration}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => deleteCourse(course.id)}
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
            )}

            {/* Quizzes Tab */}
            {activeTab === 'quizzes' && (
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Title</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Category</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Questions</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {quizzes.map(quiz => (
                      <tr key={quiz.id}>
                        <td className="px-4 py-3 text-sm text-white">{quiz.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{quiz.category}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">{quiz.question_count}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded ${
                            quiz.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {quiz.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => deleteQuiz(quiz.id)}
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
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
