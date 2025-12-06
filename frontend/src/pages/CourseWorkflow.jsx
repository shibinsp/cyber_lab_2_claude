import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';
import Layout from '../components/Layout';
import {
  ArrowLeft,
  Play,
  CheckCircle,
  Lock,
  BookOpen,
  Video,
  FileText,
  Terminal,
  ClipboardCheck,
  Image as ImageIcon
} from 'lucide-react';

export default function CourseWorkflow() {
  const { courseId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [labs, setLabs] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      const [courseRes, modulesRes, labsRes, progressRes] = await Promise.all([
        axios.get(`${API_URL}/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/courses/${courseId}/modules`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { modules: [] } })),
        axios.get(`${API_URL}/courses/${courseId}/labs`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/users/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setCourse(courseRes.data);
      setModules(modulesRes.data.modules || []);
      setLabs(labsRes.data);

      const progressMap = {};
      progressRes.data.forEach((p) => {
        progressMap[p.lab_id] = p;
      });
      setProgress(progressMap);
    } catch (error) {
      console.error('Failed to fetch course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5 text-blue-400" />;
      case 'text':
        return <FileText className="w-5 h-5 text-gray-400" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-orange-400" />;
      case 'lab_link':
        return <Terminal className="w-5 h-5 text-emerald-400" />;
      case 'document':
        return <FileText className="w-5 h-5 text-cyan-400" />;
      case 'quiz':
        return <ClipboardCheck className="w-5 h-5 text-purple-400" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-yellow-400" />;
      default:
        return <BookOpen className="w-5 h-5 text-gray-400" />;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
      case 'easy':
      case 'basic':
        return { bg: 'from-emerald-600 to-emerald-700', border: 'border-emerald-500', text: 'text-emerald-400', badge: 'bg-emerald-500' };
      case 'intermediate':
      case 'medium':
        return { bg: 'from-yellow-600 to-yellow-700', border: 'border-yellow-500', text: 'text-yellow-400', badge: 'bg-yellow-500' };
      case 'advanced':
      case 'hard':
        return { bg: 'from-red-600 to-red-700', border: 'border-red-500', text: 'text-red-400', badge: 'bg-red-500' };
      default:
        return { bg: 'from-cyan-600 to-cyan-700', border: 'border-cyan-500', text: 'text-cyan-400', badge: 'bg-cyan-500' };
    }
  };

  const getLabStatus = (labId, index) => {
    const labProgress = progress[labId];
    if (labProgress?.completed) return 'completed';
    if (labProgress) return 'in-progress';
    if (index === 0) return 'available';
    const prevLab = labs[index - 1];
    if (prevLab && progress[prevLab.id]?.completed) return 'available';
    return 'available'; // Make all labs available for now
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-emerald-400" />;
      case 'in-progress':
        return <Play className="w-6 h-6 text-yellow-400" />;
      case 'available':
        return <Play className="w-6 h-6 text-white" />;
      default:
        return <Lock className="w-6 h-6 text-gray-500" />;
    }
  };

  const handleContentClick = (content) => {
    if (content.content_type === 'lab_link' && content.linked_lab_id) {
      navigate(`/lab/${content.linked_lab_id}`);
    } else if (content.file_url) {
      window.open(`${API_URL.replace('/api', '')}${content.file_url}`, '_blank');
    }
  };

  // Group labs by category for the branching tree
  const groupedLabs = labs.reduce((acc, lab) => {
    const category = lab.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(lab);
    return acc;
  }, {});

  const careerPaths = Object.keys(groupedLabs);

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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/courses" className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </Link>
        </div>

        {/* Tree Structure Container */}
        <div className="flex flex-col items-center">
          
          {/* ROOT NODE - Course Title */}
          <div className="relative">
            <div className="bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-500 rounded-2xl px-8 py-6 max-w-md text-center shadow-2xl">
              <h1 className="text-xl font-bold text-white mb-2">{course?.title || 'Course'}</h1>
              <p className="text-sm text-gray-400">
                {course?.description || 'Acquire the skills required to master this domain.'}
              </p>
            </div>
            {/* Vertical Line Down */}
            {(modules.length > 0 || labs.length > 0) && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0.5 h-16 bg-slate-600"></div>
            )}
          </div>

          {/* MODULES SECTION - Vertical Flow */}
          {modules.length > 0 && modules.map((module, moduleIndex) => (
            <div key={module.id} className="relative flex flex-col items-center">
              {/* Module Header Node */}
              <div className="relative mt-16">
                <div className="bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-500 rounded-2xl px-8 py-5 max-w-lg text-center shadow-2xl">
                  <h2 className="text-lg font-bold text-white mb-1">{module.title}</h2>
                  {module.description && (
                    <p className="text-sm text-gray-400">{module.description}</p>
                  )}
                </div>
                {/* Vertical Line Down to content */}
                {module.contents && module.contents.length > 0 && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0.5 h-8 bg-slate-600"></div>
                )}
              </div>

              {/* Module Contents - Each as a node */}
              {module.contents && module.contents.map((content, contentIndex) => {
                const isClickable = content.content_type === 'lab_link' || content.file_url;
                const colors = getDifficultyColor('easy');
                
                return (
                  <div key={content.id} className="relative mt-8">
                    {/* Content Card */}
                    <div
                      onClick={() => isClickable && handleContentClick(content)}
                      className={`bg-gradient-to-r ${colors.bg} border ${colors.border} rounded-xl px-6 py-4 max-w-sm shadow-lg flex items-center gap-4 ${
                        isClickable ? 'cursor-pointer hover:scale-105 transition-transform' : ''
                      }`}
                    >
                      <div className="w-12 h-12 bg-black/20 rounded-lg flex items-center justify-center">
                        {getContentIcon(content.content_type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm">{content.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${colors.badge} text-white`}>
                            {content.content_type === 'lab_link' ? 'Lab' : content.content_type}
                          </span>
                          {content.estimated_duration > 0 && (
                            <span className="text-xs text-gray-300">{content.estimated_duration} min</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Vertical Line Down */}
                    {(contentIndex < module.contents.length - 1 || moduleIndex < modules.length - 1 || labs.length > 0) && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0.5 h-8 bg-slate-600"></div>
                    )}
                  </div>
                );
              })}

              {/* Connector to next module or labs */}
              {moduleIndex < modules.length - 1 && (!module.contents || module.contents.length === 0) && (
                <div className="w-0.5 h-16 bg-slate-600 mt-0"></div>
              )}
            </div>
          ))}

          {/* CAREER SKILLS / LABS SECTION */}
          {labs.length > 0 && (
            <>
              {/* Career Skills Header */}
              <div className="relative mt-16">
                <div className="bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-500 rounded-2xl px-8 py-6 max-w-lg text-center shadow-2xl">
                  <h2 className="text-xl font-bold text-white mb-2">Hands-On Labs</h2>
                  <p className="text-sm text-gray-400">
                    Master the specific skills necessary for your career of interest.
                  </p>
                </div>
                {/* Vertical Line Down */}
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0.5 h-16 bg-slate-600"></div>
              </div>

              {/* Horizontal Branch Line */}
              {careerPaths.length > 1 && (
                <div className="relative mt-16 w-full max-w-5xl">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-slate-600"></div>
                </div>
              )}

              {/* Career Paths Grid */}
              <div className={`mt-16 grid gap-8 w-full max-w-6xl ${
                careerPaths.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
                careerPaths.length === 2 ? 'grid-cols-2' : 
                careerPaths.length === 3 ? 'grid-cols-3' : 'grid-cols-3'
              }`}>
                {careerPaths.map((path, pathIndex) => (
                  <div key={path} className="relative flex flex-col items-center">
                    {/* Vertical connector from horizontal line */}
                    {careerPaths.length > 1 && (
                      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-0.5 h-16 bg-slate-600"></div>
                    )}

                    {/* Career Path Header */}
                    <div className="bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 rounded-xl px-6 py-4 w-full max-w-xs text-center shadow-lg mb-6">
                      <h3 className="text-lg font-bold text-white mb-1">{path}</h3>
                      <p className="text-xs text-gray-400">
                        Level up your skills in {path.toLowerCase()}.
                      </p>
                    </div>

                    {/* Labs in this path */}
                    <div className="space-y-4 w-full">
                      {groupedLabs[path].map((lab, labIndex) => {
                        const status = getLabStatus(lab.id, labIndex);
                        const colors = getDifficultyColor(lab.difficulty);
                        const isClickable = status !== 'locked';
                        const labProgress = progress[lab.id];

                        return (
                          <div key={lab.id} className="relative">
                            {/* Connector line between labs */}
                            {labIndex > 0 && (
                              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-slate-700"></div>
                            )}

                            <div
                              className={`bg-gradient-to-r ${colors.bg} border ${colors.border} rounded-xl p-4 transition-all hover:shadow-xl ${
                                isClickable ? 'cursor-pointer hover:scale-[1.02]' : 'opacity-60 cursor-not-allowed'
                              }`}
                              onClick={() => isClickable && navigate(`/lab/${lab.id}`)}
                            >
                              <div className="flex items-center gap-3">
                                {/* Status Icon */}
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  status === 'completed' ? 'bg-emerald-500/30' :
                                  status === 'in-progress' ? 'bg-yellow-500/30' :
                                  'bg-black/20'
                                }`}>
                                  {getStatusIcon(status)}
                                </div>

                                {/* Lab Info */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-white text-sm mb-1">{lab.title}</h4>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`px-2 py-0.5 text-xs rounded ${colors.badge} text-white`}>
                                      {lab.difficulty}
                                    </span>
                                    <span className="px-2 py-0.5 text-xs rounded bg-cyan-500/80 text-white">
                                      Path
                                    </span>
                                    {lab.duration && (
                                      <span className="text-xs text-gray-200">{lab.duration}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* WHAT'S NEXT SECTION */}
          <div className="relative mt-20">
            {/* Vertical Line Up */}
            {(modules.length > 0 || labs.length > 0) && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0.5 h-16 bg-slate-600"></div>
            )}

            <div className="bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-500 rounded-2xl px-8 py-8 max-w-lg text-center shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-3">What's next?</h2>
              <p className="text-gray-400 mb-6">
                Explore more courses and labs to continue your learning journey!
              </p>
              <Link
                to="/labs"
                className="inline-block bg-slate-600 hover:bg-slate-500 text-white px-8 py-3 rounded-lg transition-colors font-semibold"
              >
                Explore more
              </Link>
            </div>
          </div>

          {/* EMPTY STATE */}
          {modules.length === 0 && labs.length === 0 && (
            <div className="mt-16 text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700 max-w-md mx-auto">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-400 mb-2">No content available for this course yet</p>
              <p className="text-gray-500 text-sm">Content will appear once the admin adds modules and labs</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
