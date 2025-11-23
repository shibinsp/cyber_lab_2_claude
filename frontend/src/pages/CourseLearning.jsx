import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';
import Layout from '../components/Layout';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft, ArrowRight, Check, Clock, BookOpen,
  ClipboardList, AlertCircle, Trophy, XCircle
} from 'lucide-react';

export default function CourseLearning() {
  const { courseId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [content, setContent] = useState(null);
  const [progress, setProgress] = useState(null);
  const [currentModule, setCurrentModule] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const [contentRes, progressRes] = await Promise.all([
        axios.get(`${API_URL}/courses/${courseId}/content`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/courses/${courseId}/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setContent(contentRes.data);
      setProgress(progressRes.data);

      // Set current module based on progress
      if (progressRes.data.current_module > 0) {
        const moduleIndex = contentRes.data.modules.findIndex(
          m => m.id === progressRes.data.current_module
        );
        if (moduleIndex >= 0) {
          setCurrentModule(moduleIndex);
        }
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
      if (error.response?.status === 403) {
        navigate('/courses');
      }
    } finally {
      setLoading(false);
    }
  };

  const markModuleComplete = async (moduleId) => {
    try {
      const res = await axios.post(
        `${API_URL}/courses/${courseId}/progress?module_id=${moduleId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProgress(prev => ({
        ...prev,
        completed_modules: res.data.completed_modules,
        current_module: moduleId
      }));
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleMarkComplete = async () => {
    const module = content.modules[currentModule];
    await markModuleComplete(module.id);
  };

  const goToModule = (index) => {
    setCurrentModule(index);
    setShowAssessment(false);
    const module = content.modules[index];
    markModuleComplete(module.id);
  };

  const goNext = () => {
    if (currentModule < content.modules.length - 1) {
      goToModule(currentModule + 1);
    } else {
      // Show assessment
      loadAssessment();
    }
  };

  const goPrevious = () => {
    if (currentModule > 0) {
      goToModule(currentModule - 1);
    }
  };

  const loadAssessment = async () => {
    // Only fetch if no assessment loaded yet
    if (!assessment) {
      try {
        const res = await axios.get(`${API_URL}/courses/${courseId}/assessment`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAssessment(res.data);
        // Load draft answers if any
        if (res.data.draft_answers && Object.keys(res.data.draft_answers).length > 0) {
          setAnswers(res.data.draft_answers);
        }
      } catch (error) {
        console.error('Failed to load assessment:', error);
      }
    }
    setShowAssessment(true);
    setAssessmentResult(null);
  };

  const regenerateAssessment = async () => {
    try {
      const res = await axios.post(`${API_URL}/courses/${courseId}/assessment/regenerate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssessment(res.data);
      setAnswers({});
      setAssessmentResult(null);
    } catch (error) {
      console.error('Failed to regenerate assessment:', error);
    }
  };

  const saveDraftAnswer = async (questionId, optionIndex) => {
    const newAnswers = { ...answers, [questionId]: optionIndex };
    setAnswers(newAnswers);

    // Auto-save draft to backend
    try {
      await axios.post(`${API_URL}/courses/${courseId}/assessment/draft`, newAnswers, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const submitAssessment = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_URL}/courses/${courseId}/assessment`,
        answers,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssessmentResult(res.data);

      // Refresh progress
      const progressRes = await axios.get(`${API_URL}/courses/${courseId}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProgress(progressRes.data);
    } catch (error) {
      if (error.response?.status === 429) {
        alert(error.response.data.detail);
      } else {
        console.error('Failed to submit assessment:', error);
      }
    } finally {
      setSubmitting(false);
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

  if (!content) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-400">Course content not found</p>
          <Link to="/courses" className="text-emerald-400 hover:text-emerald-300 mt-4 inline-block">
            Back to Courses
          </Link>
        </div>
      </Layout>
    );
  }

  const currentModuleData = content.modules[currentModule];
  const isModuleCompleted = (moduleId) => progress?.completed_modules?.includes(moduleId);
  const allModulesCompleted = content.modules.every(m => isModuleCompleted(m.id));

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Sidebar - Module List */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
            <div className="mb-4">
              <Link to="/courses" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-3">
                <ArrowLeft className="w-4 h-4" />
                Back to Courses
              </Link>
              <h2 className="text-lg font-bold text-white">{content.title}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                <Clock className="w-4 h-4" />
                {content.duration}
              </div>
            </div>

            <div className="space-y-2">
              {content.modules.map((module, index) => (
                <button
                  key={module.id}
                  onClick={() => goToModule(index)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentModule === index && !showAssessment
                      ? 'bg-emerald-500/20 border border-emerald-500/50'
                      : 'bg-gray-700/50 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      isModuleCompleted(module.id)
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-600 text-gray-300'
                    }`}>
                      {isModuleCompleted(module.id) ? <Check className="w-3 h-3" /> : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        currentModule === index && !showAssessment ? 'text-emerald-400' : 'text-white'
                      }`}>
                        {module.title}
                      </p>
                      <p className="text-xs text-gray-400">{module.duration}</p>
                    </div>
                  </div>
                </button>
              ))}

              {/* Assessment Button */}
              <button
                onClick={loadAssessment}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  showAssessment
                    ? 'bg-purple-500/20 border border-purple-500/50'
                    : 'bg-gray-700/50 hover:bg-gray-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                    progress?.passed
                      ? 'bg-emerald-500 text-white'
                      : 'bg-purple-500 text-white'
                  }`}>
                    {progress?.passed ? <Trophy className="w-3 h-3" /> : <ClipboardList className="w-3 h-3" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${showAssessment ? 'text-purple-400' : 'text-white'}`}>
                      Final Assessment
                    </p>
                    <p className="text-xs text-gray-400">
                      {progress?.passed
                        ? `Passed (${progress.assessment_score?.toFixed(0)}%)`
                        : `${progress?.assessment_attempts || 0}/3 attempts`
                      }
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            {showAssessment ? (
              /* Assessment View */
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Final Assessment</h2>
                <p className="text-gray-400 mb-6">
                  Pass with {assessment?.passing_score}% or higher. You have {Math.max(0, 3 - (progress?.assessment_attempts || 0))} attempts remaining.
                </p>

                {assessmentResult ? (
                  /* Assessment Results */
                  <div className="space-y-6">
                    <div className={`p-6 rounded-xl ${
                      assessmentResult.passed
                        ? 'bg-emerald-500/20 border border-emerald-500/50'
                        : 'bg-red-500/20 border border-red-500/50'
                    }`}>
                      <div className="flex items-center gap-4">
                        {assessmentResult.passed ? (
                          <Trophy className="w-12 h-12 text-emerald-400" />
                        ) : (
                          <XCircle className="w-12 h-12 text-red-400" />
                        )}
                        <div>
                          <h3 className={`text-2xl font-bold ${
                            assessmentResult.passed ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {assessmentResult.passed ? 'Congratulations!' : 'Not Passed'}
                          </h3>
                          <p className="text-white">
                            Score: {assessmentResult.score.toFixed(0)}% ({assessmentResult.correct}/{assessmentResult.total} correct)
                          </p>
                          {!assessmentResult.passed && assessmentResult.attempts_remaining > 0 && (
                            <p className="text-gray-400 text-sm mt-1">
                              {assessmentResult.attempts_remaining} attempts remaining
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {!assessmentResult.passed && (
                      <button
                        onClick={() => {
                          setAssessmentResult(null);
                          setAnswers({});
                        }}
                        className="w-full py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                      >
                        Try Again
                      </button>
                    )}

                    {assessmentResult.passed && (
                      <Link
                        to="/courses"
                        className="block w-full py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-center"
                      >
                        Back to Courses
                      </Link>
                    )}
                  </div>
                ) : (
                  /* Assessment Questions */
                  <div className="space-y-6">
                    {assessment?.questions.map((q, index) => (
                      <div key={q.id} className="bg-gray-700/50 rounded-lg p-4">
                        <p className="text-white font-medium mb-3">
                          {index + 1}. {q.question}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((option, optIndex) => (
                            <label
                              key={optIndex}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                answers[q.id] === optIndex
                                  ? 'bg-emerald-500/20 border border-emerald-500/50'
                                  : 'bg-gray-600/50 hover:bg-gray-600'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question-${q.id}`}
                                checked={answers[q.id] === optIndex}
                                onChange={() => saveDraftAnswer(q.id, optIndex)}
                                className="w-4 h-4 text-emerald-500"
                              />
                              <span className="text-gray-200">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-3">
                      <button
                        onClick={regenerateAssessment}
                        className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                      >
                        Regenerate Quiz
                      </button>
                      <button
                        onClick={submitAssessment}
                        disabled={submitting || Object.keys(answers).length !== assessment?.questions.length}
                        className="flex-1 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Submitting...' : 'Submit Assessment'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Module Content View */
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-400">
                      Module {currentModule + 1} of {content.modules.length}
                    </p>
                    <h2 className="text-2xl font-bold text-white">{currentModuleData.title}</h2>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    {currentModuleData.duration}
                  </span>
                </div>

                {/* Markdown Content */}
                <div className="prose prose-invert prose-emerald max-w-none mb-8">
                  <ReactMarkdown
                    components={{
                      h2: ({node, ...props}) => <h2 className="text-xl font-bold text-white mt-6 mb-3" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-white mt-4 mb-2" {...props} />,
                      p: ({node, ...props}) => <p className="text-gray-300 mb-3 leading-relaxed" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-inside text-gray-300 mb-3 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="text-gray-300" {...props} />,
                      code: ({node, inline, ...props}) =>
                        inline
                          ? <code className="bg-gray-700 px-1 py-0.5 rounded text-emerald-400 text-sm" {...props} />
                          : <code className="block bg-gray-900 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto" {...props} />,
                      pre: ({node, ...props}) => <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4" {...props} />,
                      table: ({node, ...props}) => <table className="w-full border-collapse mb-4" {...props} />,
                      th: ({node, ...props}) => <th className="border border-gray-600 bg-gray-700 px-3 py-2 text-left text-white" {...props} />,
                      td: ({node, ...props}) => <td className="border border-gray-600 px-3 py-2 text-gray-300" {...props} />,
                      strong: ({node, ...props}) => <strong className="text-white font-semibold" {...props} />,
                    }}
                  >
                    {currentModuleData.content}
                  </ReactMarkdown>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <button
                    onClick={goPrevious}
                    disabled={currentModule === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-3">
                    {!isModuleCompleted(currentModuleData.id) ? (
                      <button
                        onClick={handleMarkComplete}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Mark Complete
                      </button>
                    ) : (
                      <span className="flex items-center gap-2 px-4 py-2 text-emerald-400 text-sm">
                        <Check className="w-4 h-4" />
                        Completed
                      </span>
                    )}

                    <button
                      onClick={goNext}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      {currentModule === content.modules.length - 1 ? 'Take Assessment' : 'Next'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
