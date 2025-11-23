import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield, Terminal, Globe, Clock, BarChart3,
  Play, CheckCircle, LogOut, User
} from 'lucide-react';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';

export default function Dashboard() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const res = await axios.get(`${API_URL}/labs/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLabs(res.data);
    } catch (err) {
      console.error('Failed to fetch labs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (category) => {
    if (category?.includes('Linux')) return Terminal;
    if (category?.includes('Web')) return Globe;
    return Shield;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Basic': return 'text-emerald-400 bg-emerald-400/10';
      case 'Intermediate': return 'text-amber-400 bg-amber-400/10';
      case 'Advanced': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const isRecommended = (lab) => {
    if (!user) return false;
    if (user.semester <= 3 && lab.difficulty === 'Basic') return true;
    if (user.semester >= 4 && user.semester <= 6 && lab.difficulty === 'Intermediate') return true;
    if (user.semester >= 7 && lab.difficulty === 'Advanced') return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-emerald-400" />
              <span className="text-xl font-bold text-white">ISC Cyber Range</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-300">
                <User className="w-5 h-5" />
                <span>{user?.username}</span>
                <span className="text-xs bg-slate-700 px-2 py-1 rounded">Sem {user?.semester}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Training Labs</h1>
          <p className="text-gray-400">Select a lab to begin your cybersecurity training</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {labs.map((lab, index) => {
              const Icon = getIcon(lab.category);
              const progress = lab.progress;
              const progressPercent = progress ? (progress.current_step / progress.total_steps) * 100 : 0;

              return (
                <motion.div
                  key={lab.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`card hover:border-slate-600 transition-all cursor-pointer group ${
                    isRecommended(lab) ? 'ring-2 ring-emerald-500/50' : ''
                  }`}
                  onClick={() => navigate(`/lab/${lab.id}`)}
                >
                  {isRecommended(lab) && (
                    <div className="absolute -top-2 -right-2 bg-emerald-500 text-black text-xs font-bold px-2 py-1 rounded">
                      Recommended
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-slate-700 rounded-lg group-hover:bg-slate-600 transition-colors">
                      <Icon className="w-6 h-6 text-emerald-400" />
                    </div>
                    {progress?.completed && (
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2">{lab.title}</h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{lab.description}</p>

                  <div className="flex items-center gap-3 mb-4">
                    <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(lab.difficulty)}`}>
                      {lab.difficulty}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {lab.duration}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{progress?.current_step || 0}/{progress?.total_steps || 0}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <button className="btn-primary w-full flex items-center justify-center gap-2 group-hover:bg-emerald-400">
                    <Play className="w-4 h-4" />
                    {progress?.current_step > 0 ? 'Continue Lab' : 'Start Lab'}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
