import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Wrench, ArrowLeft, Plus, Trash2, Check, Package } from 'lucide-react';

const ToolManager = () => {
  const { labId } = useParams();
  const navigate = useNavigate();
  
  const [lab, setLab] = useState(null);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [toolForm, setToolForm] = useState({
    tool_name: '',
    tool_version: '',
    install_command: '',
    description: '',
    is_preinstalled: true
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchLabDetails();
    fetchTools();
  }, [labId, navigate]);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchLabDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/labs/${labId}`, getAuthHeaders());
      setLab(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch lab details');
    }
  };

  const fetchTools = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/admin/labs/${labId}/tools`, getAuthHeaders());
      setTools(response.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch tools');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/admin/labs/${labId}/tools`, toolForm, getAuthHeaders());
      setSuccess('Tool added successfully!');
      resetForm();
      fetchTools();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add tool');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (toolId) => {
    if (!confirm('Are you sure you want to delete this tool?')) return;
    try {
      await axios.delete(`${API_URL}/admin/labs/${labId}/tools/${toolId}`, getAuthHeaders());
      setSuccess('Tool deleted successfully!');
      fetchTools();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete tool');
      setTimeout(() => setError(''), 5000);
    }
  };

  const resetForm = () => {
    setToolForm({
      tool_name: '',
      tool_version: '',
      install_command: '',
      description: '',
      is_preinstalled: true
    });
  };

  const commonTools = [
    { name: 'nmap', install: 'apt install -y nmap', desc: 'Network scanning tool' },
    { name: 'wireshark', install: 'apt install -y wireshark', desc: 'Network protocol analyzer' },
    { name: 'metasploit-framework', install: 'apt install -y metasploit-framework', desc: 'Penetration testing framework' },
    { name: 'john', install: 'apt install -y john', desc: 'Password cracker' },
    { name: 'hydra', install: 'apt install -y hydra', desc: 'Password brute force tool' },
    { name: 'sqlmap', install: 'apt install -y sqlmap', desc: 'SQL injection tool' },
    { name: 'burpsuite', install: 'apt install -y burpsuite', desc: 'Web security testing tool' },
    { name: 'nikto', install: 'apt install -y nikto', desc: 'Web server scanner' },
    { name: 'aircrack-ng', install: 'apt install -y aircrack-ng', desc: 'WiFi security tools' },
    { name: 'hashcat', install: 'apt install -y hashcat', desc: 'Advanced password recovery' },
    { name: 'steghide', install: 'apt install -y steghide', desc: 'Steganography tool' },
    { name: 'binwalk', install: 'apt install -y binwalk', desc: 'Firmware analysis tool' },
    { name: 'exiftool', install: 'apt install -y exiftool', desc: 'Metadata analysis tool' },
    { name: 'gobuster', install: 'apt install -y gobuster', desc: 'Directory/file brute-forcer' },
    { name: 'dirb', install: 'apt install -y dirb', desc: 'Web content scanner' },
    { name: 'netcat', install: 'apt install -y netcat', desc: 'Network utility' },
  ];

  const addCommonTool = (tool) => {
    setToolForm({
      tool_name: tool.name,
      tool_version: '',
      install_command: tool.install,
      description: tool.desc,
      is_preinstalled: true
    });
  };

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button 
              onClick={() => navigate('/admin')} 
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Admin
            </button>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Wrench className="w-7 h-7 text-cyan-400" />
              Tool Manager
            </h1>
            {lab && (
              <p className="text-gray-400 mt-1">
                Managing tools for: <span className="text-emerald-400 font-semibold">{lab.title}</span>
              </p>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-200">
            {success}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Tool Form */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              Add Tool
            </h2>

            {/* Quick Select */}
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-3">Quick Select:</p>
              <div className="flex flex-wrap gap-2">
                {commonTools.map((tool, idx) => (
                  <button
                    key={idx}
                    onClick={() => addCommonTool(tool)}
                    className="px-3 py-1.5 bg-cyan-600/20 text-cyan-400 border border-cyan-600/50 rounded-full text-xs hover:bg-cyan-600/40 transition-colors"
                  >
                    {tool.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Tool Name *</label>
                <input
                  type="text"
                  value={toolForm.tool_name}
                  onChange={(e) => setToolForm({...toolForm, tool_name: e.target.value})}
                  placeholder="e.g., nmap"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Version</label>
                <input
                  type="text"
                  value={toolForm.tool_version}
                  onChange={(e) => setToolForm({...toolForm, tool_version: e.target.value})}
                  placeholder="e.g., 7.80"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Install Command</label>
                <textarea
                  value={toolForm.install_command}
                  onChange={(e) => setToolForm({...toolForm, install_command: e.target.value})}
                  placeholder="apt install -y nmap"
                  rows="2"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea
                  value={toolForm.description}
                  onChange={(e) => setToolForm({...toolForm, description: e.target.value})}
                  placeholder="Tool description..."
                  rows="3"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={toolForm.is_preinstalled}
                    onChange={(e) => setToolForm({...toolForm, is_preinstalled: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-sm">Preinstalled in VM</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Tool
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Installed Tools List */}
          <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-400" />
              Installed Tools ({tools.length})
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
              </div>
            ) : tools.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No tools configured for this lab yet.</p>
                <p className="text-gray-500 text-sm">Add tools using the form on the left.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tools.map(tool => (
                  <div 
                    key={tool.id} 
                    className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-white">{tool.tool_name}</h3>
                          {tool.tool_version && (
                            <span className="px-2 py-0.5 bg-gray-600 text-gray-300 rounded text-xs">
                              v{tool.tool_version}
                            </span>
                          )}
                          {tool.is_preinstalled && (
                            <span className="px-2 py-0.5 bg-emerald-600/20 text-emerald-400 rounded text-xs flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Preinstalled
                            </span>
                          )}
                        </div>
                        
                        {tool.description && (
                          <p className="text-gray-400 text-sm mb-3">{tool.description}</p>
                        )}
                        
                        {tool.install_command && (
                          <div className="bg-gray-900 rounded-lg p-3">
                            <p className="text-gray-500 text-xs mb-1">Install Command:</p>
                            <code className="text-emerald-400 text-sm font-mono">{tool.install_command}</code>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleDelete(tool.id)}
                        className="ml-4 p-2 text-red-400 hover:bg-red-600/20 rounded-lg transition-colors"
                        title="Delete tool"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ToolManager;
