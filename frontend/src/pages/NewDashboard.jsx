import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';
import Layout from '../components/Layout';
import {
  BookOpen,
  FlaskConical,
  Trophy,
  TrendingUp,
  Clock,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export default function NewDashboard() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
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
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl p-6 border border-emerald-500/30">
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome back, {user?.username}!
          </h1>
          <p className="text-gray-300">
            {!stats?.quiz_completed ? (
              <span className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                Complete the assessment quiz to get personalized course recommendations
              </span>
            ) : (
              "Continue your cybersecurity learning journey"
            )}
          </p>
          {!stats?.quiz_completed && (
            <Link
              to="/quiz"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Take Assessment Quiz
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Courses</p>
                <p className="text-2xl font-bold text-white mt-1">{stats?.total_courses || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Enrolled</p>
                <p className="text-2xl font-bold text-white mt-1">{stats?.enrolled_courses || 0}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Labs Completed</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats?.completed_labs || 0}/{stats?.total_labs || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <FlaskConical className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Quiz Score</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats?.quiz_scores?.length > 0
                    ? `${Math.round(stats.quiz_scores.reduce((a, b) => a + b.percentage, 0) / stats.quiz_scores.length)}%`
                    : 'N/A'}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Results */}
        {stats?.quiz_scores?.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Your Skill Assessment</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.quiz_scores.map((score, index) => (
                <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">{score.category}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold">{Math.round(score.percentage)}%</span>
                    <span className="text-xs text-gray-400">{score.score}/{score.max_score}</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        score.percentage >= 70 ? 'bg-emerald-500' :
                        score.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${score.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Courses */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recommended Courses</h2>
            <Link to="/courses" className="text-sm text-emerald-400 hover:text-emerald-300">
              View All
            </Link>
          </div>

          {stats?.recommended_courses?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.recommended_courses.map((course) => (
                <div key={course.id} className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      course.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                      course.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {course.difficulty}
                    </span>
                  </div>
                  <h3 className="text-white font-medium mb-1">{course.title}</h3>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {course.duration}
                    </span>
                    <Link
                      to={`/courses/${course.id}`}
                      className="text-xs text-emerald-400 hover:text-emerald-300"
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              Complete the assessment quiz to get personalized recommendations
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
