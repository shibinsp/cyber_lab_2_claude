import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';
import Layout from '../components/Layout';
import { User, Mail, Building, GraduationCap, Shield, BookOpen, FlaskConical, Award } from 'lucide-react';

export default function Profile() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileStats();
  }, []);

  const fetchProfileStats = async () => {
    try {
      const [enrolledRes, progressRes, quizRes] = await Promise.all([
        axios.get(`${API_URL}/courses/enrolled/list`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/users/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/quiz/results`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats({
        enrolledCourses: enrolledRes.data.length,
        completedLabs: progressRes.data.filter(p => p.completed).length,
        totalLabs: progressRes.data.length,
        quizResults: quizRes.data
      });
    } catch (error) {
      console.error('Failed to fetch profile stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="text-gray-400">View and manage your account information</p>
        </div>

        {/* Profile Card */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20"></div>
          <div className="p-6 -mt-12">
            <div className="flex items-end gap-4 mb-6">
              <div className="w-24 h-24 bg-emerald-500 rounded-xl flex items-center justify-center text-3xl font-bold text-white border-4 border-gray-800">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="mb-2">
                <h2 className="text-xl font-bold text-white">{user?.username}</h2>
                <p className="text-gray-400 text-sm">{user?.role === 'admin' ? 'Administrator' : 'Student'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                <Mail className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-white">{user?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                <Building className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-xs text-gray-400">Department</p>
                  <p className="text-white">{user?.department || 'Not set'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-xs text-gray-400">Semester</p>
                  <p className="text-white">Semester {user?.semester}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                <Shield className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-xs text-gray-400">Role</p>
                  <p className="text-white capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <BookOpen className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-gray-400">Enrolled Courses</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats?.enrolledCourses || 0}</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <FlaskConical className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-gray-400">Labs Completed</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats?.completedLabs || 0}</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Award className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-gray-400">Quiz Completed</span>
            </div>
            <p className="text-2xl font-bold text-white">{user?.quiz_completed ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {/* Quiz Results */}
        {stats?.quizResults && stats.quizResults.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Quiz Results</h3>
            <div className="space-y-3">
              {stats.quizResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <span className="text-gray-300">{result.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">
                      {result.score}/{result.max_score}
                    </span>
                    <span className={`font-bold ${
                      result.percentage >= 70 ? 'text-emerald-400' :
                      result.percentage >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {Math.round(result.percentage)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
