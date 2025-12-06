import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Trophy, Award, Medal, TrendingUp, User, Target } from 'lucide-react';

export default function Leaderboard() {
  const { token, user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get(`${API_URL}/users/rank`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLeaderboard(res.data.all_students || []);
      setCurrentUserRank({
        rank: res.data.rank,
        total_students: res.data.total_students,
        total_score: res.data.total_score,
        assessment_score: res.data.assessment_score,
        quiz_score: res.data.quiz_score,
        completed_labs: res.data.completed_labs,
        passed_courses: res.data.passed_courses
      });
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <Award className="w-6 h-6 text-gray-500" />;
  };

  const getRankBadgeColor = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-300/30';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30';
    return 'bg-gray-800/50 border-gray-700';
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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
          <p className="text-gray-400">See where you rank among all students</p>
        </div>

        {/* Current User Rank Card */}
        {currentUserRank && (
          <div className={`p-6 rounded-xl border-2 ${getRankBadgeColor(currentUserRank.rank)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-800/50">
                  {getRankIcon(currentUserRank.rank)}
                </div>
                <div>
                  <p className="text-sm text-gray-400">Your Rank</p>
                  <p className="text-2xl font-bold text-white">
                    #{currentUserRank.rank} of {currentUserRank.total_students}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {currentUserRank.total_score.toFixed(0)} total points
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-400">Assessments</p>
                  <p className="text-lg font-semibold text-white">
                    {currentUserRank.assessment_score.toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Quizzes</p>
                  <p className="text-lg font-semibold text-white">
                    {currentUserRank.quiz_score.toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Labs</p>
                  <p className="text-lg font-semibold text-white">
                    {currentUserRank.completed_labs}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Courses</p>
                  <p className="text-lg font-semibold text-white">
                    {currentUserRank.passed_courses}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">All Students</h2>
            <p className="text-sm text-gray-400 mt-1">
              Rankings based on assessment scores, quiz results, lab completions, and course progress
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Total Score
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Assessment
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Quiz
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Labs
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Courses
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Quiz Attempts
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {leaderboard.map((student, index) => {
                  const isCurrentUser = student.user_id === user?.id;
                  const rank = index + 1;
                  
                  return (
                    <tr
                      key={student.user_id}
                      className={`transition-colors ${
                        isCurrentUser
                          ? 'bg-emerald-500/10 border-l-4 border-emerald-500'
                          : 'hover:bg-gray-700/30'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                            rank === 1 ? 'bg-yellow-500/20' :
                            rank === 2 ? 'bg-gray-300/20' :
                            rank === 3 ? 'bg-amber-600/20' :
                            'bg-gray-700/50'
                          }`}>
                            {getRankIcon(rank)}
                          </div>
                          <span className={`text-lg font-bold ${
                            rank === 1 ? 'text-yellow-400' :
                            rank === 2 ? 'text-gray-300' :
                            rank === 3 ? 'text-amber-400' :
                            'text-gray-400'
                          }`}>
                            #{rank}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                            isCurrentUser
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-600 text-gray-300'
                          }`}>
                            {student.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className={`font-medium ${
                              isCurrentUser ? 'text-emerald-400' : 'text-white'
                            }`}>
                              {student.username}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                                  You
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-lg font-bold text-white">
                          {student.total_score.toFixed(0)}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">pts</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-semibold ${
                          student.assessment_score >= 70 ? 'text-emerald-400' :
                          student.assessment_score >= 50 ? 'text-yellow-400' :
                          'text-gray-400'
                        }`}>
                          {student.assessment_score.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-semibold ${
                          student.quiz_score >= 70 ? 'text-emerald-400' :
                          student.quiz_score >= 50 ? 'text-yellow-400' :
                          'text-gray-400'
                        }`}>
                          {student.quiz_score.toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-white font-medium">
                          {student.completed_labs}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-white font-medium">
                          {student.passed_courses}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-white font-medium">
                          {student.quiz_attempts || 0}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {leaderboard.length === 0 && (
            <div className="p-12 text-center">
              <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No students found</p>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            How Rankings Work
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <p className="font-medium text-white mb-1">Scoring System</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Assessment Scores: 40% weight</li>
                <li>Quiz Scores: 30% weight</li>
                <li>Lab Completions: 20 points each</li>
                <li>Course Completions: 50 points each</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-white mb-1">Tips to Improve</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Complete more labs to earn points</li>
                <li>Pass course assessments</li>
                <li>Score higher on quizzes</li>
                <li>Maintain consistent progress</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

