import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';
import Layout from '../components/Layout';
import { User, Mail, Building, GraduationCap, Shield, BookOpen, FlaskConical, Award, Plus, Clock, Trophy, CheckCircle, ClipboardCheck } from 'lucide-react';

export default function Profile() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProfileStats();
    fetchQuizAttempts();
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

  const fetchQuizAttempts = async () => {
    try {
      const res = await axios.get(`${API_URL}/quiz/assessment`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizAttempts(res.data.attempts || []);
    } catch (error) {
      console.error('Failed to fetch quiz attempts:', error);
    }
  };

  const createNewQuiz = async () => {
    setCreating(true);
    try {
      await axios.post(
        `${API_URL}/quiz/assessment/create`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Navigate to quiz page
      navigate('/quiz');
    } catch (error) {
      console.error('Failed to create quiz:', error);
      alert('Failed to create new quiz. Please try again.');
    } finally {
      setCreating(false);
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

        {/* Quiz Attempts */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Assessment Quiz Attempts</h3>
            <button
              onClick={createNewQuiz}
              disabled={creating}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              {creating ? 'Creating...' : 'Create New Quiz'}
            </button>
          </div>

          {quizAttempts.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardCheck className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">No quiz attempts yet</p>
              <button
                onClick={createNewQuiz}
                disabled={creating}
                className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating...' : 'Create Your First Quiz'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {quizAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors cursor-pointer"
                  onClick={() => navigate('/quiz')}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      attempt.is_completed 
                        ? 'bg-emerald-500/20' 
                        : 'bg-yellow-500/20'
                    }`}>
                      {attempt.is_completed ? (
                        <CheckCircle className={`w-5 h-5 ${
                          attempt.percentage >= 70 ? 'text-emerald-400' :
                          attempt.percentage >= 50 ? 'text-yellow-400' : 'text-red-400'
                        }`} />
                      ) : (
                        <Clock className="w-5 h-5 text-yellow-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        Attempt #{attempt.attempt_number}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(attempt.started_at).toLocaleDateString()} at{' '}
                        {new Date(attempt.started_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {attempt.is_completed ? (
                      <>
                        <div className="flex items-center gap-2 justify-end mb-1">
                          <Trophy className={`w-4 h-4 ${
                            attempt.percentage >= 70 ? 'text-emerald-400' :
                            attempt.percentage >= 50 ? 'text-yellow-400' : 'text-red-400'
                          }`} />
                          <span className={`text-lg font-bold ${
                            attempt.percentage >= 70 ? 'text-emerald-400' :
                            attempt.percentage >= 50 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {Math.round(attempt.percentage)}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          {attempt.total_score}/{attempt.max_score} points
                        </p>
                      </>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quiz Results (Category Breakdown) */}
        {stats?.quizResults && stats.quizResults.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Category Scores</h3>
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
