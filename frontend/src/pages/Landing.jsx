import { Link } from 'react-router-dom';
import { 
  Shield, Terminal, Users, Award, BookOpen, Server, 
  ChevronRight, Play, CheckCircle, Zap, Lock, Globe,
  GraduationCap, Target, Cpu, ArrowRight
} from 'lucide-react';
import './Landing.css';

const Landing = () => {
  const features = [
    {
      icon: Terminal,
      title: 'Hands-On Labs',
      description: 'Practice in real Linux VMs with pre-installed security tools. Learn by doing, not just reading.'
    },
    {
      icon: BookOpen,
      title: 'Structured Courses',
      description: 'Follow curated learning paths from beginner to advanced. Progress at your own pace.'
    },
    {
      icon: Shield,
      title: 'Real-World Scenarios',
      description: 'Train with realistic attack and defense scenarios used by industry professionals.'
    },
    {
      icon: Award,
      title: 'Skill Assessment',
      description: 'AI-powered assessments to evaluate your knowledge and track your progress.'
    },
    {
      icon: Server,
      title: 'Cloud Infrastructure',
      description: 'No setup required. Access your personal lab environment from any browser.'
    },
    {
      icon: Users,
      title: 'Community Learning',
      description: 'Join a community of cybersecurity enthusiasts and learn together.'
    }
  ];

  const stats = [
    { value: '50+', label: 'Hands-on Labs' },
    { value: '20+', label: 'Security Courses' },
    { value: '1000+', label: 'Active Students' },
    { value: '24/7', label: 'Lab Access' }
  ];

  const categories = [
    { name: 'Network Security', icon: Globe, color: '#3b82f6' },
    { name: 'Web Security', icon: Lock, color: '#8b5cf6' },
    { name: 'Penetration Testing', icon: Target, color: '#ef4444' },
    { name: 'Digital Forensics', icon: Cpu, color: '#f59e0b' },
    { name: 'Cryptography', icon: Shield, color: '#10b981' },
    { name: 'Linux Fundamentals', icon: Terminal, color: '#06b6d4' }
  ];

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <Shield className="logo-icon" />
            <span>Cyyberlabs</span>
          </Link>
          <div className="nav-links">
            <a href="#features">Features</a>
            <Link to="/learn">Learn</Link>
            <a href="#courses">Courses</a>
            <a href="#about">About</a>
            <Link to="/login" className="nav-btn-secondary">Sign In</Link>
            <Link to="/register" className="nav-btn-primary">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-effects">
          <div className="hero-grid"></div>
          <div className="hero-glow"></div>
        </div>
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <Zap className="w-4 h-4" />
              <span>Next-Gen Cybersecurity Training</span>
            </div>
            <h1 className="hero-title">
              Master Cybersecurity
              <span className="gradient-text"> Through Practice</span>
            </h1>
            <p className="hero-description">
              Learn ethical hacking, penetration testing, and cyber defense in real 
              Linux environments. Build job-ready skills with hands-on labs and 
              AI-powered assessments.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn-hero-primary">
                Start Learning Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#demo" className="btn-hero-secondary">
                <Play className="w-5 h-5" />
                Watch Demo
              </a>
            </div>
            <div className="hero-trust">
              <div className="trust-avatars">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="trust-avatar">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                ))}
              </div>
              <span>Join 1,000+ students already learning</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="terminal-window">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="dot red"></span>
                  <span className="dot yellow"></span>
                  <span className="dot green"></span>
                </div>
                <span className="terminal-title">cyberlab@kali:~</span>
              </div>
              <div className="terminal-body">
                <div className="terminal-line">
                  <span className="prompt">$</span>
                  <span className="command">nmap -sV -sC 192.168.1.0/24</span>
                </div>
                <div className="terminal-output">
                  Starting Nmap 7.94 scan...
                </div>
                <div className="terminal-output success">
                  Discovered 5 hosts up (0.0042s latency)
                </div>
                <div className="terminal-line">
                  <span className="prompt">$</span>
                  <span className="command typing">sqlmap -u "http://target/page?id=1"</span>
                  <span className="cursor">|</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">Features</span>
            <h2 className="section-title">Everything You Need to Become a Security Expert</h2>
            <p className="section-description">
              Our platform provides all the tools and resources you need to master cybersecurity skills
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="courses" className="categories-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">Learning Paths</span>
            <h2 className="section-title">Explore Our Security Domains</h2>
            <p className="section-description">
              Choose your specialization and start your journey in cybersecurity
            </p>
          </div>
          <div className="categories-grid">
            {categories.map((category, index) => (
              <div key={index} className="category-card" style={{'--accent-color': category.color}}>
                <div className="category-icon">
                  <category.icon className="w-8 h-8" />
                </div>
                <h3 className="category-name">{category.name}</h3>
                <ChevronRight className="category-arrow" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-badge">How It Works</span>
            <h2 className="section-title">Start Learning in 3 Simple Steps</h2>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <h3>Create Account</h3>
              <p>Sign up for free and complete your skill assessment to get personalized recommendations.</p>
            </div>
            <div className="step-connector"></div>
            <div className="step-card">
              <div className="step-number">02</div>
              <h3>Choose Your Path</h3>
              <p>Select from our curated courses and labs based on your interests and skill level.</p>
            </div>
            <div className="step-connector"></div>
            <div className="step-card">
              <div className="step-number">03</div>
              <h3>Practice & Learn</h3>
              <p>Access real Linux VMs, complete hands-on labs, and earn certifications.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2>Ready to Start Your Cybersecurity Journey?</h2>
            <p>Join thousands of students learning practical security skills. No credit card required.</p>
            <div className="cta-features">
              <div className="cta-feature">
                <CheckCircle className="w-5 h-5" />
                <span>Free tier available</span>
              </div>
              <div className="cta-feature">
                <CheckCircle className="w-5 h-5" />
                <span>No setup required</span>
              </div>
              <div className="cta-feature">
                <CheckCircle className="w-5 h-5" />
                <span>Learn at your pace</span>
              </div>
            </div>
            <Link to="/register" className="btn-cta">
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              <Shield className="w-6 h-6" />
              <span>Cyyberlabs</span>
            </div>
            <p>Building the next generation of cybersecurity professionals through hands-on training.</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Platform</h4>
              <a href="#features">Features</a>
              <a href="#courses">Courses</a>
              <a href="#labs">Labs</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#about">About</a>
              <a href="#contact">Contact</a>
              <a href="#careers">Careers</a>
            </div>
            <div className="footer-column">
              <h4>Legal</h4>
              <a href="#privacy">Privacy</a>
              <a href="#terms">Terms</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Cyyberlabs. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
