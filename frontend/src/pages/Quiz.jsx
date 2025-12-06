import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';
import Layout from '../components/Layout';
import { ClipboardCheck, ChevronRight, ChevronLeft, CheckCircle, Plus, Clock, Trophy } from 'lucide-react';

export default function Quiz() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [currentAttempt, setCurrentAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      const res = await axios.get(`${API_URL}/quiz/assessment`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttempts(res.data.attempts || []);
    } catch (error) {
      console.error('Failed to fetch attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewAttempt = async () => {
    setCreating(true);
    try {
      const res = await axios.post(
        `${API_URL}/quiz/assessment/create`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Load the new attempt
      const attemptRes = await axios.get(
        `${API_URL}/quiz/assessment/${res.data.attempt_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCurrentAttempt(attemptRes.data);
      setQuestions(attemptRes.data.questions || []);
      setAnswers({});
      setCurrentIndex(0);
      setResults(null);
    } catch (error) {
      console.error('Failed to create attempt:', error);
      alert('Failed to create new quiz. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const loadAttempt = async (attemptId) => {
    try {
      const res = await axios.get(
        `${API_URL}/quiz/assessment/${attemptId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCurrentAttempt(res.data);
      setQuestions(res.data.questions || []);
      setAnswers(res.data.answers || {});
      setCurrentIndex(0);
      setResults(res.data.is_completed ? {
        results: Object.entries(res.data.category_scores || {}).map(([category, scores]) => ({
          category,
          score: scores.score,
          max_score: scores.max_score,
          percentage: scores.max_score > 0 ? (scores.score / scores.max_score * 100) : 0
        })),
        total_score: res.data.total_score,
        max_score: res.data.max_score,
        overall_percentage: res.data.percentage
      } : null);
    } catch (error) {
      console.error('Failed to load attempt:', error);
    }
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_URL}/quiz/submit-assessment`,
        {
          attempt_id: currentAttempt.id,
          answers: answers,
          questions: questions
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResults({
        results: res.data.results,
        total_score: res.data.total_score,
        max_score: res.data.max_score,
        overall_percentage: res.data.overall_percentage
      });
      
      // Refresh attempts list
      fetchAttempts();
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      alert('Failed to submit quiz');
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

  // Show attempts list if no attempt is selected
  if (!currentAttempt && !creating) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Assessment Quiz</h1>
              <p className="text-gray-400">
                View your quiz attempts or create a new one
              </p>
            </div>
            <button
              onClick={createNewAttempt}
              disabled={creating}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-5 h-5" />
              {creating ? 'Creating...' : 'Create New Quiz'}
            </button>
          </div>

          {attempts.length === 0 ? (
            <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
              <ClipboardCheck className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No quiz attempts yet</p>
              <button
                onClick={createNewAttempt}
                disabled={creating}
                className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                {creating ? 'Creating...' : 'Create Your First Quiz'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {attempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-emerald-500/50 transition-colors cursor-pointer"
                  onClick={() => loadAttempt(attempt.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${
                        attempt.is_completed 
                          ? 'bg-emerald-500/20' 
                          : 'bg-yellow-500/20'
                      }`}>
                        {attempt.is_completed ? (
                          <CheckCircle className={`w-6 h-6 ${
                            attempt.percentage >= 70 ? 'text-emerald-400' :
                            attempt.percentage >= 50 ? 'text-yellow-400' : 'text-red-400'
                          }`} />
                        ) : (
                          <Clock className="w-6 h-6 text-yellow-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Attempt #{attempt.attempt_number}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {new Date(attempt.started_at).toLocaleDateString()} at{' '}
                          {new Date(attempt.started_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {attempt.is_completed ? (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <Trophy className={`w-5 h-5 ${
                              attempt.percentage >= 70 ? 'text-emerald-400' :
                              attempt.percentage >= 50 ? 'text-yellow-400' : 'text-red-400'
                            }`} />
                            <span className={`text-xl font-bold ${
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
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // Show quiz taking interface
  if (results) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Assessment Complete!</h1>
            <p className="text-gray-400 mb-2">
              Attempt #{currentAttempt.attempt_number}
            </p>
            <p className="text-gray-400 mb-6">Here's how you performed in each category</p>

            <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Overall Score</p>
              <p className="text-3xl font-bold text-white">
                {results.total_score}/{results.max_score}
              </p>
              <p className={`text-xl font-semibold mt-1 ${
                results.overall_percentage >= 70 ? 'text-emerald-400' :
                results.overall_percentage >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {Math.round(results.overall_percentage)}%
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {results.results.map((result, index) => (
                <div key={index} className="bg-gray-700/50 rounded-lg p-4 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{result.category}</span>
                    <span className={`font-bold ${
                      result.percentage >= 70 ? 'text-emerald-400' :
                      result.percentage >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {Math.round(result.percentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        result.percentage >= 70 ? 'bg-emerald-500' :
                        result.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${result.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {result.score}/{result.max_score} points
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setCurrentAttempt(null);
                  setResults(null);
                  fetchAttempts();
                }}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Back to Attempts
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                View Recommended Courses
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (questions.length === 0) {
    return (
      <Layout>
        <div className="text-center py-12">
          <ClipboardCheck className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Loading quiz questions...</p>
        </div>
      </Layout>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Skills Assessment Quiz</h1>
            <p className="text-gray-400">
              Attempt #{currentAttempt.attempt_number} • Answer these questions to help us recommend the best courses for you
            </p>
          </div>
          <button
            onClick={() => {
              setCurrentAttempt(null);
              setResults(null);
              fetchAttempts();
            }}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Back
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <div className="mb-4">
            <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded">
              {currentQuestion.category}
            </span>
          </div>

          <h2 className="text-lg text-white mb-6">{currentQuestion.question}</h2>

          <div className="space-y-3">
            {['a', 'b', 'c', 'd'].map(option => (
              <button
                key={option}
                onClick={() => handleAnswer(currentQuestion.id, option)}
                className={`w-full p-4 rounded-lg border text-left transition-colors ${
                  answers[currentQuestion.id] === option
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-gray-600 hover:border-gray-500 text-gray-300'
                }`}
              >
                <span className="font-semibold mr-3">{option.toUpperCase()}.</span>
                {currentQuestion[`option_${option}`]}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex(prev => prev - 1)}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length < questions.length}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(prev => prev + 1)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-400 text-white rounded-lg hover:bg-emerald-500"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Question Navigator */}
        <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-400 mb-3">Question Navigator</p>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(index)}
                className={`w-8 h-8 rounded text-sm ${
                  index === currentIndex
                    ? 'bg-emerald-500 text-white'
                    : answers[q.id]
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
