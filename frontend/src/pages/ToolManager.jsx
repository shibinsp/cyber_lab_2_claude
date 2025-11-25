import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../context/AuthContext';
import './ToolManager.css';

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
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });

  const fetchLabDetails = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/admin/labs/${labId}`,
        getAuthHeaders()
      );
      setLab(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch lab details');
    }
  };

  const fetchTools = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/admin/labs/${labId}/tools`,
        getAuthHeaders()
      );
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
      await axios.post(
        `${API_URL}/admin/labs/${labId}/tools`,
        toolForm,
        getAuthHeaders()
      );
      setSuccess('Tool added successfully!');
      resetForm();
      fetchTools();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add tool');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (toolId) => {
    if (!confirm('Are you sure you want to delete this tool?')) return;
    
    try {
      await axios.delete(
        `${API_URL}/admin/labs/${labId}/tools/${toolId}`,
        getAuthHeaders()
      );
      setSuccess('Tool deleted successfully!');
      fetchTools();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete tool');
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

  // Common tools list for quick selection
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
    <div className="tool-manager">
      <div className="tool-header">
        <div>
          <h1>🔧 Tool Manager</h1>
          {lab && <p className="lab-title">Managing tools for: <strong>{lab.title}</strong></p>}
        </div>
        <button onClick={() => navigate('/admin')} className="btn-back">
          Back to Admin
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="tool-content">
        <div className="section-split">
          <div className="form-section">
            <h2>Add Tool</h2>
            
            <div className="quick-select">
              <p><strong>Quick Select:</strong></p>
              <div className="common-tools">
                {commonTools.map((tool, idx) => (
                  <button
                    key={idx}
                    className="tool-badge"
                    onClick={() => addCommonTool(tool)}
                  >
                    {tool.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tool Name *</label>
                <input
                  type="text"
                  value={toolForm.tool_name}
                  onChange={(e) => setToolForm({...toolForm, tool_name: e.target.value})}
                  placeholder="e.g., nmap"
                  required
                />
              </div>

              <div className="form-group">
                <label>Version</label>
                <input
                  type="text"
                  value={toolForm.tool_version}
                  onChange={(e) => setToolForm({...toolForm, tool_version: e.target.value})}
                  placeholder="e.g., 7.80"
                />
              </div>

              <div className="form-group">
                <label>Install Command</label>
                <textarea
                  value={toolForm.install_command}
                  onChange={(e) => setToolForm({...toolForm, install_command: e.target.value})}
                  placeholder="apt install -y nmap"
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={toolForm.description}
                  onChange={(e) => setToolForm({...toolForm, description: e.target.value})}
                  placeholder="Tool description..."
                  rows="3"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={toolForm.is_preinstalled}
                    onChange={(e) => setToolForm({...toolForm, is_preinstalled: e.target.checked})}
                  />
                  Preinstalled
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  Add Tool
                </button>
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Reset
                </button>
              </div>
            </form>
          </div>

          <div className="list-section">
            <h2>Installed Tools ({tools.length})</h2>
            {loading ? (
              <p>Loading...</p>
            ) : tools.length === 0 ? (
              <div className="empty-state">
                <p>No tools configured for this lab yet.</p>
                <p className="hint">Add tools using the form on the left.</p>
              </div>
            ) : (
              <div className="tools-list">
                {tools.map(tool => (
                  <div key={tool.id} className="tool-card">
                    <div className="tool-header-row">
                      <h3>{tool.tool_name}</h3>
                      {tool.tool_version && <span className="version-badge">{tool.tool_version}</span>}
                      {tool.is_preinstalled && <span className="preinstalled-badge">✓ Preinstalled</span>}
                    </div>
                    
                    {tool.description && (
                      <p className="tool-description">{tool.description}</p>
                    )}
                    
                    {tool.install_command && (
                      <div className="install-command">
                        <strong>Install:</strong>
                        <code>{tool.install_command}</code>
                      </div>
                    )}
                    
                    <div className="tool-actions">
                      <button onClick={() => handleDelete(tool.id)} className="btn-delete">
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolManager;

