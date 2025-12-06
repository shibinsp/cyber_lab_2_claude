import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';
import Layout from '../components/Layout';
import {
  BookOpen,
  GitBranch,
  FileText,
  Network,
  Play,
  CheckCircle,
  Lock,
  Search,
  Filter,
  Terminal,
  Shield,
  Target,
  Globe,
  Cpu,
  Zap
} from 'lucide-react';

export default function Learn() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'roadmap';
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState([]);
  const [labs, setLabs] = useState([]);
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Use public endpoints if not authenticated, authenticated endpoints if logged in
      const coursesEndpoint = token ? `${API_URL}/courses/` : `${API_URL}/courses/public`;
      const labsEndpoint = token ? `${API_URL}/labs/` : `${API_URL}/labs/public`;
      
      // Fetch courses and labs
      const promises = [
        axios.get(coursesEndpoint, { headers }).catch(() => ({ data: [] })),
        axios.get(labsEndpoint, { headers }).catch(() => ({ data: [] }))
      ];
      
      // Only fetch progress if user is authenticated
      if (token) {
        promises.push(
          axios.get(`${API_URL}/users/progress`, { headers }).catch(() => ({ data: [] }))
        );
      } else {
        promises.push(Promise.resolve({ data: [] }));
      }

      const [coursesRes, labsRes, progressRes] = await Promise.all(promises);

      setCourses(coursesRes.data || []);
      setLabs(labsRes.data || []);
      
      // Group labs by category to create paths
      const pathsMap = {};
      (labsRes.data || []).forEach(lab => {
        const category = lab.category || 'General';
        if (!pathsMap[category]) {
          pathsMap[category] = {
            name: category,
            labs: [],
            difficulty: lab.difficulty,
            icon: getCategoryIcon(category)
          };
        }
        pathsMap[category].labs.push(lab);
      });
      setPaths(Object.values(pathsMap));

      const progressMap = {};
      (progressRes.data || []).forEach(p => {
        progressMap[p.lab_id] = p;
      });
      setProgress(progressMap);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Set empty arrays on error
      setCourses([]);
      setLabs([]);
      setPaths([]);
      setProgress({});
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Linux Fundamentals': Terminal,
      'Network Security': Network,
      'Web Security': Globe,
      'Penetration Testing': Target,
      'Digital Forensics': Cpu,
      'Cryptography': Shield,
      'General': BookOpen
    };
    return icons[category] || BookOpen;
  };

  const getCategoryIconForPath = (category) => {
    return getCategoryIcon(category);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
      case 'easy':
      case 'basic':
        return { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-400', badge: 'bg-emerald-500' };
      case 'intermediate':
      case 'medium':
        return { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400', badge: 'bg-yellow-500' };
      case 'advanced':
      case 'hard':
        return { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', badge: 'bg-red-500' };
      default:
        return { bg: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-400', badge: 'bg-cyan-500' };
    }
  };

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  // Check if user is authenticated to decide whether to use Layout
  const isAuthenticated = !!token;
  const Wrapper = isAuthenticated ? Layout : ({ children }) => (
    <div className="min-h-screen bg-gray-900">
      {/* Public Header */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-white">
              <Shield className="w-6 h-6 text-emerald-400" />
              <span className="font-bold">Cyyberlabs</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );

  if (loading) {
    return (
      <Wrapper>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="min-h-screen bg-gray-900">
        {/* Header Section */}
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">Learn</h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Learn cyber security the fun way - free, interactive, and browser-based. 
                Hack machines, investigate attacks, and build real world skills through guided, immersive learning for all skill levels.
              </p>
              <div className="flex items-center justify-center gap-6 mt-6 text-gray-300">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  <span>{labs.length > 0 ? `${labs.length}+` : '50+'} Hands-on Labs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span>{courses.length > 0 ? `${courses.length}+` : '20+'} Security Courses</span>
                </div>
              </div>
              {!isAuthenticated && (
                <div className="mt-6 text-center">
                  <p className="text-gray-400 text-sm mb-3">Sign in to see your personalized learning path and track progress</p>
                  <Link to="/register" className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg transition-colors text-sm font-semibold">
                    Get Started Free
                  </Link>
                </div>
              )}
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center justify-center border-b border-slate-700">
              <div className="flex gap-1">
                {[
                  { id: 'roadmap', label: 'Roadmap', icon: GitBranch },
                  { id: 'paths', label: 'Paths', icon: BookOpen },
                  { id: 'modules', label: 'Modules', icon: FileText },
                  { id: 'walkthroughs', label: 'Walkthroughs', icon: Play },
                  { id: 'networks', label: 'Networks', icon: Network }
                ].map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
                        activeTab === tab.id
                          ? 'text-emerald-400 border-emerald-400'
                          : 'text-gray-400 border-transparent hover:text-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'roadmap' && <RoadmapTab courses={courses} labs={labs} progress={progress} navigate={navigate} getDifficultyColor={getDifficultyColor} isAuthenticated={isAuthenticated} />}
          {activeTab === 'paths' && <PathsTab paths={paths} progress={progress} navigate={navigate} getDifficultyColor={getDifficultyColor} isAuthenticated={isAuthenticated} />}
          {activeTab === 'modules' && <ModulesTab courses={courses} navigate={navigate} isAuthenticated={isAuthenticated} />}
          {activeTab === 'walkthroughs' && <WalkthroughsTab labs={labs} progress={progress} navigate={navigate} isAuthenticated={isAuthenticated} />}
          {activeTab === 'networks' && <NetworksTab />}
        </div>
      </div>
    </Wrapper>
  );
}

// Helper function for category icons
const getCategoryIconHelper = (category) => {
  const icons = {
    'Linux Fundamentals': Terminal,
    'Network Security': Network,
    'Web Security': Globe,
    'Penetration Testing': Target,
    'Digital Forensics': Cpu,
    'Cryptography': Shield,
    'General': BookOpen
  };
  return icons[category] || BookOpen;
};

// Roadmap Tab Component
function RoadmapTab({ courses, labs, progress, navigate, getDifficultyColor, isAuthenticated }) {
  // Map labs to career paths based on categories
  const mapLabsToCareerPaths = () => {
    const securityAnalystLabs = labs.filter(lab => {
      const category = lab.category || '';
      return category.includes('Incident Response') || 
             category.includes('Network Security') ||
             lab.title.toLowerCase().includes('soc') ||
             lab.title.toLowerCase().includes('security analyst') ||
             lab.title.toLowerCase().includes('forensics') ||
             lab.title.toLowerCase().includes('log');
    });

    const penetrationTesterLabs = labs.filter(lab => {
      const category = lab.category || '';
      return category.includes('Penetration Testing') || 
             category.includes('Web Security') ||
             lab.title.toLowerCase().includes('penetration') ||
             lab.title.toLowerCase().includes('metasploit') ||
             lab.title.toLowerCase().includes('xss') ||
             lab.title.toLowerCase().includes('sql') ||
             lab.title.toLowerCase().includes('reverse shell') ||
             lab.title.toLowerCase().includes('red team');
    });

    const securityEngineerLabs = labs.filter(lab => {
      const category = lab.category || '';
      return category.includes('Linux Fundamentals') || 
             category.includes('Network Security') ||
             lab.title.toLowerCase().includes('firewall') ||
             lab.title.toLowerCase().includes('privilege') ||
             lab.title.toLowerCase().includes('linux') ||
             lab.title.toLowerCase().includes('system');
    });

    return {
      securityAnalyst: securityAnalystLabs.slice(0, 4), // Limit to 4 labs per path
      penetrationTester: penetrationTesterLabs.slice(0, 6),
      securityEngineer: securityEngineerLabs.slice(0, 3)
    };
  };

  const careerPathLabs = mapLabsToCareerPaths();

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Cyber Security Learning Roadmap</h2>
        <p className="text-gray-400">
          From fundamental principles to advanced techniques, this roadmap provides clear steps and essential resources to help you build a robust skill set.
        </p>
      </div>

      <div className="flex flex-col items-center space-y-8">
        {/* Computer Science Basics */}
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-500 rounded-2xl px-8 py-6 max-w-md text-center shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-2">Computer Science Basics</h3>
          <p className="text-sm text-gray-400 mt-2">
            Acquire the basic computer science skills required to get started in cyber security.
          </p>
        </div>

        {/* Vertical Line */}
        <div className="w-0.5 h-16 bg-slate-600"></div>

        {/* Pre Security */}
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-500 rounded-2xl px-8 py-6 max-w-md text-center shadow-2xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">Pre Security</h3>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="px-2 py-1 text-xs rounded bg-emerald-500 text-white">Easy</span>
            <span className="px-2 py-1 text-xs rounded bg-cyan-500 text-white">Path</span>
          </div>
        </div>

        {/* Vertical Line */}
        <div className="w-0.5 h-16 bg-slate-600"></div>

        {/* Cyber Security Foundations */}
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-500 rounded-2xl px-8 py-6 max-w-md text-center shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-2">Cyber Security Foundations</h3>
          <p className="text-sm text-gray-400 mt-2">
            Develop cyber security skills needed to enter any career in the industry.
          </p>
        </div>

        {/* Vertical Line */}
        <div className="w-0.5 h-16 bg-slate-600"></div>

        {/* Cyber Security 101 */}
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-500 rounded-2xl px-8 py-6 max-w-md text-center shadow-2xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">Cyber Security 101</h3>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="px-2 py-1 text-xs rounded bg-emerald-500 text-white">Easy</span>
            <span className="px-2 py-1 text-xs rounded bg-cyan-500 text-white">Path</span>
          </div>
        </div>

        {/* Vertical Line */}
        <div className="w-0.5 h-16 bg-slate-600"></div>

        {/* Career Skills */}
        <div className="bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-500 rounded-2xl px-8 py-6 max-w-md text-center shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-2">Cyber Security Career Skills</h3>
          <p className="text-sm text-gray-400 mt-2">
            Master the specific skills necessary for your career of interest. Not sure which career path is right for you? Take our career quiz to find out.
          </p>
        </div>

        {/* Branching Paths */}
        {/* Horizontal Branch Line */}
        <div className="relative mt-8 w-full max-w-6xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5/6 h-0.5 bg-gradient-to-r from-transparent via-slate-600 to-transparent"></div>
        </div>

        {/* Career Paths Grid - Always show 3 paths */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          {/* Security Analyst Path */}
          <div className="relative flex flex-col items-center">
            {/* Vertical connector */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-slate-600"></div>

            {/* Path Header */}
            <div className="bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 rounded-xl px-6 py-4 w-full max-w-xs text-center shadow-lg mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Security Analyst</h3>
              </div>
              <p className="text-xs text-gray-400">
                Get on the fast track to becoming a successful Security Analyst.
              </p>
            </div>

            {/* Labs in Path */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
              {careerPathLabs.securityAnalyst.map((lab, idx) => {
                const colors = getDifficultyColor(lab.difficulty || 'Basic');
                const labProgress = progress[lab.id];
                const isCompleted = labProgress?.completed;
                const isInProgress = labProgress && !isCompleted;

                return (
                  <div key={lab.id} className="relative">
                    {idx > 0 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-slate-600"></div>}
                    <div
                      onClick={() => {
                        if (isAuthenticated) {
                          navigate(`/lab/${lab.id}`);
                        } else {
                          navigate('/login');
                        }
                      }}
                      className={`bg-gradient-to-r ${colors.bg} border ${colors.border} rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform shadow-lg`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          ) : isInProgress ? (
                            <Play className="w-5 h-5 text-yellow-400" />
                          ) : (
                            <Shield className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white text-sm mb-1 truncate">{lab.title}</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs rounded ${colors.badge} text-white`}>
                              {lab.difficulty || 'Basic'}
                            </span>
                            <span className="px-2 py-0.5 text-xs rounded bg-cyan-500 text-white">Path</span>
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

          {/* Penetration Tester Path */}
          <div className="relative flex flex-col items-center">
            {/* Vertical connector */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-slate-600"></div>

            {/* Path Header */}
            <div className="bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 rounded-xl px-6 py-4 w-full max-w-xs text-center shadow-lg mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-bold text-white">Penetration Tester</h3>
              </div>
              <p className="text-xs text-gray-400">
                Level up and forge your path to victory as a Penetration Tester.
              </p>
            </div>

            {/* Labs in Path */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
              {careerPathLabs.penetrationTester.map((lab, idx) => {
                const colors = getDifficultyColor(lab.difficulty || 'Basic');
                const labProgress = progress[lab.id];
                const isCompleted = labProgress?.completed;
                const isInProgress = labProgress && !isCompleted;

                return (
                  <div key={lab.id} className="relative">
                    {idx > 0 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-slate-600"></div>}
                    <div
                      onClick={() => {
                        if (isAuthenticated) {
                          navigate(`/lab/${lab.id}`);
                        } else {
                          navigate('/login');
                        }
                      }}
                      className={`bg-gradient-to-r ${colors.bg} border ${colors.border} rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform shadow-lg`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          ) : isInProgress ? (
                            <Play className="w-5 h-5 text-yellow-400" />
                          ) : (
                            <Target className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white text-sm mb-1 truncate">{lab.title}</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs rounded ${colors.badge} text-white`}>
                              {lab.difficulty || 'Basic'}
                            </span>
                            <span className="px-2 py-0.5 text-xs rounded bg-cyan-500 text-white">Path</span>
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

          {/* Security Engineer Path */}
          <div className="relative flex flex-col items-center">
            {/* Vertical connector */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-slate-600"></div>

            {/* Path Header */}
            <div className="bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 rounded-xl px-6 py-4 w-full max-w-xs text-center shadow-lg mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Cpu className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-bold text-white">Security Engineer</h3>
              </div>
              <p className="text-xs text-gray-400">
                Navigate your journey to becoming a world-class Security Engineer.
              </p>
            </div>

            {/* Labs in Path */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
              {careerPathLabs.securityEngineer.map((lab, idx) => {
                const colors = getDifficultyColor(lab.difficulty || 'Basic');
                const labProgress = progress[lab.id];
                const isCompleted = labProgress?.completed;
                const isInProgress = labProgress && !isCompleted;

                return (
                  <div key={lab.id} className="relative">
                    {idx > 0 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-slate-600"></div>}
                    <div
                      onClick={() => {
                        if (isAuthenticated) {
                          navigate(`/lab/${lab.id}`);
                        } else {
                          navigate('/login');
                        }
                      }}
                      className={`bg-gradient-to-r ${colors.bg} border ${colors.border} rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform shadow-lg`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                          ) : isInProgress ? (
                            <Play className="w-5 h-5 text-yellow-400" />
                          ) : (
                            <Cpu className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-white text-sm mb-1 truncate">{lab.title}</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs rounded ${colors.badge} text-white`}>
                              {lab.difficulty || 'Basic'}
                            </span>
                            <span className="px-2 py-0.5 text-xs rounded bg-cyan-500 text-white">Path</span>
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
        </div>

        {/* What's Next Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 rounded-xl px-8 py-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-2">What's next?</h3>
            <p className="text-gray-400 mb-4">
              Explore over 1.1K walkthroughs and challenge rooms, with new content added every week!
            </p>
            <button
              onClick={() => {
                if (isAuthenticated) {
                  navigate('/labs');
                } else {
                  navigate('/login');
                }
              }}
              className="bg-slate-800 border-2 border-slate-600 hover:border-emerald-500 text-white px-6 py-2 rounded-lg transition-colors font-semibold"
            >
              Explore more
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Paths Tab Component
function PathsTab({ paths, progress, navigate, getDifficultyColor, isAuthenticated }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  const filteredPaths = paths.filter(path => {
    const matchesSearch = path.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = !difficultyFilter || path.difficulty?.toLowerCase() === difficultyFilter.toLowerCase();
    return matchesSearch && matchesDifficulty;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Cyber Security Learning Paths</h2>
          <p className="text-gray-400">Learn about cyber security and sharpen your skills by following a structured learning path.</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search learning paths..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Difficulties</option>
          <option value="basic">Basic</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Paths Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredPaths.map((path, index) => {
          const colors = getDifficultyColor(path.difficulty);
          const Icon = path.icon;
          const completedLabs = path.labs.filter(lab => progress[lab.id]?.completed).length;
          const totalLabs = path.labs.length;
          const progressPercent = totalLabs > 0 ? (completedLabs / totalLabs) * 100 : 0;

          return (
            <div
              key={index}
              onClick={() => {
                if (isAuthenticated) {
                  navigate(`/learn?tab=roadmap`);
                } else {
                  navigate('/login');
                }
              }}
              className="bg-slate-800 border border-slate-700 rounded-lg p-6 cursor-pointer hover:border-emerald-500 transition-all hover:shadow-lg"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colors.bg}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-sm">{path.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${colors.badge}`}></div>
                      <span className="text-xs text-gray-400">{path.difficulty || 'Basic'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                Master {path.name.toLowerCase()} through hands-on labs and practical exercises.
              </p>
              {totalLabs > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{completedLabs}/{totalLabs} Labs</span>
                    <span className="text-emerald-400">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Modules Tab Component
function ModulesTab({ courses, navigate, isAuthenticated }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Learning Modules</h2>
        <p className="text-gray-400">Structured course modules to guide your learning journey.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => (
          <div
            key={course.id}
            onClick={() => {
              if (isAuthenticated) {
                navigate(`/course/${course.id}/learn`);
              } else {
                navigate('/login');
              }
            }}
            className="bg-slate-800 border border-slate-700 rounded-lg p-6 cursor-pointer hover:border-emerald-500 transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-8 h-8 text-emerald-400" />
              <div>
                <h3 className="font-bold text-white">{course.title}</h3>
                <p className="text-xs text-gray-400">{course.category}</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.description}</p>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded ${
                course.difficulty === 'Beginner' ? 'bg-emerald-500' :
                course.difficulty === 'Intermediate' ? 'bg-yellow-500' :
                'bg-red-500'
              } text-white`}>
                {course.difficulty}
              </span>
              {course.duration && (
                <span className="text-xs text-gray-400">{course.duration}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Walkthroughs Tab Component
function WalkthroughsTab({ labs, progress, navigate, isAuthenticated }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Lab Walkthroughs</h2>
        <p className="text-gray-400">Step-by-step guides for completing hands-on labs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {labs.map(lab => {
          const isCompleted = progress[lab.id]?.completed;
          const isInProgress = progress[lab.id] && !isCompleted;

          return (
            <div
              key={lab.id}
              onClick={() => {
                if (isAuthenticated) {
                  navigate(`/lab/${lab.id}`);
                } else {
                  navigate('/login');
                }
              }}
              className="bg-slate-800 border border-slate-700 rounded-lg p-6 cursor-pointer hover:border-emerald-500 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                {isCompleted ? (
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                ) : isInProgress ? (
                  <Play className="w-8 h-8 text-yellow-400" />
                ) : (
                  <Terminal className="w-8 h-8 text-gray-400" />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-white">{lab.title}</h3>
                  <p className="text-xs text-gray-400">{lab.category}</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{lab.description}</p>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded ${
                  lab.difficulty === 'Basic' ? 'bg-emerald-500' :
                  lab.difficulty === 'Intermediate' ? 'bg-yellow-500' :
                  'bg-red-500'
                } text-white`}>
                  {lab.difficulty}
                </span>
                {lab.duration && (
                  <span className="text-xs text-gray-400">{lab.duration}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Networks Tab Component
function NetworksTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Practice Networks</h2>
        <p className="text-gray-400">Access virtual networks and practice environments.</p>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
        <Network className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400 mb-2">Network environments coming soon!</p>
        <p className="text-gray-500 text-sm">Practice in isolated network environments with multiple machines.</p>
      </div>
    </div>
  );
}



