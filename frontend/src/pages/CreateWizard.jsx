import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import Layout from '../components/Layout';
import {
  ArrowLeft, ArrowRight, Check, GraduationCap, Beaker, FileText, 
  Settings, Terminal, Server, Layers, Plus, Trash2, X, Sparkles,
  ClipboardCheck, Loader2, RefreshCw, Eye
} from 'lucide-react';
import './CreateWizard.css';

const CreateWizard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const wizardType = searchParams.get('type') || 'course'; // 'course' or 'lab'
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Course form state
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: 'Network Security',
    difficulty: 'Beginner',
    duration: '',
    semester_level: 1,
    image_url: '',
    is_active: true,
    objectives: [''],
    prerequisites: ['']
  });

  // Assessment form state
  const [assessmentForm, setAssessmentForm] = useState({
    enabled: false,
    title: 'Course Assessment',
    description: '',
    pass_percentage: 70,
    max_attempts: 3,
    topics: [''],
    num_questions: 10,
    difficulty: 'intermediate',
    time_limit: null
  });

  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  // Lab form state
  const [labForm, setLabForm] = useState({
    id: '',
    title: '',
    description: '',
    category: 'Network Security',
    difficulty: 'Basic',
    duration: '',
    semester_level: 1,
    terminal_type: 'vm',
    vm_enabled: true,
    is_active: true,
    objectives: [''],
    tools_required: [''],
    tasks: [{ title: '', description: '', hint: '', command: '' }]
  });

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const courseSteps = [
    { id: 1, title: 'Basic Info', icon: FileText },
    { id: 2, title: 'Details', icon: Settings },
    { id: 3, title: 'Objectives', icon: Layers },
    { id: 4, title: 'Assessment', icon: ClipboardCheck },
    { id: 5, title: 'Review', icon: Check }
  ];

  const labSteps = [
    { id: 1, title: 'Basic Info', icon: FileText },
    { id: 2, title: 'Environment', icon: Terminal },
    { id: 3, title: 'Tasks', icon: Layers },
    { id: 4, title: 'Tools', icon: Settings },
    { id: 5, title: 'Review', icon: Check }
  ];

  const steps = wizardType === 'course' ? courseSteps : labSteps;
  const totalSteps = steps.length;

  const handleNext = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const addArrayItem = (field, defaultValue = '') => {
    if (wizardType === 'course') {
      setCourseForm({ ...courseForm, [field]: [...courseForm[field], defaultValue] });
    } else {
      if (field === 'tasks') {
        setLabForm({ ...labForm, tasks: [...labForm.tasks, { title: '', description: '', hint: '', command: '' }] });
      } else {
        setLabForm({ ...labForm, [field]: [...labForm[field], defaultValue] });
      }
    }
  };

  const removeArrayItem = (field, index) => {
    if (wizardType === 'course') {
      setCourseForm({ ...courseForm, [field]: courseForm[field].filter((_, i) => i !== index) });
    } else {
      setLabForm({ ...labForm, [field]: labForm[field].filter((_, i) => i !== index) });
    }
  };

  const updateArrayItem = (field, index, value) => {
    if (wizardType === 'course') {
      const updated = [...courseForm[field]];
      updated[index] = value;
      setCourseForm({ ...courseForm, [field]: updated });
    } else {
      const updated = [...labForm[field]];
      updated[index] = value;
      setLabForm({ ...labForm, [field]: updated });
    }
  };

  const updateTaskField = (index, field, value) => {
    const updated = [...labForm.tasks];
    updated[index] = { ...updated[index], [field]: value };
    setLabForm({ ...labForm, tasks: updated });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (wizardType === 'course') {
        const payload = {
          ...courseForm,
          objectives: courseForm.objectives.filter(o => o.trim()),
          prerequisites: courseForm.prerequisites.filter(p => p.trim())
        };
        const courseRes = await axios.post(`${API_URL}/admin/courses/`, payload, getAuthHeaders());
        
        // Create assessment if enabled
        if (assessmentForm.enabled) {
          const assessmentPayload = {
            course_id: courseRes.data.id,
            title: assessmentForm.title,
            description: assessmentForm.description,
            pass_percentage: assessmentForm.pass_percentage,
            max_attempts: assessmentForm.max_attempts,
            topics: assessmentForm.topics.filter(t => t.trim()),
            num_questions: assessmentForm.num_questions,
            difficulty: assessmentForm.difficulty,
            time_limit: assessmentForm.time_limit
          };
          await axios.post(`${API_URL}/admin/assessments/`, assessmentPayload, getAuthHeaders());
        }
      } else {
        const payload = {
          ...labForm,
          objectives: labForm.objectives.filter(o => o.trim()),
          tools_required: labForm.tools_required.filter(t => t.trim()),
          tasks: labForm.tasks.filter(t => t.title.trim()).map((t, i) => ({
            ...t,
            order: i + 1
          }))
        };
        await axios.post(`${API_URL}/admin/labs/`, payload, getAuthHeaders());
      }
      navigate('/admin', { state: { success: `${wizardType === 'course' ? 'Course' : 'Lab'} created successfully!` } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate preview questions
  const handlePreviewQuestions = async () => {
    const validTopics = assessmentForm.topics.filter(t => t.trim());
    if (validTopics.length === 0) {
      setError('Please add at least one topic');
      return;
    }
    
    setGeneratingQuestions(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/admin/assessments/generate-preview`, {
        topics: validTopics,
        num_questions: assessmentForm.num_questions,
        difficulty: assessmentForm.difficulty
      }, getAuthHeaders());
      setPreviewQuestions(res.data.questions);
      setShowPreview(true);
    } catch (err) {
      setError('Failed to generate questions. Please try again.');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  // Assessment topic management
  const addTopic = () => {
    setAssessmentForm({ ...assessmentForm, topics: [...assessmentForm.topics, ''] });
  };

  const removeTopic = (index) => {
    setAssessmentForm({ 
      ...assessmentForm, 
      topics: assessmentForm.topics.filter((_, i) => i !== index) 
    });
  };

  const updateTopic = (index, value) => {
    const updated = [...assessmentForm.topics];
    updated[index] = value;
    setAssessmentForm({ ...assessmentForm, topics: updated });
  };

  const categories = [
    'Network Security', 'Web Security', 'Cryptography', 'Forensics',
    'Malware Analysis', 'Penetration Testing', 'Cloud Security', 'General'
  ];


  // Course Step Renderers
  const renderCourseStep1 = () => (
    <div className="wizard-step-content">
      <h2 className="step-title">
        <GraduationCap className="w-6 h-6" />
        Let's create your course
      </h2>
      <p className="step-description">Start with the basic information about your course</p>
      
      <div className="form-group">
        <label>Course Title *</label>
        <input
          type="text"
          value={courseForm.title}
          onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
          placeholder="e.g., Network Security Fundamentals"
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Description *</label>
        <textarea
          value={courseForm.description}
          onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
          placeholder="Describe what students will learn in this course..."
          className="form-textarea"
          rows={4}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Category</label>
          <select
            value={courseForm.category}
            onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
            className="form-select"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Difficulty Level</label>
          <select
            value={courseForm.difficulty}
            onChange={(e) => setCourseForm({ ...courseForm, difficulty: e.target.value })}
            className="form-select"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderCourseStep2 = () => (
    <div className="wizard-step-content">
      <h2 className="step-title">
        <Settings className="w-6 h-6" />
        Course Details
      </h2>
      <p className="step-description">Configure additional settings for your course</p>

      <div className="form-row">
        <div className="form-group">
          <label>Duration</label>
          <input
            type="text"
            value={courseForm.duration}
            onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
            placeholder="e.g., 4 weeks"
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Semester Level</label>
          <select
            value={courseForm.semester_level}
            onChange={(e) => setCourseForm({ ...courseForm, semester_level: parseInt(e.target.value) })}
            className="form-select"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label>Cover Image URL (optional)</label>
        <input
          type="url"
          value={courseForm.image_url}
          onChange={(e) => setCourseForm({ ...courseForm, image_url: e.target.value })}
          placeholder="https://example.com/image.jpg"
          className="form-input"
        />
        {courseForm.image_url && (
          <div className="image-preview">
            <img src={courseForm.image_url} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={courseForm.is_active}
            onChange={(e) => setCourseForm({ ...courseForm, is_active: e.target.checked })}
          />
          <span>Publish course immediately</span>
        </label>
      </div>
    </div>
  );

  const renderCourseStep3 = () => (
    <div className="wizard-step-content">
      <h2 className="step-title">
        <Layers className="w-6 h-6" />
        Learning Objectives
      </h2>
      <p className="step-description">What will students learn from this course?</p>

      <div className="form-group">
        <label>Objectives</label>
        <div className="array-items">
          {courseForm.objectives.map((obj, index) => (
            <div key={index} className="array-item">
              <span className="item-number">{index + 1}</span>
              <input
                type="text"
                value={obj}
                onChange={(e) => updateArrayItem('objectives', index, e.target.value)}
                placeholder="e.g., Understand network protocols"
                className="form-input"
              />
              {courseForm.objectives.length > 1 && (
                <button type="button" onClick={() => removeArrayItem('objectives', index)} className="remove-btn">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => addArrayItem('objectives')} className="add-item-btn">
            <Plus className="w-4 h-4" /> Add Objective
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Prerequisites (optional)</label>
        <div className="array-items">
          {courseForm.prerequisites.map((prereq, index) => (
            <div key={index} className="array-item">
              <span className="item-number">{index + 1}</span>
              <input
                type="text"
                value={prereq}
                onChange={(e) => updateArrayItem('prerequisites', index, e.target.value)}
                placeholder="e.g., Basic Linux knowledge"
                className="form-input"
              />
              {courseForm.prerequisites.length > 1 && (
                <button type="button" onClick={() => removeArrayItem('prerequisites', index)} className="remove-btn">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => addArrayItem('prerequisites')} className="add-item-btn">
            <Plus className="w-4 h-4" /> Add Prerequisite
          </button>
        </div>
      </div>
    </div>
  );

  const renderCourseStep4 = () => (
    <div className="wizard-step-content">
      <h2 className="step-title">
        <ClipboardCheck className="w-6 h-6" />
        Course Assessment
      </h2>
      <p className="step-description">Configure an AI-generated assessment for this course</p>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={assessmentForm.enabled}
            onChange={(e) => setAssessmentForm({ ...assessmentForm, enabled: e.target.checked })}
          />
          <span>Enable course assessment</span>
        </label>
      </div>

      {assessmentForm.enabled && (
        <>
          <div className="form-group">
            <label>Assessment Title</label>
            <input
              type="text"
              value={assessmentForm.title}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, title: e.target.value })}
              placeholder="e.g., Final Assessment"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Description (optional)</label>
            <textarea
              value={assessmentForm.description}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, description: e.target.value })}
              placeholder="Brief description of the assessment..."
              className="form-textarea"
              rows={2}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Pass Percentage</label>
              <select
                value={assessmentForm.pass_percentage}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, pass_percentage: parseInt(e.target.value) })}
                className="form-select"
              >
                <option value={50}>50%</option>
                <option value={60}>60%</option>
                <option value={70}>70%</option>
                <option value={80}>80%</option>
                <option value={90}>90%</option>
              </select>
            </div>
            <div className="form-group">
              <label>Max Attempts</label>
              <select
                value={assessmentForm.max_attempts}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, max_attempts: parseInt(e.target.value) })}
                className="form-select"
              >
                <option value={1}>1 attempt</option>
                <option value={2}>2 attempts</option>
                <option value={3}>3 attempts</option>
                <option value={5}>5 attempts</option>
                <option value={-1}>Unlimited</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Number of Questions</label>
              <select
                value={assessmentForm.num_questions}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, num_questions: parseInt(e.target.value) })}
                className="form-select"
              >
                <option value={5}>5 questions</option>
                <option value={10}>10 questions</option>
                <option value={15}>15 questions</option>
                <option value={20}>20 questions</option>
                <option value={25}>25 questions</option>
              </select>
            </div>
            <div className="form-group">
              <label>Difficulty Level</label>
              <select
                value={assessmentForm.difficulty}
                onChange={(e) => setAssessmentForm({ ...assessmentForm, difficulty: e.target.value })}
                className="form-select"
              >
                <option value="easy">Easy</option>
                <option value="intermediate">Intermediate</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Time Limit (optional)</label>
            <select
              value={assessmentForm.time_limit || ''}
              onChange={(e) => setAssessmentForm({ ...assessmentForm, time_limit: e.target.value ? parseInt(e.target.value) : null })}
              className="form-select"
            >
              <option value="">No time limit</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </select>
          </div>

          <div className="form-group">
            <label>Topics for Question Generation</label>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              AI will generate questions based on these topics using Mistral
            </p>
            <div className="array-items">
              {assessmentForm.topics.map((topic, index) => (
                <div key={index} className="array-item">
                  <span className="item-number">{index + 1}</span>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => updateTopic(index, e.target.value)}
                    placeholder="e.g., Network Security, SQL Injection, Linux Commands"
                    className="form-input"
                  />
                  {assessmentForm.topics.length > 1 && (
                    <button type="button" onClick={() => removeTopic(index)} className="remove-btn">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addTopic} className="add-item-btn">
                <Plus className="w-4 h-4" /> Add Topic
              </button>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={handlePreviewQuestions}
              disabled={generatingQuestions}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {generatingQuestions ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Generating Preview...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" /> Preview Generated Questions
                </>
              )}
            </button>
          </div>

          {showPreview && previewQuestions.length > 0 && (
            <div className="preview-questions" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: '#10b981' }}>Preview ({previewQuestions.length} questions)</h4>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto', background: '#0f172a', borderRadius: '8px', padding: '1rem' }}>
                {previewQuestions.slice(0, 3).map((q, i) => (
                  <div key={i} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #334155' }}>
                    <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>{i + 1}. {q.question}</p>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', paddingLeft: '1rem' }}>
                      <div>A) {q.option_a}</div>
                      <div>B) {q.option_b}</div>
                      <div>C) {q.option_c}</div>
                      <div>D) {q.option_d}</div>
                    </div>
                    {q.topic && <span style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.5rem', display: 'inline-block' }}>Topic: {q.topic}</span>}
                  </div>
                ))}
                {previewQuestions.length > 3 && (
                  <p style={{ color: '#64748b', textAlign: 'center', fontSize: '0.85rem' }}>
                    ... and {previewQuestions.length - 3} more questions
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderCourseStep5 = () => (
    <div className="wizard-step-content">
      <h2 className="step-title">
        <Check className="w-6 h-6" />
        Review & Create
      </h2>
      <p className="step-description">Review your course details before creating</p>

      <div className="review-card">
        <div className="review-header">
          <GraduationCap className="w-8 h-8 text-emerald-400" />
          <div>
            <h3>{courseForm.title || 'Untitled Course'}</h3>
            <span className="badge">{courseForm.difficulty}</span>
            <span className="badge">{courseForm.category}</span>
          </div>
        </div>
        
        <div className="review-body">
          <p className="review-description">{courseForm.description || 'No description provided'}</p>
          
          <div className="review-meta">
            <div><strong>Duration:</strong> {courseForm.duration || 'Not specified'}</div>
            <div><strong>Semester:</strong> {courseForm.semester_level}</div>
            <div><strong>Status:</strong> {courseForm.is_active ? '✅ Active' : '⏸️ Draft'}</div>
          </div>

          {courseForm.objectives.filter(o => o.trim()).length > 0 && (
            <div className="review-section">
              <h4>Learning Objectives</h4>
              <ul>
                {courseForm.objectives.filter(o => o.trim()).map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>
          )}

          {assessmentForm.enabled && (
            <div className="review-section" style={{ marginTop: '1.5rem', padding: '1rem', background: '#0f172a', borderRadius: '8px' }}>
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardCheck className="w-4 h-4" /> Assessment Configuration
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.9rem' }}>
                <div><strong>Pass:</strong> {assessmentForm.pass_percentage}%</div>
                <div><strong>Attempts:</strong> {assessmentForm.max_attempts === -1 ? 'Unlimited' : assessmentForm.max_attempts}</div>
                <div><strong>Questions:</strong> {assessmentForm.num_questions}</div>
                <div><strong>Difficulty:</strong> {assessmentForm.difficulty}</div>
                <div><strong>Time Limit:</strong> {assessmentForm.time_limit ? `${assessmentForm.time_limit} min` : 'None'}</div>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <strong>Topics:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {assessmentForm.topics.filter(t => t.trim()).map((topic, i) => (
                    <span key={i} className="tool-tag">{topic}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );


  // Lab Step Renderers
  const renderLabStep1 = () => (
    <div className="wizard-step-content">
      <h2 className="step-title">
        <Beaker className="w-6 h-6" />
        Create a new lab
      </h2>
      <p className="step-description">Start with the basic information about your lab</p>
      
      <div className="form-group">
        <label>Lab ID * <span className="hint">(unique identifier, e.g., lab_nmap_basics)</span></label>
        <input
          type="text"
          value={labForm.id}
          onChange={(e) => setLabForm({ ...labForm, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
          placeholder="lab_your_lab_name"
          className="form-input mono"
        />
      </div>

      <div className="form-group">
        <label>Lab Title *</label>
        <input
          type="text"
          value={labForm.title}
          onChange={(e) => setLabForm({ ...labForm, title: e.target.value })}
          placeholder="e.g., Network Scanning with Nmap"
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Description *</label>
        <textarea
          value={labForm.description}
          onChange={(e) => setLabForm({ ...labForm, description: e.target.value })}
          placeholder="Describe what students will do in this lab..."
          className="form-textarea"
          rows={4}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Category</label>
          <select
            value={labForm.category}
            onChange={(e) => setLabForm({ ...labForm, category: e.target.value })}
            className="form-select"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Difficulty Level</label>
          <select
            value={labForm.difficulty}
            onChange={(e) => setLabForm({ ...labForm, difficulty: e.target.value })}
            className="form-select"
          >
            <option value="Basic">Basic</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Duration</label>
          <input
            type="text"
            value={labForm.duration}
            onChange={(e) => setLabForm({ ...labForm, duration: e.target.value })}
            placeholder="e.g., 30 min"
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label>Semester Level</label>
          <select
            value={labForm.semester_level}
            onChange={(e) => setLabForm({ ...labForm, semester_level: parseInt(e.target.value) })}
            className="form-select"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderLabStep2 = () => (
    <div className="wizard-step-content">
      <h2 className="step-title">
        <Terminal className="w-6 h-6" />
        Lab Environment
      </h2>
      <p className="step-description">Choose the type of environment for this lab</p>

      <div className="environment-options">
        <div 
          className={`env-option ${labForm.terminal_type === 'none' ? 'selected' : ''}`}
          onClick={() => setLabForm({ ...labForm, terminal_type: 'none', vm_enabled: false })}
        >
          <div className="env-icon">📖</div>
          <div className="env-content">
            <h4>No Terminal</h4>
            <p>Theory-only lab without terminal access. Good for reading materials and quizzes.</p>
          </div>
          <div className="env-check">{labForm.terminal_type === 'none' && <Check className="w-5 h-5" />}</div>
        </div>

        <div 
          className={`env-option ${labForm.terminal_type === 'simple' ? 'selected' : ''}`}
          onClick={() => setLabForm({ ...labForm, terminal_type: 'simple', vm_enabled: false })}
        >
          <div className="env-icon">
            <Terminal className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="env-content">
            <h4>Simple Terminal</h4>
            <p>Basic command-line interface for simple tasks. Lightweight and fast.</p>
          </div>
          <div className="env-check">{labForm.terminal_type === 'simple' && <Check className="w-5 h-5" />}</div>
        </div>

        <div 
          className={`env-option ${labForm.terminal_type === 'vm' ? 'selected' : ''}`}
          onClick={() => setLabForm({ ...labForm, terminal_type: 'vm', vm_enabled: true })}
        >
          <div className="env-icon">
            <Server className="w-8 h-8 text-cyan-400" />
          </div>
          <div className="env-content">
            <h4>Full VM Environment</h4>
            <p>Complete Linux VM with GUI, persistent storage, and pre-installed security tools.</p>
            <span className="recommended">Recommended for hands-on labs</span>
          </div>
          <div className="env-check">{labForm.terminal_type === 'vm' && <Check className="w-5 h-5" />}</div>
        </div>
      </div>

      <div className="form-group" style={{ marginTop: '1.5rem' }}>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={labForm.is_active}
            onChange={(e) => setLabForm({ ...labForm, is_active: e.target.checked })}
          />
          <span>Publish lab immediately</span>
        </label>
      </div>
    </div>
  );

  const renderLabStep3 = () => (
    <div className="wizard-step-content">
      <h2 className="step-title">
        <Layers className="w-6 h-6" />
        Lab Tasks
      </h2>
      <p className="step-description">Define step-by-step tasks for students to complete</p>

      <div className="tasks-list">
        {labForm.tasks.map((task, index) => (
          <div key={index} className="task-card">
            <div className="task-header">
              <span className="task-number">Task {index + 1}</span>
              {labForm.tasks.length > 1 && (
                <button type="button" onClick={() => removeArrayItem('tasks', index)} className="remove-btn">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="task-body">
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) => updateTaskField(index, 'title', e.target.value)}
                  placeholder="e.g., Scan the target network"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Instructions</label>
                <textarea
                  value={task.description}
                  onChange={(e) => updateTaskField(index, 'description', e.target.value)}
                  placeholder="Detailed instructions for this task..."
                  className="form-textarea"
                  rows={2}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Command (optional)</label>
                  <input
                    type="text"
                    value={task.command}
                    onChange={(e) => updateTaskField(index, 'command', e.target.value)}
                    placeholder="e.g., nmap -sn 192.168.1.0/24"
                    className="form-input mono"
                  />
                </div>
                <div className="form-group">
                  <label>Hint (optional)</label>
                  <input
                    type="text"
                    value={task.hint}
                    onChange={(e) => updateTaskField(index, 'hint', e.target.value)}
                    placeholder="A helpful hint for students"
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => addArrayItem('tasks')} className="add-task-btn">
          <Plus className="w-5 h-5" /> Add Another Task
        </button>
      </div>
    </div>
  );

  const renderLabStep4 = () => (
    <div className="wizard-step-content">
      <h2 className="step-title">
        <Settings className="w-6 h-6" />
        Tools & Objectives
      </h2>
      <p className="step-description">Specify required tools and learning objectives</p>

      <div className="form-group">
        <label>Learning Objectives</label>
        <div className="array-items">
          {labForm.objectives.map((obj, index) => (
            <div key={index} className="array-item">
              <span className="item-number">{index + 1}</span>
              <input
                type="text"
                value={obj}
                onChange={(e) => updateArrayItem('objectives', index, e.target.value)}
                placeholder="e.g., Understand port scanning techniques"
                className="form-input"
              />
              {labForm.objectives.length > 1 && (
                <button type="button" onClick={() => removeArrayItem('objectives', index)} className="remove-btn">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => addArrayItem('objectives')} className="add-item-btn">
            <Plus className="w-4 h-4" /> Add Objective
          </button>
        </div>
      </div>

      <div className="form-group">
        <label>Required Tools</label>
        <div className="array-items">
          {labForm.tools_required.map((tool, index) => (
            <div key={index} className="array-item">
              <span className="item-number">{index + 1}</span>
              <input
                type="text"
                value={tool}
                onChange={(e) => updateArrayItem('tools_required', index, e.target.value)}
                placeholder="e.g., nmap, wireshark"
                className="form-input"
              />
              {labForm.tools_required.length > 1 && (
                <button type="button" onClick={() => removeArrayItem('tools_required', index)} className="remove-btn">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => addArrayItem('tools_required')} className="add-item-btn">
            <Plus className="w-4 h-4" /> Add Tool
          </button>
        </div>
      </div>
    </div>
  );

  const renderLabStep5 = () => (
    <div className="wizard-step-content">
      <h2 className="step-title">
        <Check className="w-6 h-6" />
        Review & Create
      </h2>
      <p className="step-description">Review your lab details before creating</p>

      <div className="review-card">
        <div className="review-header">
          <Beaker className="w-8 h-8 text-purple-400" />
          <div>
            <h3>{labForm.title || 'Untitled Lab'}</h3>
            <code className="lab-id">{labForm.id || 'lab_id'}</code>
            <span className="badge">{labForm.difficulty}</span>
            <span className="badge">{labForm.category}</span>
          </div>
        </div>
        
        <div className="review-body">
          <p className="review-description">{labForm.description || 'No description provided'}</p>
          
          <div className="review-meta">
            <div><strong>Duration:</strong> {labForm.duration || 'Not specified'}</div>
            <div><strong>Semester:</strong> {labForm.semester_level}</div>
            <div><strong>Environment:</strong> {labForm.terminal_type === 'vm' ? '🖥️ Full VM' : labForm.terminal_type === 'simple' ? '💻 Simple Terminal' : '📖 No Terminal'}</div>
            <div><strong>Status:</strong> {labForm.is_active ? '✅ Active' : '⏸️ Draft'}</div>
          </div>

          {labForm.tasks.filter(t => t.title.trim()).length > 0 && (
            <div className="review-section">
              <h4>Tasks ({labForm.tasks.filter(t => t.title.trim()).length})</h4>
              <ol>
                {labForm.tasks.filter(t => t.title.trim()).map((task, i) => (
                  <li key={i}>{task.title}</li>
                ))}
              </ol>
            </div>
          )}

          {labForm.tools_required.filter(t => t.trim()).length > 0 && (
            <div className="review-section">
              <h4>Required Tools</h4>
              <div className="tools-tags">
                {labForm.tools_required.filter(t => t.trim()).map((tool, i) => (
                  <span key={i} className="tool-tag">{tool}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    if (wizardType === 'course') {
      switch (currentStep) {
        case 1: return renderCourseStep1();
        case 2: return renderCourseStep2();
        case 3: return renderCourseStep3();
        case 4: return renderCourseStep4();
        case 5: return renderCourseStep5();
        default: return null;
      }
    } else {
      switch (currentStep) {
        case 1: return renderLabStep1();
        case 2: return renderLabStep2();
        case 3: return renderLabStep3();
        case 4: return renderLabStep4();
        case 5: return renderLabStep5();
        default: return null;
      }
    }
  };

  const canProceed = () => {
    if (wizardType === 'course') {
      if (currentStep === 1) return courseForm.title.trim() && courseForm.description.trim();
      return true;
    } else {
      if (currentStep === 1) return labForm.id.trim() && labForm.title.trim() && labForm.description.trim();
      return true;
    }
  };

  return (
    <Layout>
      <div className="wizard-container">
        <div className="wizard-header">
          <button onClick={() => navigate('/admin')} className="back-link">
            <ArrowLeft className="w-5 h-5" /> Back to Admin
          </button>
          <h1>
            <Sparkles className="w-6 h-6 text-emerald-400" />
            Create New {wizardType === 'course' ? 'Course' : 'Lab'}
          </h1>
        </div>

        {/* Progress Steps */}
        <div className="wizard-progress">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className={`progress-step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
            >
              <div className="step-indicator">
                {currentStep > step.id ? <Check className="w-4 h-4" /> : <step.icon className="w-4 h-4" />}
              </div>
              <span className="step-label">{step.title}</span>
              {index < steps.length - 1 && <div className="step-connector" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="wizard-error">
            <X className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="wizard-content">
          {renderCurrentStep()}
        </div>

        {/* Navigation */}
        <div className="wizard-footer">
          <button 
            onClick={handleBack} 
            disabled={currentStep === 1}
            className="btn-secondary"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          
          {currentStep < totalSteps ? (
            <button 
              onClick={handleNext}
              disabled={!canProceed()}
              className="btn-primary"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
              className="btn-success"
            >
              {loading ? 'Creating...' : `Create ${wizardType === 'course' ? 'Course' : 'Lab'}`}
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CreateWizard;
