import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';
import Layout from '../components/Layout';
import { BookOpen, Clock, Users, ChevronRight, Check, Play } from 'lucide-react';
import Pagination from '../components/Pagination';

export default function Courses() {
  const { token } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [coursesRes, enrolledRes] = await Promise.all([
        axios.get(`${API_URL}/courses/`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/courses/enrolled/list`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setCourses(coursesRes.data);
      setEnrolled(enrolledRes.data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      await axios.post(
        `${API_URL}/courses/enroll`,
        { course_id: courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to enroll');
    }
  };

  const isEnrolled = (courseId) => {
    return enrolled.some(e => e.course_id === courseId);
  };

  const getProgress = (courseId) => {
    const enrollment = enrolled.find(e => e.course_id === courseId);
    return enrollment?.progress || 0;
  };

  // Sort courses: enrolled first, then non-enrolled
  const sortedCourses = [...courses].sort((a, b) => {
    const aEnrolled = isEnrolled(a.id);
    const bEnrolled = isEnrolled(b.id);
    if (aEnrolled && !bEnrolled) return -1;
    if (!aEnrolled && bEnrolled) return 1;
    return 0;
  });

  const filteredCourses = filter === 'all'
    ? sortedCourses
    : filter === 'enrolled'
    ? sortedCourses.filter(c => isEnrolled(c.id))
    : sortedCourses.filter(c => c.category === filter);

  const categories = [...new Set(courses.map(c => c.category))];

  // Pagination
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const paginatedCourses = filteredCourses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filter changes
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Courses</h1>
            <p className="text-gray-400">Explore cybersecurity courses tailored to your interests</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange('all')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === 'all'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Courses
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => handleFilterChange(cat)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === cat
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedCourses.map(course => (
            <div
              key={course.id}
              className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors"
            >
              <div className="h-32 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-emerald-400" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2 py-0.5 text-xs rounded ${
                    course.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                    course.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {course.difficulty}
                  </span>
                  <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded">
                    {course.category}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">{course.title}</h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{course.description}</p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {course.duration}
                  </span>
                  <span>Semester {course.semester_level}</span>
                </div>

                {isEnrolled(course.id) ? (
                  <div className="space-y-3">
                    <span className="flex items-center gap-1 text-emerald-400 text-sm">
                      <Check className="w-4 h-4" />
                      Enrolled
                    </span>
                    <div className="space-y-2">
                      <Link
                        to={`/course/${course.id}/learn`}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all text-sm font-semibold shadow-lg"
                      >
                        <Play className="w-4 h-4" />
                        {getProgress(course.id) > 0 ? 'Continue' : 'Start Course'}
                      </Link>
                      <div className="flex gap-2">
                        <Link
                          to={`/course/${course.id}/labs`}
                          className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
                        >
                          View Labs
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{getProgress(course.id).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all"
                          style={{ width: `${getProgress(course.id)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEnroll(course.id)}
                    className="w-full py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm"
                  >
                    Enroll Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No courses found</p>
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
