import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle, ChevronRight, Copy,
  Terminal as TerminalIcon, Globe, Flag, Lightbulb
} from 'lucide-react';
import axios from 'axios';
import { useAuth, API_URL } from '../context/AuthContext';

export default function CyberRange() {
  const { labId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [lab, setLab] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [formInputs, setFormInputs] = useState({});
  const [completed, setCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const terminalRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchLab();
  }, [labId]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  const fetchLab = async () => {
    try {
      const res = await axios.get(`${API_URL}/labs/${labId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLab(res.data);
      setTerminalHistory([
        { type: 'system', content: `Connected to ${res.data.title}` },
        { type: 'system', content: res.data.scenario },
        { type: 'system', content: '─'.repeat(50) }
      ]);
    } catch (err) {
      navigate('/dashboard');
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

  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    if (!currentInput.trim() || !lab) return;

    const task = lab.tasks[currentStep];
    const cmd = currentInput.trim();

    setTerminalHistory(prev => [...prev, { type: 'input', content: `$ ${cmd}` }]);

    if (cmd === task.expected_command) {
      setTerminalHistory(prev => [...prev, { type: 'output', content: task.output }]);

      if (task.explanation) {
        setTerminalHistory(prev => [...prev, { type: 'success', content: task.explanation }]);
      }

      if (currentStep < lab.tasks.length - 1) {
        setCurrentStep(prev => prev + 1);
        saveProgress(currentStep + 1);
      } else {
        setCompleted(true);
        saveProgress(lab.tasks.length, true, task.flag);
        setTerminalHistory(prev => [...prev, {
          type: 'flag',
          content: `Lab completed! Flag: ${task.flag}`
        }]);
      }
    } else {
      setTerminalHistory(prev => [...prev, {
        type: 'error',
        content: `Command not recognized or incorrect for this step`
      }]);
    }

    setCurrentInput('');
    setShowHint(false);
  };

  const handleFormSubmit = (fieldName) => {
    if (!lab) return;
    const task = lab.tasks[currentStep];
    const input = formInputs[fieldName] || '';

    if (input === task.expected_input ||
        (task.expected_input === 'understood' && input.toLowerCase() === 'understood')) {
      setTerminalHistory(prev => [...prev,
        { type: 'input', content: `[${fieldName}]: ${input}` },
        { type: 'output', content: task.output }
      ]);

      if (task.explanation) {
        setTerminalHistory(prev => [...prev, { type: 'success', content: task.explanation }]);
      }

      if (currentStep < lab.tasks.length - 1) {
        setCurrentStep(prev => prev + 1);
        saveProgress(currentStep + 1);
      } else {
        setCompleted(true);
        saveProgress(lab.tasks.length, true, task.flag);
      }

      setFormInputs({});
    } else {
      setTerminalHistory(prev => [...prev, { type: 'error', content: task.output }]);
    }
    setShowHint(false);
  };

  const injectCommand = (cmd) => {
    if (lab?.environment === 'terminal') {
      setCurrentInput(cmd);
      inputRef.current?.focus();
    }
  };

  if (!lab) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
      </div>
    );
  }

  const currentTask = lab.tasks[currentStep];

  return (
    <div className="min-h-screen flex flex-col">
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
                  i < currentStep ? 'bg-emerald-500' :
                  i === currentStep ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Left Panel - Instructions */}
        <div className="w-1/2 border-r border-slate-700 overflow-y-auto p-6">
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

              <p className="text-gray-300 mb-6 leading-relaxed">{currentTask.instruction}</p>

              {currentTask.expected_command && (
                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-2">Command to execute:</p>
                  <button
                    onClick={() => injectCommand(currentTask.expected_command)}
                    className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 font-mono text-emerald-400 hover:bg-slate-700 hover:border-emerald-500 transition-all w-full text-left group"
                  >
                    <code className="flex-1">{currentTask.expected_command}</code>
                    <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <p className="text-xs text-gray-500 mt-2">Click to auto-fill in terminal</p>
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
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Panel - Lab Environment */}
        <div className="w-1/2 flex flex-col bg-black">
          {lab.environment === 'terminal' ? (
            <>
              <div className="bg-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-700">
                <TerminalIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-gray-300">Terminal</span>
              </div>
              <div
                ref={terminalRef}
                className="flex-1 p-4 font-mono text-sm overflow-y-auto"
                onClick={() => inputRef.current?.focus()}
              >
                {terminalHistory.map((entry, i) => (
                  <div key={i} className={`mb-1 ${
                    entry.type === 'input' ? 'text-white' :
                    entry.type === 'output' ? 'text-gray-300 whitespace-pre-wrap' :
                    entry.type === 'error' ? 'text-red-400' :
                    entry.type === 'success' ? 'text-emerald-400' :
                    entry.type === 'flag' ? 'text-yellow-400 font-bold' :
                    'text-sky-400'
                  }`}>
                    {entry.content}
                  </div>
                ))}
                {!completed && (
                  <form onSubmit={handleTerminalSubmit} className="flex items-center">
                    <span className="text-emerald-400 mr-2">$</span>
                    <input
                      ref={inputRef}
                      type="text"
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      className="flex-1 bg-transparent text-white outline-none"
                      autoFocus
                    />
                    <span className="terminal-cursor text-white">▋</span>
                  </form>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-700">
                <Globe className="w-4 h-4 text-sky-400" />
                <span className="text-sm text-gray-300">Web Interface</span>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-md mx-auto">
                  <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-4 text-center">
                      Admin Login
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Username</label>
                        <input
                          type="text"
                          value={formInputs.username || ''}
                          onChange={(e) => setFormInputs({ ...formInputs, username: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && currentTask.input_field === 'username' && handleFormSubmit('username')}
                          className="input-field"
                          placeholder="Enter username"
                        />
                        {currentTask.input_field === 'username' && (
                          <button
                            onClick={() => handleFormSubmit('username')}
                            className="btn-secondary w-full mt-2"
                          >
                            Submit
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Password</label>
                        <input
                          type="text"
                          value={formInputs.password || ''}
                          onChange={(e) => setFormInputs({ ...formInputs, password: e.target.value })}
                          onKeyDown={(e) => e.key === 'Enter' && currentTask.input_field === 'password' && handleFormSubmit('password')}
                          className="input-field"
                          placeholder="Enter password"
                        />
                        {currentTask.input_field === 'password' && (
                          <button
                            onClick={() => handleFormSubmit('password')}
                            className="btn-secondary w-full mt-2"
                          >
                            Submit
                          </button>
                        )}
                      </div>
                      {currentTask.input_field === 'confirm' && (
                        <button
                          onClick={() => {
                            setFormInputs({ ...formInputs, confirm: 'understood' });
                            setTimeout(() => handleFormSubmit('confirm'), 100);
                          }}
                          className="btn-primary w-full"
                        >
                          I Understand - Continue
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 bg-slate-900 rounded-lg p-4 font-mono text-xs">
                    <div className="text-gray-500 mb-2">Console Output:</div>
                    {terminalHistory.slice(-5).map((entry, i) => (
                      <div key={i} className={`mb-1 ${
                        entry.type === 'error' ? 'text-red-400' :
                        entry.type === 'success' ? 'text-emerald-400' :
                        entry.type === 'output' ? 'text-gray-300 whitespace-pre-wrap' :
                        'text-sky-400'
                      }`}>
                        {entry.content}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
