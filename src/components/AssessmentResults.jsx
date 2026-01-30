import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const AssessmentResults = ({ 
  results, 
  assessmentType, 
  industry,
  userId,
  userData,
  onRestart
}) => {
  const navigate = useNavigate();
  const [dimensionScores, setDimensionScores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { score } = results || { score: 0 };

  // Load dimension scores from assessment results
  useEffect(() => {
    const loadDimensionScores = async () => {
      try {
        setIsLoading(true);
        
        // Try to get dimension scores from backend
        if (userId && assessmentType) {
          try {
            const response = await api.get(`/api/assessment/current/${userId}/${assessmentType}`);
            
            if (response.data.success && response.data.dimension_scores) {
              setDimensionScores(response.data.dimension_scores);
            } else {
              // Generate simulated dimension scores based on overall score
              generateSimulatedScores();
            }
          } catch (apiError) {
            console.log('API not available, using simulated scores');
            generateSimulatedScores();
          }
        } else {
          generateSimulatedScores();
        }
      } catch (error) {
        console.error('Error loading dimension scores:', error);
        generateSimulatedScores();
      } finally {
        setIsLoading(false);
      }
    };

    const generateSimulatedScores = () => {
      const pillars = [
        'Strategy', 'Architecture', 'Foundation', 'Ethics',
        'Culture', 'Capability', 'Governance', 'Performance'
      ];
      
      const simulatedScores = pillars.map((pillar, index) => ({
        pillar_name: pillar,
        dimension_name: pillar,
        score: Math.max(0, Math.min(100, score + (Math.random() * 20 - 10)))
      }));
      
      setDimensionScores(simulatedScores);
    };

    loadDimensionScores();
  }, [userId, assessmentType, score]);

  // Create radar chart data
  const createRadarChartData = () => {
    const labels = dimensionScores.map(dim => dim.pillar_name || dim.dimension_name);
    const userScores = dimensionScores.map(dim => Math.round(dim.score));
    
    // Hardcoded benchmark values
    const avgScore = 60;
    const bestScore = 80;
    
    const bestPractice = labels.map(() => bestScore);
    const industryAverage = labels.map(() => avgScore);

    return {
      labels: labels,
      datasets: [
        {
          label: 'Your Score',
          data: userScores,
          borderColor: '#0066cc',
          backgroundColor: 'rgba(0, 102, 204, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: '#0066cc',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
        },
        {
          label: 'Industry Best Practice',
          data: bestPractice,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.05)',
          borderWidth: 2,
          pointBackgroundColor: '#22c55e',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
        },
        {
          label: 'Industry Average',
          data: industryAverage,
          borderColor: '#6b7280',
          backgroundColor: 'rgba(107, 114, 128, 0.05)',
          borderWidth: 2,
          pointBackgroundColor: '#6b7280',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 3,
        },
      ],
    };
  };

  // Generate gap analysis
  const generateGapAnalysis = () => {
    const gaps = [];
    const bestScore = 80;
    
    dimensionScores.forEach((dimension) => {
      const gap = bestScore - Math.round(dimension.score);
      if (gap > 0) {
        let severity, priority;
        
        if (gap >= 40) {
          severity = "Critical";
          priority = "high";
        } else if (gap >= 20) {
          severity = "High";
          priority = "medium";
        } else {
          severity = "Moderate";
          priority = "low";
        }
        
        gaps.push({
          pillar: dimension.pillar_name,
          score: Math.round(dimension.score),
          gap,
          severity,
          priority
        });
      }
    });
    
    return gaps.sort((a, b) => b.gap - a.gap);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        min: 0,
        max: 100,
        beginAtZero: true,
        ticks: {
          stepSize: 20,
          font: {
            size: 11,
            family: 'inherit'
          },
          color: '#4a4a4a'
        },
        grid: {
          color: '#e5e7eb',
        },
        angleLines: {
          color: '#e5e7eb',
        },
        pointLabels: {
          font: {
            size: 12,
            weight: 'bold',
            family: 'inherit'
          },
          color: '#003087',
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 13,
            family: 'inherit'
          },
          usePointStyle: true,
          pointStyle: 'circle'
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#003087',
        bodyColor: '#4a4a4a',
        borderColor: '#0066cc',
        borderWidth: 2,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.r}%`;
          },
        },
      },
    },
  };

  const getOverallStatus = () => {
    if (score >= 80) return { 
      status: 'AI Leader - Excellent readiness across all dimensions', 
      level: 'excellent' 
    };
    if (score >= 60) return { 
      status: 'AI Adopter - Good foundation with opportunities for improvement', 
      level: 'good' 
    };
    if (score >= 40) return { 
      status: 'AI Explorer - Building capabilities with significant gaps to address', 
      level: 'developing' 
    };
    return { 
      status: 'AI Starter - Early stage with substantial development needed', 
      level: 'emerging' 
    };
  };

  const getBenchmarkComparison = () => {
    return 'Industry benchmark data will be available soon';
  };

  const overallStatus = getOverallStatus();
  const benchmarkComparison = getBenchmarkComparison();
  const gaps = dimensionScores.length > 0 ? generateGapAnalysis() : [];

  if (isLoading) {
    return (
      <div className="results-container">
        <div className="results-wrapper">
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <h2>Analyzing Results...</h2>
            <p>Please wait while we prepare your assessment report.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="results-container">
      <div className="results-wrapper">
        {/* Header */}
        <div className="results-header">
          <h1 className="results-title">Your AI Readiness Results</h1>
          <p className="results-subtitle">SAFE-8 AI Readiness Assessment</p>
          <div className="results-meta">
            <div className="meta-item">
              <i className="fas fa-industry"></i>
              <span className="meta-label">Industry:</span>
              <span className="meta-value">{industry || 'Technology'}</span>
            </div>
            <div className="meta-item">
              <i className="fas fa-layer-group"></i>
              <span className="meta-label">Level:</span>
              <span className="meta-value">{assessmentType?.charAt(0).toUpperCase() + assessmentType?.slice(1)}</span>
            </div>
          </div>
        </div>

        {/* Overall Score */}
        <div className="score-card">
          <div className="score-card-inner">
            <h3 className="score-card-title">Overall AI Readiness Score</h3>
            <div className="score-display-large">{score}%</div>
            <div className={`status-badge status-${overallStatus.level}`}>
              {overallStatus.status}
            </div>
            <div className="benchmark-text">{benchmarkComparison}</div>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="chart-section">
          <div className="section-header">
            <div className="header-accent"></div>
            <h3 className="section-title">SAFE-8 Readiness Radar vs Industry Best Practice</h3>
          </div>
          
          <div className="chart-container">
            <div className="chart-wrapper">
              <Radar data={createRadarChartData()} options={chartOptions} />
            </div>
          </div>

          {/* Pillar Breakdown */}
          <div className="pillars-breakdown">
            <h4 className="breakdown-title">
              <i className="fas fa-chart-bar"></i>
              Pillar Performance Breakdown
            </h4>
            
            <div className="pillars-grid">
              {dimensionScores.map((dimension, index) => {
                const dimScore = Math.round(dimension.score);
                const getStatusClass = (score) => {
                  if (score >= 80) return 'pillar-excellent';
                  if (score >= 60) return 'pillar-good';
                  return 'pillar-needs-work';
                };

                return (
                  <div key={index} className={`pillar-item ${getStatusClass(dimScore)}`}>
                    <div className="pillar-header">
                      <span className="pillar-name">{dimension.pillar_name}</span>
                      <span className="pillar-score">{dimScore}%</span>
                    </div>
                    <div className="pillar-bar">
                      <div className="pillar-bar-fill" style={{ width: `${dimScore}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Stats */}
            <div className="summary-stats">
              <div className="stat-box stat-excellent">
                <div className="stat-number">
                  {dimensionScores.filter(d => d.score >= 80).length}
                </div>
                <div className="stat-label">Excellent</div>
              </div>
              <div className="stat-box stat-good">
                <div className="stat-number">
                  {dimensionScores.filter(d => d.score >= 60 && d.score < 80).length}
                </div>
                <div className="stat-label">Good</div>
              </div>
              <div className="stat-box stat-focus">
                <div className="stat-number">
                  {dimensionScores.filter(d => d.score < 60).length}
                </div>
                <div className="stat-label">Focus Areas</div>
              </div>
            </div>
          </div>
        </div>

        {/* Gap Analysis */}
        <div className="analysis-section">
          <div className="section-header">
            <div className="header-accent"></div>
            <h3 className="section-title">Critical Gap Analysis</h3>
          </div>
          
          <div className="gaps-grid">
            {gaps.length > 0 ? (
              gaps.map((gap, index) => (
                <div key={index} className={`gap-item gap-${gap.priority}`}>
                  <div className="gap-content">
                    <div className="gap-icon">
                      <i className={`fas ${gap.priority === 'high' ? 'fa-exclamation-circle' : gap.priority === 'medium' ? 'fa-exclamation-triangle' : 'fa-info-circle'}`}></i>
                    </div>
                    <div className="gap-details">
                      <h4 className="gap-pillar">{gap.pillar}</h4>
                      <p className="gap-info">
                        Current: {gap.score}% | Best Practice: 80% | Gap: {gap.gap} points
                      </p>
                      <span className="gap-badge">{gap.severity} Priority</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-gaps">No significant gaps identified. You're performing at or above best practice levels!</p>
            )}
          </div>
        </div>

        {/* Service Recommendations */}
        <div className="recommendations-section">
          <div className="section-header">
            <div className="header-accent"></div>
            <h3 className="section-title">Recommended Services & Solutions</h3>
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

        {/* CTA Section */}
        <div className="cta-section">
          <h3 className="cta-title">Ready to Transform Your AI Strategy?</h3>
          <p className="cta-description">
            Get personalized recommendations and strategic guidance from our Digital Advisory 2.0 experts.
          </p>
          <button 
            className="btn-cta"
            onClick={() => window.open('mailto:contact@forvismazars.com?subject=AI Strategy Consultation Request', '_blank')}
          >
            <i className="fas fa-calendar-alt"></i>
            Book Your Free 30-Minute Strategy Session
          </button>
          <p className="cta-note">
            <i className="fas fa-check-circle"></i>
            No obligation • Expert insights • Tailored action plan
          </p>
        </div>

        {/* Actions */}
        <div className="results-actions">
          {userData && (
            <button className="btn-primary" onClick={() => navigate('/dashboard')} style={{marginRight: '1rem'}}>
              <i className="fas fa-tachometer-alt"></i>
              View Dashboard
            </button>
          )}
          <button className="btn-restart" onClick={() => {
            onRestart();
            navigate('/');
          }}>
            <i className="fas fa-redo"></i>
            Take Another Assessment
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentResults;
