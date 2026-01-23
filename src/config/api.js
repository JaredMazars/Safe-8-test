export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 10000,
  endpoints: {
    // Lead/User
    createLead: '/api/lead',
    login: '/api/lead/login',
    
    // Questions
    getQuestions: '/api/questions/questions',
    
    // Responses
    saveResponse: '/api/assessment-response/response',
    getScore: '/api/assessment-response/score',
    
    // Assessments
    submitAssessment: '/api/assessments/submit-complete',
    getAssessment: '/api/assessments',
    
    // User Dashboard
    getUserDashboard: '/api/user-engagement/dashboard',
    
    // Admin
    adminLogin: '/api/admin/login',
    adminDashboard: '/api/admin/dashboard',
    adminUsers: '/api/admin/users',
    adminQuestions: '/api/admin/questions'
  }
};

export const INDUSTRIES = [
  'Financial Services',
  'Technology',
  'Healthcare',
  'Manufacturing',
  'Retail & E-commerce',
  'Energy & Utilities',
  'Government',
  'Education',
  'Professional Services',
  'Other'
];

export const COMPANY_SIZES = [
  '1-50 employees',
  '51-200 employees',
  '201-1,000 employees',
  '1,001-10,000 employees',
  '10,000+ employees'
];

export const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'Netherlands',
  'Spain',
  'Italy',
  'Sweden',
  'Norway',
  'Denmark',
  'Finland',
  'Switzerland',
  'Ireland',
  'Belgium',
  'Austria',
  'Singapore',
  'Japan',
  'Other'
];
