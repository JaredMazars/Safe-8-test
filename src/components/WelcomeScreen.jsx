import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const WelcomeScreen = ({
  industries,
  selectedAssessmentType,
  selectedIndustry,
  onAssessmentTypeSelect,
  onIndustrySelect,
  onLogin,
  userData = null
}) => {
  const navigate = useNavigate();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!loginEmail.trim()) {
      setLoginError('Please enter your email or username');
      return;
    }

    if (!loginPassword.trim()) {
      setLoginError('Please enter your password');
      return;
    }

    setIsLoggingIn(true);
    setLoginError('');

    try {
      // First, try admin login
      try {
        const adminResponse = await api.post('/api/admin/login', {
          username: loginEmail,
          password: loginPassword
        });

        if (adminResponse.data.success) {
          // Admin login successful
          localStorage.setItem('adminToken', adminResponse.data.sessionToken);
          const { password_hash, ...safeAdminData } = adminResponse.data.admin;
          localStorage.setItem('adminUser', JSON.stringify(safeAdminData));
          
          console.log('✅ Admin logged in successfully');
          setLoginEmail('');
          setLoginPassword('');
          setShowLoginForm(false);
          navigate('/admin/dashboard');
          return;
        }
      } catch (adminError) {
        // If admin login fails with 401 (invalid credentials), try user login
        if (adminError.response?.status === 401 || adminError.response?.status === 404) {
          // Try user login
          const emailRegex = /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,255}\.[A-Za-z]{2,}$/;
          
          if (!emailRegex.test(loginEmail)) {
            setLoginError('Invalid credentials');
            setIsLoggingIn(false);
            return;
          }

          try {
            const userResponse = await api.post('/api/lead/login', {
              email: loginEmail,
              password: loginPassword
            });

            if (userResponse.data.success) {
              onLogin(userResponse.data);
              setLoginEmail('');
              setLoginPassword('');
              setShowLoginForm(false);
              return;
            }
          } catch (userError) {
            // Handle user login errors
            if (userError.response?.status === 404) {
              setLoginError('Invalid credentials');
            } else if (userError.response?.status === 401) {
              const attemptsRemaining = userError.response.data?.attemptsRemaining;
              if (attemptsRemaining) {
                setLoginError(`Invalid password. ${attemptsRemaining} attempts remaining.`);
              } else {
                setLoginError('Invalid credentials');
              }
            } else if (userError.response?.status === 423) {
              setLoginError('Account locked due to too many failed attempts. Please try again later.');
            } else {
              setLoginError('Invalid credentials');
            }
            return;
          }
        } else if (adminError.response?.status === 423) {
          setLoginError('Account locked due to too many failed attempts. Please try again later.');
          return;
        } else {
          setLoginError('Login failed. Please try again.');
          return;
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="welcome-container">
      <div className="welcome-wrapper">
        {/* Header Section */}
        <header className="welcome-header">
          <img 
            src="/ForvisMazars-Logo-Color-RGB.jpg" 
            alt="Forvis Mazars" 
            className="welcome-logo"
          />
          <div className="header-actions">
            {userData ? (
              <div className="user-info-banner">
                <i className="fas fa-user-circle"></i>
                <div className="user-info-text">
                  <div className="user-info-name">{userData.contact_name || userData.contactName}</div>
                  <div className="user-info-company">{userData.company_name || userData.companyName}</div>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-view-dashboard"
                >
                  <i className="fas fa-tachometer-alt"></i>
                  View Dashboard
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginForm(!showLoginForm)}
                className="btn-login-toggle"
              >
                <i className="fas fa-sign-in-alt"></i>
                {showLoginForm ? 'Cancel' : 'Login'}
              </button>
            )}
          </div>

          <div className="header-content">
            <h1 className="hero-title">SAFE-8 AI Readiness Framework</h1>
            {userData ? (
              <p className="hero-subtitle">Welcome back, {userData.contact_name || userData.contactName}! Ready to take another assessment?</p>
            ) : (
              <p className="hero-subtitle">Accelerating AI Transformation with Confidence</p>
            )}
          </div>
          
          {/* Login Form */}
          {showLoginForm && !userData && (
            <div className="login-form-container">
              <h3 className="login-title">Login to Your Account</h3>
              <form onSubmit={handleLoginSubmit} className="login-form">
                <div className="form-group">
                  <input
                    type="text"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      setLoginError('');
                    }}
                    placeholder="Email or Username"
                    className="login-input"
                    disabled={isLoggingIn}
                  />
                </div>
                
                <div className="form-group password-group">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setLoginError('');
                    }}
                    placeholder="Password"
                    className="login-input"
                    disabled={isLoggingIn}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="password-toggle"
                    disabled={isLoggingIn}
                  >
                    <i className={`fas ${showLoginPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                
                {loginError && (
                  <div className="login-error">
                    <i className="fas fa-exclamation-circle"></i>
                    {loginError}
                  </div>
                )}
                
                <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="btn-text-link"
                  style={{ color: 'white' }}
                >
                  <i className="fas fa-key" style={{ marginRight: '0.375rem' }}></i>
                  Forgot your password?
                </button>
              </div>

                
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="btn-login-submit"
                >
                  {isLoggingIn ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Logging in...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sign-in-alt"></i>
                      Access Dashboard
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </header>
        
        {/* Main Content */}
        <main className="welcome-content">
          <section className="assessment-selection">
            <h2 className="section-heading">Choose Your Assessment Level</h2>
            
            <div className="assessment-grid">
              <AssessmentCard
                type="core"
                title="Core Assessment"
                duration="25 questions • ~5 minutes"
                icon="fas fa-rocket"
                features={[
                  "AI strategy alignment",
                  "Governance essentials", 
                  "Basic readiness factors"
                ]}
                audience="Executives & Leaders"
                audienceColor="green"
                isSelected={selectedAssessmentType === 'core'}
                onClick={() => onAssessmentTypeSelect('core')}
              />
              
              <AssessmentCard
                type="advanced"
                title="Advanced Assessment"
                duration="45 questions • ~9 minutes"
                icon="fas fa-cogs"
                features={[
                  "Technical infrastructure",
                  "Data pipeline maturity",
                  "Advanced capabilities"
                ]}
                audience="CIOs & Technical Leaders"
                audienceColor="blue"
                isSelected={selectedAssessmentType === 'advanced'}
                onClick={() => onAssessmentTypeSelect('advanced')}
              />
              
              <AssessmentCard
                type="frontier"
                title="Frontier Assessment"
                duration="60 questions • ~12 minutes"
                icon="fas fa-brain"
                features={[
                  "Next-gen capabilities",
                  "Multi-agent orchestration",
                  "Cutting-edge readiness"
                ]}
                audience="AI Centers of Excellence"
                audienceColor="purple"
                isSelected={selectedAssessmentType === 'frontier'}
                onClick={() => onAssessmentTypeSelect('frontier')}
              />
            </div>
            
            {/* Industry Selection */}
            {selectedAssessmentType && (
              <div className="industry-selection">
                <h3 className="industry-heading">Select Your Industry</h3>
                <p className="industry-description">
                  This helps us provide tailored insights and benchmarking
                </p>
                
                <div className="industry-grid">
                  {industries.map(industry => (
                    <button
                      key={industry}
                      className={`industry-btn ${selectedIndustry === industry ? 'selected' : ''}`}
                      onClick={() => onIndustrySelect(industry)}
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
          
          {/* Start Button */}
          {selectedAssessmentType && selectedIndustry && (
            <div className="action-section">
              <button
                className="btn-start-assessment"
                onClick={() => {
                  if (userData) {
                    navigate('/assessment')
                  } else {
                    navigate('/register')
                  }
                }}
              >
                {userData ? (
                  <>
                    <i className="fas fa-play"></i>
                    Start Assessment
                  </>
                ) : (
                  <>
                    <i className="fas fa-arrow-right"></i>
                    Continue to Assessment
                  </>
                )}
              </button>
            </div>
          )}

          {/* Login Prompt */}
          {!userData && !showLoginForm && selectedAssessmentType && (
            <div className="login-prompt">
              <p>
                Already completed an assessment?{' '}
                <button
                  onClick={() => setShowLoginForm(true)}
                  className="login-link"
                >
                  Login to view your results
                </button>
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const AssessmentCard = ({
  type,
  title,
  duration,
  icon,
  features,
  audience,
  audienceColor,
  isSelected,
  onClick
}) => {
  return (
    <div
      className={`assessment-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="card-icon">
        <i className={icon}></i>
      </div>
      <h3 className="card-title">{title}</h3>
      <p className="card-duration">{duration}</p>
      
      <ul className="card-features">
        {features.map((feature, index) => (
          <li key={index}>
            <i className="fas fa-check-circle"></i>
            {feature}
          </li>
        ))}
      </ul>
      
      <div className="card-footer">
        <span className={`audience-badge ${audienceColor}`}>
          {audience}
        </span>
      </div>
    </div>
  );
};

export default WelcomeScreen;
