import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';
import Layout from '../components/Layout';
import { ClipboardCheck, ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';

export default function Quiz() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    fetchQuiz();
  }, []);

  const fetchQuiz = async () => {
    try {
      const res = await axios.get(`${API_URL}/quiz/assessment`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestions(res.data.questions);
    } catch (error) {
      console.error('Failed to fetch quiz:', error);
    } finally {
      setLoading(false);
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
          answers: answers,
          questions: questions
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResults(res.data.results);
    } catch (error) {
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

  if (results) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Assessment Complete!</h1>
            <p className="text-gray-400 mb-6">Here's how you performed in each category</p>

            <div className="space-y-4 mb-8">
              {results.map((result, index) => (
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

            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              View Recommended Courses
            </button>
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
          <p className="text-gray-400">No assessment quizzes available</p>
        </div>
      </Layout>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Skills Assessment Quiz</h1>
          <p className="text-gray-400">
            Answer these questions to help us recommend the best courses for you
          </p>
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
              className="flex items-center gap-2 px-4 py-2 text-emerald-400 hover:text-emerald-300"
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
