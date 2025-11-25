import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle, Flag, Lightbulb,
  Play, Square, RotateCcw, Monitor, Loader2
} from 'lucide-react';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';

export default function CyberRange() {
  const { labId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  // Lab state with explicit loading and error states
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [stepCompleted, setStepCompleted] = useState({});

  // VM state
  const [vmStatus, setVmStatus] = useState('not_running');
  const [vmLoading, setVmLoading] = useState(false);
  const [vmPort, setVmPort] = useState(null);
  const [vmError, setVmError] = useState(null);

  useEffect(() => {
    console.log('=== CyberRange Component Mounted ===');
    console.log('Lab ID:', labId);
    console.log('API URL:', API_URL);
    console.log('Token:', token ? 'Available' : 'Missing');

    if (!labId) {
      console.error('ERROR: No labId provided');
      setError('Invalid lab URL: No lab ID found');
      setLoading(false);
      return;
    }

    if (!token) {
      console.error('ERROR: No auth token');
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    // Fetch lab data
    fetchLab();

    // Check VM status and poll
    checkVmStatus();
    const interval = setInterval(checkVmStatus, 10000);

    return () => clearInterval(interval);
  }, [labId, token]);

  const fetchLab = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('>>> FETCHING LAB:', labId);

      const res = await axios.get(`${API_URL}/labs/${labId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('>>> Lab Response Status:', res.status);
      console.log('>>> Lab Data:', res.data);

      // Validate lab data
      if (!res.data) {
        throw new Error('No lab data received from server');
      }

      if (!res.data.tasks || !Array.isArray(res.data.tasks) || res.data.tasks.length === 0) {
        throw new Error(`Lab has no tasks configured. Lab ID: ${labId}`);
      }

      console.log('>>> ✓ Lab loaded successfully:', res.data.title, '(' + res.data.tasks.length + ' tasks)');

      // Set lab data
      setLab(res.data);
      setLoading(false);
      setError(null);

    } catch (err) {
      console.error('>>> LAB FETCH ERROR:', err);
      console.error('>>> Error Details:', err.response?.data);

      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load lab';
      setError(errorMessage);
      setLoading(false);
      setLab(null);
    }
  };

  const checkVmStatus = async () => {
    if (!labId) return;
    try {
      const res = await axios.get(`${API_URL}/vm/status/${labId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('VM Status Response:', res.data);  // DEBUG
      if (res.data.running) {
        setVmStatus('running');
        setVmPort(res.data.novnc_port);
        console.log('Set VM port to:', res.data.novnc_port);  // DEBUG
      } else {
        setVmStatus('not_running');
        setVmPort(null);
      }
    } catch (err) {
      console.error('Failed to check VM status:', err);
      setVmStatus('not_running');
      setVmPort(null);
    }
  };

  const startVm = async () => {
    if (!labId) return;
    setVmLoading(true);
    setVmError(null);
    try {
      console.log('>>> Starting VM for lab:', labId);
      const res = await axios.post(`${API_URL}/vm/start/${labId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('>>> VM Start Response:', res.data);
      console.log('>>> Response status:', res.data.status);
      console.log('>>> NoVNC port:', res.data.novnc_port);

      if (res.data.status === 'started' || res.data.status === 'already_running') {
        const port = res.data.novnc_port;
        if (!port) {
          throw new Error('No NoVNC port returned from server');
        }
        setVmPort(port);
        setVmStatus('running');
        setVmError(null);
        console.log('>>> ✓ VM started successfully on port:', port);
        console.log('>>> Will connect to:', `http://${window.location.hostname}:${port}/vnc.html`);
      } else {
        throw new Error(`Unexpected status: ${res.data.status}`);
      }
    } catch (err) {
      console.error('>>> VM Start Error:', err);
      console.error('>>> Error response:', err.response?.data);
      console.error('>>> Error message:', err.message);

      const errorMsg = err.response?.data?.detail || err.message || 'Failed to start VM';
      setVmError(errorMsg);
      alert(`VM Start Failed: ${errorMsg}`);
    } finally {
      setVmLoading(false);
    }
  };

  const pauseVm = async () => {
    if (!labId) return;
    setVmLoading(true);
    try {
      await axios.post(`${API_URL}/vm/pause/${labId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVmStatus('paused');
      alert('VM paused - Resources saved! Click Resume to continue.');
    } catch (err) {
      console.error('Pause VM error:', err);
      alert('Failed to pause VM');
    } finally {
      setVmLoading(false);
    }
  };

  const resumeVm = async () => {
    if (!labId) return;
    setVmLoading(true);
    try {
      await axios.post(`${API_URL}/vm/resume/${labId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVmStatus('running');
    } catch (err) {
      console.error('Resume VM error:', err);
      alert('Failed to resume VM');
    } finally {
      setVmLoading(false);
    }
  };

  const stopVm = async () => {
    if (!labId) return;
    setVmLoading(true);
    try {
      await axios.post(`${API_URL}/vm/stop/${labId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVmStatus('not_running');
      setVmPort(null);
      setVmError(null);
    } catch (err) {
      setVmError(err.response?.data?.detail || 'Failed to stop VM');
    } finally {
      setVmLoading(false);
    }
  };

  const resetVm = async () => {
    if (!labId) return;
    setVmLoading(true);
    setVmError(null);
    try {
      // Stop and then start the VM
      await stopVm();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      await startVm();
    } catch (err) {
      setVmError(err.response?.data?.detail || 'Failed to reset VM');
    } finally {
      setVmLoading(false);
    }
  };

  const saveProgress = async (step, isCompleted = false, flag = null) => {
    try {
      await axios.post(`${API_URL}/labs/progress`, {
        lab_id: labId,
        current_step: step,
        completed: isCompleted,
        flag_submitted: flag
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  };

  const markStepComplete = () => {
    if (!lab) return;

    const task = lab.tasks[currentStep];
    setStepCompleted(prev => ({ ...prev, [currentStep]: true }));

    if (currentStep < lab.tasks.length - 1) {
      setCurrentStep(prev => prev + 1);
      saveProgress(currentStep + 1);
    } else {
      setCompleted(true);
      saveProgress(lab.tasks.length, true, task.flag);
    }
  };

  // LOADING STATE
  if (loading) {
    console.log('>>> RENDERING: Loading state');
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg mb-2">Loading lab...</p>
          <p className="text-gray-500 text-sm">Lab ID: {labId}</p>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (error) {
    console.log('>>> RENDERING: Error state -', error);
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto p-6">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 mb-4">
            <p className="text-xl mb-4 text-red-400">⚠️ Error Loading Lab</p>
            <p className="text-gray-300 mb-2">{error}</p>
            <p className="text-gray-500 text-sm">Lab ID: {labId}</p>
          </div>
          <button
            onClick={() => navigate('/labs')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Back to Labs
          </button>
        </div>
      </div>
    );
  }

  // NO LAB DATA STATE
  if (!lab) {
    console.log('>>> RENDERING: No lab data (unexpected)');
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="text-xl mb-4 text-yellow-400">⚠️ No Lab Data</p>
          <p className="text-gray-400 mb-4">Lab data is missing</p>
          <button
            onClick={() => navigate('/labs')}
            className="px-4 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-700"
          >
            Back to Labs
          </button>
        </div>
      </div>
    );
  }

  // INVALID LAB DATA STATE
  if (!lab.tasks || !Array.isArray(lab.tasks) || lab.tasks.length === 0) {
    console.log('>>> RENDERING: Invalid lab data - no tasks');
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md mx-auto p-6">
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-6 mb-4">
            <p className="text-xl mb-4 text-yellow-400">⚠️ Lab Configuration Error</p>
            <p className="text-gray-300 mb-2">This lab has no tasks configured.</p>
            <p className="text-gray-500 text-sm mb-4">Lab ID: {labId}</p>
          </div>
          <button
            onClick={() => navigate('/labs')}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Back to Labs
          </button>
        </div>
      </div>
    );
  }

  // SUCCESS - Render lab interface
  console.log('>>> RENDERING: Lab interface');

  const currentTask = lab.tasks[currentStep];
  const vmUrl = vmPort ? `http://${window.location.hostname}:${vmPort}/vnc.html?autoconnect=true&resize=scale` : null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-900">
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">{lab.title}</h1>
              <p className="text-xs text-gray-400">
                Step {currentStep + 1} of {lab.tasks.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lab.tasks.map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  stepCompleted[i] ? 'bg-emerald-500' :
                  i === currentStep ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Left Panel - Instructions */}
        <div className="w-2/5 bg-gray-900 border-r border-slate-700 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="mb-6">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Task {currentStep + 1}
                </span>
                <h2 className="text-2xl font-bold text-white mt-2">{currentTask.title}</h2>
              </div>

              <p className="text-gray-300 mb-6 leading-relaxed whitespace-pre-wrap">{currentTask.instruction}</p>

              {currentTask.expected_command && (
                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-2">Command to execute in VM:</p>
                  <div className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 font-mono text-emerald-400">
                    <code>{currentTask.expected_command}</code>
                  </div>
                </div>
              )}

              {currentTask.hint && (
                <div className="mb-6">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <Lightbulb className="w-4 h-4" />
                    {showHint ? 'Hide Hint' : 'Show Hint'}
                  </button>
                  <AnimatePresence>
                    {showHint && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-200 text-sm"
                      >
                        {currentTask.hint}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {!completed && !stepCompleted[currentStep] && (
                <button
                  onClick={markStepComplete}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Step Complete
                </button>
              )}

              {stepCompleted[currentStep] && !completed && (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                  <span>Step completed!</span>
                </div>
              )}

              {completed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Flag className="w-6 h-6 text-emerald-400" />
                    <span className="text-lg font-semibold text-emerald-400">Lab Completed!</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Congratulations! You've successfully completed this lab.
                  </p>
                  {currentTask.flag && (
                    <div className="mt-3 bg-slate-800 rounded p-2 font-mono text-yellow-400 text-sm">
                      Flag: {currentTask.flag}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Panel - VM Environment */}
        <div className="w-3/5 flex flex-col bg-slate-900">
          {/* VM Controls */}
          <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-gray-300">Virtual Machine</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                vmStatus === 'running' ? 'bg-emerald-500/20 text-emerald-400' :
                vmLoading ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {vmLoading ? 'starting...' : vmStatus.replace('_', ' ')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {vmStatus === 'not_running' || vmStatus === 'stopped' ? (
                <button
                  onClick={startVm}
                  disabled={vmLoading}
                  className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 text-white text-xs rounded transition-colors"
                >
                  {vmLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                  Start
                </button>
              ) : vmStatus === 'paused' ? (
                <button
                  onClick={resumeVm}
                  disabled={vmLoading}
                  className="flex items-center gap-1 px-3 py-1 bg-sky-600 hover:bg-sky-500 disabled:bg-gray-600 text-white text-xs rounded transition-colors"
                >
                  {vmLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                  Resume
                </button>
              ) : (
                <>
                  <button
                    onClick={pauseVm}
                    disabled={vmLoading}
                    title="Pause VM to save resources (0% CPU)"
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white text-xs rounded transition-colors"
                  >
                    {vmLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-xs">❚❚</span>}
                    Pause
                  </button>
                  <button
                    onClick={stopVm}
                    disabled={vmLoading}
                    className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white text-xs rounded transition-colors"
                  >
                    {vmLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Square className="w-3 h-3" />}
                    Stop
                  </button>
                  <button
                    onClick={resetVm}
                    disabled={vmLoading}
                    className="flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 text-white text-xs rounded transition-colors"
                  >
                    {vmLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                    Reset
                  </button>
                </>
              )}
            </div>
          </div>

          {/* VM Display */}
          <div className="flex-1 relative">
            {vmError && (
              <div className="absolute top-4 left-4 right-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm z-10">
                {vmError}
              </div>
            )}

            {vmStatus === 'running' && vmUrl ? (
              <iframe
                src={vmUrl}
                className="w-full h-full border-0"
                title="Virtual Machine"
                allow="clipboard-read; clipboard-write"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Monitor className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg mb-2">Virtual Machine Not Running</p>
                <p className="text-sm text-gray-500 mb-4">Click "Start" to launch your lab environment</p>
                <button
                  onClick={startVm}
                  disabled={vmLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {vmLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Starting VM...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Start Virtual Machine
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-600 mt-4">
                  Ubuntu 22.04 with cybersecurity tools
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
