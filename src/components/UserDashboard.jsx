import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function UserDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [assessmentTypes, setAssessmentTypes] = useState([]);

  // Logout handler
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      if (onLogout) {
        onLogout();
      }
      navigate('/');
    }
  };

  // Load dashboard data (stats only on initial load)
  const loadDashboardData = async (loadStatsOnly = false) => {
    try {
      setLoading(true);
      setError(null);

      console.log('📊 Loading dashboard for user:', user);
      const userId = user?.id || user?.leadId || user?.userId;
      console.log('📊 Using user ID:', userId);
      
      if (!userId) {
        throw new Error('User ID not found in user object');
      }

      // Get dashboard statistics from user engagement endpoint
      console.log('📊 Fetching stats from:', `/api/user-engagement/dashboard/${userId}`);
      const statsResponse = await api.get(`/api/user-engagement/dashboard/${userId}`);
      console.log('📊 Stats response:', statsResponse.data);
      setDashboardStats(statsResponse.data.data || {
        totalAssessments: 0,
        averageScore: 0,
        lastAssessmentDate: null,
        completionRate: 100,
        daysSinceLastAssessment: null
      });

      if (!loadStatsOnly) {
        // Get assessment history
        await loadAssessmentHistory(1, 'all');
      }

    } catch (err) {
      console.error('❌ Dashboard Error:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      const errorMsg = err.response?.data?.message || err.message;
      setError(`Failed to load dashboard data: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Load only assessment history (for filtering/pagination)
  const loadAssessmentHistory = async (page = 1, filter = 'all') => {
    try {
      setHistoryLoading(true);
      const userId = user?.id || user?.leadId || user?.userId;
      
      console.log('📊 Fetching history from:', `/api/assessments/user/${userId}/history`);
      const historyResponse = await api.get(`/api/assessments/user/${userId}/history`, {
        params: { 
          page, 
          limit: 10,
          filter: filter !== 'all' ? filter : undefined
        }
      });
      
      console.log('📊 History response:', historyResponse.data);
      setAssessmentHistory(historyResponse.data.assessments || []);
      setPagination(historyResponse.data.pagination);

    } catch (err) {
      console.error('❌ History Error:', err);
      setError('Failed to load assessment history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load specific assessment details
  const loadAssessmentDetail = async (assessmentId) => {
    try {
      console.log('🔍 Loading assessment details for ID:', assessmentId);
      const response = await api.get(`/api/assessments/${assessmentId}`);
      console.log('📊 Assessment details loaded:', response.data);
      
      if (response.data.success) {
        setSelectedAssessment(response.data.data);
        setShowDetailModal(true);
      } else {
        setError('Failed to load assessment details.');
      }
    } catch (err) {
      console.error('❌ Error loading assessment details:', err);
      console.error('❌ Error response:', err.response?.data);
      setError('Failed to load assessment details: ' + (err.response?.data?.message || err.message));
    }
  };

  // Event handlers
  const handleFilterChange = (newFilter) => {
    setFilterType(newFilter);
    loadAssessmentHistory(1, newFilter);
  };

  const handlePageChange = (page) => {
    loadAssessmentHistory(page, filterType);
  };

  // Utility functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    return 'score-needs-focus';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Focus';
  };

  const getTrendIcon = (trend) => {
    if (trend > 0) return '↑';
    if (trend < 0) return '↓';
    return '→';
  };

  // Load assessment types for filters
  useEffect(() => {
    const fetchAssessmentTypes = async () => {
      try {
        const response = await api.get('/api/questions/assessment-types-config');
        if (response.data && response.data.configs) {
          setAssessmentTypes(response.data.configs);
        }
      } catch (err) {
        console.error('❌ Error fetching assessment types:', err);
      }
    };
    fetchAssessmentTypes();
  }, []);

  useEffect(() => {
    if (user && (user.id || user.leadId || user.userId)) {
      loadDashboardData(false);
    } else {
      console.error('❌ No valid user ID found in user object:', user);
      setError('Invalid user data. Please log in again.');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <i className="fas fa-spinner fa-spin"></i>
          <h2>Loading Dashboard...</h2>
          <p>Please wait while we load your data.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={() => loadDashboardData(false)} className="btn-primary">
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        
        {/* Back to Home Button */}
        <button onClick={() => navigate('/')} className="btn-back-home" style={{ marginBottom: '20px' }}>
          <i className="fas fa-arrow-left"></i> Back to Home
        </button>
        
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="header-text">
              <h1 className="dashboard-title">AI Readiness Dashboard</h1>
              <p className="dashboard-subtitle">Track your progress and view assessment history</p>
            </div>
            <div className="header-actions">
              <button onClick={() => navigate('/')} className="btn-primary">
                <i className="fas fa-plus"></i> New Assessment
              </button>
              <button onClick={handleLogout} className="btn-logout">
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </div>
          
          {/* User Info Banner */}
          <div className="user-info-banner">
            <div className="user-info-item">
              <h3>Welcome back!</h3>
              <p className="user-name">{user.contactName || user.contact_name || user.email}</p>
              <p className="user-company">{user.companyName || user.company_name}</p>
            </div>
            <div className="user-info-item">
              <h4>Industry</h4>
              <p>{user.industry || 'Technology'}</p>
            </div>
            <div className="user-info-item">
              <h4>Member Since</h4>
              <p>{formatDate(user.createdAt || user.created_at || new Date())}</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {dashboardStats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="stat-content">
                <div className="stat-label">Total Assessments</div>
                <div className="stat-value">{dashboardStats.totalAssessments || 0}</div>
                <div className="stat-note">Lifetime completed</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-green">
                <i className="fas fa-target"></i>
              </div>
              <div className="stat-content">
                <div className="stat-label">Average Score</div>
                <div className="stat-value">{Math.round(dashboardStats.averageScore || 0)}%</div>
                <div className="stat-note">Across all assessments</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-yellow">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-content">
                <div className="stat-label">Recent Activity</div>
                <div className="stat-value">
                  {dashboardStats.daysSinceLastAssessment !== null && dashboardStats.daysSinceLastAssessment !== undefined
                    ? dashboardStats.daysSinceLastAssessment === 0 
                      ? 'Today'
                      : `${dashboardStats.daysSinceLastAssessment}d ago`
                    : 'N/A'
                  }
                </div>
                <div className="stat-note">Last assessment</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-blue">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="stat-content">
                <div className="stat-label">Completion Rate</div>
                <div className="stat-value">{dashboardStats.completionRate || 100}%</div>
                <div className="stat-note">All completed</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="dashboard-controls">
          <h3 className="section-title">Assessment History</h3>
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All Assessments
            </button>
            {assessmentTypes.map((type) => (
              <button 
                key={type.type}
                className={`filter-tab ${filterType === type.type ? 'active' : ''}`}
                onClick={() => handleFilterChange(type.type)}
              >
                {type.title || type.type}
              </button>
            ))}
          </div>
        </div>

        {/* Assessment History Table */}
        <div className="assessment-history-section">
          {historyLoading ? (
            <div className="loading-state-mini">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Loading assessments...</p>
            </div>
          ) : assessmentHistory.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-inbox"></i>
              <h3>No Assessments Yet</h3>
              <p>Start your first assessment to track your AI readiness journey.</p>
              <button onClick={() => navigate('/')} className="btn-primary">
                <i className="fas fa-rocket"></i> Start Assessment
              </button>
            </div>
          ) : (
            <>
              <div className="assessment-table-wrapper">
                <table className="assessment-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Industry</th>
                      <th>Score</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessmentHistory.map((assessment) => (
                      <tr key={assessment.id}>
                        <td>
                          <div className="date-cell">
                            <div className="date-primary">{assessment.formatted_date || formatDate(assessment.completed_at)}</div>
                            <div className="date-secondary">{assessment.time_ago}</div>
                          </div>
                        </td>
                        <td>
                          <span className={`type-badge type-${assessment.assessment_type.toLowerCase()}`}>
                            {assessment.assessment_type}
                          </span>
                        </td>
                        <td>{assessment.industry || 'N/A'}</td>
                        <td>
                          <div className="score-cell">
                            <span className={`score-badge ${getScoreColor(assessment.overall_score)}`}>
                              {assessment.overall_score}%
                            </span>
                            <span className="score-label">{getScoreLabel(assessment.overall_score)}</span>
                          </div>
                        </td>
                        <td>
                          <span className="status-badge status-completed">
                            <i className="fas fa-check-circle"></i> Completed
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn-view-details"
                            onClick={() => loadAssessmentDetail(assessment.id)}
                          >
                            <i className="fas fa-eye"></i> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.total_pages > 1 && (
                <div className="pagination">
                  <button 
                    className="pagination-btn"
                    disabled={!pagination.has_prev}
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                  >
                    <i className="fas fa-chevron-left"></i> Previous
                  </button>
                  <span className="pagination-info">
                    Page {pagination.current_page} of {pagination.total_pages}
                  </span>
                  <button 
                    className="pagination-btn"
                    disabled={!pagination.has_next}
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                  >
                    Next <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail Modal - Full Assessment Results */}
        {showDetailModal && selectedAssessment && (
          <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="modal-content modal-results" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h2>Assessment Results</h2>
                  <p className="modal-subtitle">{selectedAssessment.assessment_type} • {selectedAssessment.industry}</p>
                </div>
                <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="modal-body modal-body-results">
                {/* Overall Score */}
                <div className="results-hero">
                  <div className="score-container">
                    <div className="score-label">Your AI Readiness Score</div>
                    <div className={`score-value score-${getScoreColor(selectedAssessment.overall_score)}`}>
                      {Math.round(selectedAssessment.overall_score)}%
                    </div>
                    <div className="score-category">
                      {selectedAssessment.insights?.score_category || getScoreLabel(selectedAssessment.overall_score)}
                    </div>
                  </div>
                </div>

                {/* Pillar Scores */}
                {selectedAssessment.dimension_scores && selectedAssessment.dimension_scores.length > 0 && (
                  <div className="pillars-section">
                    <h3>Pillar Breakdown</h3>
                    <div className="pillars-grid">
                      {selectedAssessment.dimension_scores.map((pillar, index) => (
                        <div key={index} className="pillar-card">
                          <div className="pillar-header">
                            <div className="pillar-name">{pillar.pillar_name || pillar.dimension_name}</div>
                            <div className={`pillar-score score-${getScoreColor(pillar.score)}`}>
                              {Math.round(pillar.score)}%
                            </div>
                          </div>
                          <div className="pillar-bar">
                            <div 
                              className={`pillar-bar-fill fill-${getScoreColor(pillar.score)}`}
                              style={{ width: `${pillar.score}%` }}
                            ></div>
                          </div>
                          <div className="pillar-label">{getScoreLabel(pillar.score)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assessment Info */}
                <div className="assessment-meta">
                  <div className="meta-grid">
                    <div className="meta-item">
                      <i className="fas fa-calendar"></i>
                      <div>
                        <div className="meta-label">Completed</div>
                        <div className="meta-value">{formatDate(selectedAssessment.completed_at)}</div>
                      </div>
                    </div>
                    <div className="meta-item">
                      <i className="fas fa-chart-line"></i>
                      <div>
                        <div className="meta-label">Assessment Type</div>
                        <div className="meta-value">{selectedAssessment.assessment_type}</div>
                      </div>
                    </div>
                    <div className="meta-item">
                      <i className="fas fa-industry"></i>
                      <div>
                        <div className="meta-label">Industry</div>
                        <div className="meta-value">{selectedAssessment.industry}</div>
                      </div>
                    </div>
                    {selectedAssessment.responses && (
                      <div className="meta-item">
                        <i className="fas fa-check-circle"></i>
                        <div>
                          <div className="meta-label">Questions</div>
                          <div className="meta-value">{Object.keys(selectedAssessment.responses).length} answered</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Insights */}
                {selectedAssessment.insights && (
                  <div className="insights-section">
                    <h3>Key Insights</h3>
                    <div className="insights-grid">
                      <div className="insight-card">
                        <div className="insight-icon">
                          <i className="fas fa-trophy"></i>
                        </div>
                        <div className="insight-content">
                          <div className="insight-title">Maturity Level</div>
                          <div className="insight-value">{selectedAssessment.insights.score_category || 'N/A'}</div>
                        </div>
                      </div>
                      {selectedAssessment.insights.completion_time_ms && (
                        <div className="insight-card">
                          <div className="insight-icon">
                            <i className="fas fa-clock"></i>
                          </div>
                          <div className="insight-content">
                            <div className="insight-title">Time to Complete</div>
                            <div className="insight-value">
                              {Math.round(selectedAssessment.insights.completion_time_ms / 60000)} min
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Gap Analysis - Areas to Improve */}
                {selectedAssessment.insights?.gap_analysis && selectedAssessment.insights.gap_analysis.length > 0 && (
                  <div className="gaps-section">
                    <div className="section-header">
                      <h3><i className="fas fa-exclamation-triangle"></i> Areas for Improvement</h3>
                    </div>
                    <div className="gaps-grid">
                      {selectedAssessment.insights.gap_analysis.map((gap, index) => (
                        <div key={index} className="gap-card">
                          <div className="gap-header">
                            <h4>{gap.area || gap.dimension}</h4>
                            <span className={`gap-badge gap-${gap.severity?.toLowerCase() || 'medium'}`}>
                              {gap.severity || 'Medium'} Priority
                            </span>
                          </div>
                          <p className="gap-description">
                            {gap.description || gap.recommendation}
                          </p>
                          {gap.current_state && (
                            <div className="gap-detail">
                              <strong>Current:</strong> {gap.current_state}
                            </div>
                          )}
                          {gap.target_state && (
                            <div className="gap-detail">
                              <strong>Target:</strong> {gap.target_state}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Recommendations */}
                {selectedAssessment.insights?.service_recommendations && selectedAssessment.insights.service_recommendations.length > 0 ? (
                  <div className="recommendations-section">
                    <div className="section-header">
                      <h3><i className="fas fa-lightbulb"></i> Recommended Services & Solutions</h3>
                    </div>
                    <div className="services-grid">
                      {selectedAssessment.insights.service_recommendations.map((service, index) => (
                        <div key={index} className={`service-card service-${service.priority?.toLowerCase() || 'medium'}`}>
                          <div className="service-icon">
                            <i className={service.icon || 'fas fa-cog'}></i>
                          </div>
                          <div className="service-content">
                            <h4 className="service-title">{service.service_name || service.name}</h4>
                            {service.relevance_score && (
                              <span className="service-badge">
                                <i className="fas fa-star"></i>
                                {service.relevance_score}% match
                              </span>
                            )}
                            <p className="service-description">
                              {service.description || service.recommendation}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="recommendations-section">
                    <div className="section-header">
                      <h3><i className="fas fa-lightbulb"></i> Recommended Services & Solutions</h3>
                    </div>
                    <div className="services-grid">
                      <div className="service-card service-high">
                        <div className="service-icon">
                          <i className="fas fa-lightbulb"></i>
                        </div>
                        <div className="service-content">
                          <h4 className="service-title">AI Strategy & Roadmap Development</h4>
                          <span className="service-badge">
                            <i className="fas fa-star"></i>
                            Recommended for scores below 60%
                          </span>
                          <p className="service-description">
                            Develop a comprehensive AI strategy aligned with business objectives and create a prioritized implementation roadmap.
                          </p>
                        </div>
                      </div>

                      <div className="service-card service-high">
                        <div className="service-icon">
                          <i className="fas fa-database"></i>
                        </div>
                        <div className="service-content">
                          <h4 className="service-title">Data Foundation & Governance</h4>
                          <span className="service-badge">
                            <i className="fas fa-star"></i>
                            Essential for AI success
                          </span>
                          <p className="service-description">
                            Establish robust data governance frameworks and improve data quality to support AI initiatives.
                          </p>
                        </div>
                      </div>

                      <div className="service-card service-medium">
                        <div className="service-icon">
                          <i className="fas fa-users"></i>
                        </div>
                        <div className="service-content">
                          <h4 className="service-title">AI Talent & Capability Building</h4>
                          <span className="service-badge">
                            <i className="fas fa-check-circle"></i>
                            Long-term competitive advantage
                          </span>
                          <p className="service-description">
                            Build internal AI capabilities through training programs and strategic hiring recommendations.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button className="btn-primary" onClick={() => window.open('mailto:contact@forvismazars.com?subject=AI Strategy Consultation Request', '_blank')}>
                  <i className="fas fa-calendar-alt"></i> Book Free Consultation
                </button>
                <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>
                  <i className="fas fa-times"></i> Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}



export default UserDashboard;
