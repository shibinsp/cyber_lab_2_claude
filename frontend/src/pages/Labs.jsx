import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';
import Layout from '../components/Layout';
import { FlaskConical, Clock, Play, CheckCircle } from 'lucide-react';
import Pagination from '../components/Pagination';

export default function Labs() {
  const { token, user } = useAuth();
  const [labs, setLabs] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Pagination
  const totalPages = Math.ceil(labs.length / itemsPerPage);
  const paginatedLabs = labs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      // Admin sees all labs, students see only enrolled course labs
      const labsEndpoint = user?.role === 'admin'
        ? `${API_URL}/labs/`
        : `${API_URL}/courses/enrolled/labs`;

      const [labsRes, progressRes] = await Promise.all([
        axios.get(labsEndpoint, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/users/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setLabs(labsRes.data);

      const progressMap = {};
      progressRes.data.forEach(p => {
        progressMap[p.lab_id] = p;
      });
      setProgress(progressMap);
    } catch (error) {
      console.error('Failed to fetch labs:', error);
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
        <div>
          <h1 className="text-2xl font-bold text-white">Labs</h1>
          <p className="text-gray-400">Hands-on cybersecurity exercises</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedLabs.map(lab => {
            const labProgress = progress[lab.id];
            const isCompleted = labProgress?.completed;
            const inProgress = labProgress && !labProgress.completed;

            return (
              <div
                key={lab.id}
                className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors"
              >
                <div className={`h-32 flex items-center justify-center ${
                  isCompleted ? 'bg-emerald-500/20' : 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="w-12 h-12 text-emerald-400" />
                  ) : (
                    <FlaskConical className="w-12 h-12 text-purple-400" />
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      lab.difficulty === 'Basic' ? 'bg-green-500/20 text-green-400' :
                      lab.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {lab.difficulty}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded">
                      {lab.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2">{lab.title}</h3>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{lab.description}</p>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {lab.duration}
                    </span>
                    {inProgress && (
                      <span className="text-yellow-400">
                        Step {labProgress.current_step}/{lab.tasks?.length || '?'}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/lab/${lab.id}`}
                    className={`flex items-center justify-center gap-2 w-full py-2 rounded-lg transition-colors text-sm ${
                      isCompleted
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-emerald-500 text-white hover:bg-emerald-600'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    {isCompleted ? 'Review Lab' : inProgress ? 'Continue' : 'Start Lab'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {labs.length === 0 && (
          <div className="text-center py-12">
            <FlaskConical className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No labs available</p>
            {user?.role !== 'admin' && (
              <>
                <p className="text-gray-500 text-sm mt-2">Enroll in courses to access labs</p>
                <Link
                  to="/courses"
                  className="inline-block mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm"
                >
                  Browse Courses
                </Link>
              </>
            )}
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </Layout>
  );
}
