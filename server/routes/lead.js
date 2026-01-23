import { Router } from 'express';
import Lead from '../models/Lead.js';
import UserActivity from '../models/UserActivity.js';
import database from '../config/database.js';
import { validateLeadForm, validateLeadLogin } from '../middleware/validation.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService.js';
import rateLimit from 'express-rate-limit';
import logger from '../utils/logger.js';
import { doubleCsrfProtection } from '../middleware/csrf.js';

// Rate limiter for password reset (3 attempts per hour)
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many password reset attempts from this IP. Please try again in 1 hour.'
    });
  }
});

const leadRouter = Router();

// Test endpoint
leadRouter.get('/test', (req, res) => {
  logger.info('Lead router test endpoint accessed');
  res.json({ success: true, message: 'Lead router is working!' });
});

// Create a new lead
leadRouter.post('/create', async (req, res) => {
  logger.info('Lead creation request received', { email: req.body.email, company: req.body.companyName });
  
  try {
    const {
      contactName,
      jobTitle,
      email,
      phoneNumber,
      companyName,
      companySize,
      country,
      industry,
      password
    } = req.body;

    // Basic validation
    if (!contactName || !email || !companyName || !password) {
      logger.warn('Lead creation missing required fields', { hasName: !!contactName, hasEmail: !!email, hasCompany: !!companyName, hasPassword: !!password });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: contactName, email, companyName, password'
      });
    }

    logger.info('Creating new lead', { contactName, email, companyName });

    // Use updateOrCreate to handle duplicate emails
    const result = await Lead.updateOrCreate({
      contactName,
      jobTitle,
      email,
      phoneNumber,
      companyName,
      companySize,
      country,
      industry,
      password
    });

    
    logger.info('Lead operation completed', { success: result.success, isNew: result.isNew, leadId: result.leadId });
    
    if (result.success) {
      // Send welcome email for new accounts
      if (result.isNew) {
        try {
          await sendWelcomeEmail({
            contact_name: contactName,
            email: email,
            company_name: companyName
          });
          logger.info('Welcome email sent', { email });
        } catch (emailError) {
          logger.warn('Welcome email failed (non-critical)', { error: emailError.message });
        }
      }
      
      return res.status(200).json({
        success: true,
        leadId: result.leadId,
        isNew: result.isNew,
        message: `Lead ${result.isNew ? 'created' : 'updated'} successfully`
      });
    } else {
      logger.error('Lead creation failed', { error: result.error });
      return res.status(500).json({
        success: false,
        message: 'Failed to create lead',
        error: result.error
      });
    }

  } catch (error) {
    logger.error('Error in lead creation', { message: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get all leads
leadRouter.get('/', async (req, res) => {
  try {
    const leads = await Lead.getAll();
    logger.info('Retrieved leads', { count: leads.length });

    const transformedLeads = leads.map(lead => ({
      id: lead.id.toString(),
      contactName: lead.contact_name,
      jobTitle: lead.job_title,
      email: lead.email,
      phoneNumber: lead.phone_number,
      companyName: lead.company_name,
      companySize: lead.company_size,
      country: lead.country,
      industry: lead.industry,
      leadSource: lead.lead_source,
      createdAt: lead.created_at
    }));

    res.json({
      success: true,
      data: transformedLeads
    });
  } catch (error) {
    logger.error('Error fetching leads', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads',
      error: error.message
    });
  }
});

// Submit assessment (simplified for correct schema)
leadRouter.post('/submit-assessment', async (req, res) => {
  try {
    logger.info('Assessment submission received', { leadId: req.body.leadId });
    
    const {
      lead_id,
      assessment_type,
      industry,
      overall_score,
      responses,
      pillar_scores,
      risk_assessment,
      service_recommendations,
      gap_analysis,
      completion_time_ms,
      metadata
    } = req.body;

    // Validate required fields
    if (!lead_id || !assessment_type || overall_score === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: lead_id, assessment_type, or overall_score'
      });
    }

    // Verify lead exists in leads table
    const leadExists = await Lead.getById(lead_id);
    if (!leadExists) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    logger.info('Lead verified', { contactName: leadExists.contact_name });

    // Prepare data for insertion
    const dimension_scores = JSON.stringify(pillar_scores || []);
    const responses_json = JSON.stringify(responses || {});
    const insights_json = JSON.stringify({
      score_category: overall_score >= 80 ? 'AI Leader' : 
                     overall_score >= 60 ? 'AI Adopter' : 
                     overall_score >= 40 ? 'AI Explorer' : 'AI Starter',
      completion_date: new Date().toISOString(),
      total_score: overall_score,
      completion_time_ms: completion_time_ms || 0,
      risk_assessment: risk_assessment || [],
      service_recommendations: service_recommendations || [],
      gap_analysis: gap_analysis || [],
      metadata: metadata || {}
    });

    // Insert assessment using parameterized query for security
    const insertQuery = `
      INSERT INTO assessments (
        lead_id, assessment_type, industry, overall_score, 
        dimension_scores, responses, insights, completed_at, created_at
      )
      OUTPUT INSERTED.id
      VALUES (?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
    `;
    
    const result = await database.query(insertQuery, [
      parseInt(lead_id),
      assessment_type.toUpperCase(),
      industry || leadExists.industry || 'Unknown',
      parseFloat(overall_score),
      dimension_scores,
      responses_json,
      insights_json
    ]);
    
    const assessmentId = result.recordset[0].id;
    
    logger.info('Assessment saved', { assessmentId });

    // Send email with assessment results
    try {
      const emailResult = await sendAssessmentResults(leadExists, {
        overall_score: parseFloat(overall_score),
        dimension_scores: pillar_scores || [],
        insights: JSON.parse(insights_json),
        assessment_type: assessment_type.toUpperCase(),
        completed_at: new Date()
      });
      
      if (emailResult.success) {
        logger.info('Assessment results email sent', { email: leadExists.email });
      } else {
        logger.warn('Email send failed (non-critical)', { error: emailResult.error });
      }
    } catch (emailError) {
      logger.warn('Email service error (continuing)', { error: emailError.message });
    }

    res.json({
      success: true,
      assessment_id: assessmentId,
      dimension_scores: pillar_scores || [],
      insights: JSON.parse(insights_json),
      message: 'Assessment submitted successfully'
    });

  } catch (error) {
    logger.error('Error submitting assessment', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      message: 'Failed to submit assessment',
      error: error.message
    });
  }
});

// Login endpoint to find user by email
leadRouter.post('/login', validateLeadLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.info('Login attempt', { email });

    // Verify password and get user
    const verifyResult = await Lead.verifyPassword(email, password);
    
    if (!verifyResult.success) {
      const statusCode = verifyResult.locked ? 423 : 401;
      return res.status(statusCode).json({
        success: false,
        message: verifyResult.message,
        attemptsRemaining: verifyResult.attemptsRemaining
      });
    }

    const user = verifyResult.lead;
    logger.info('Login successful', { contactName: user.contact_name });

    // Log user activity
    await UserActivity.log(
      user.id,
      'LOGIN',
      'user',
      user.id,
      `${user.contact_name} logged in`,
      req.ip || req.connection.remoteAddress,
      req.headers['user-agent']
    );

    // Get all assessments for this user
    const assessmentsQuery = `
      SELECT * FROM assessments 
      WHERE lead_id = ? 
      ORDER BY completed_at DESC
    `;
    
    const result = await database.query(assessmentsQuery, [user.id]);
    const assessments = result.recordset || [];
    
    logger.info('Assessments retrieved for user', { count: assessments.length });

    // Transform assessment data
    const transformedAssessments = assessments.map(assessment => ({
      id: assessment.id,
      assessment_type: assessment.assessment_type,
      industry: assessment.industry,
      overall_score: parseFloat(assessment.overall_score),
      dimension_scores: assessment.dimension_scores ? JSON.parse(assessment.dimension_scores) : [],
      responses: assessment.responses ? JSON.parse(assessment.responses) : {},
      insights: assessment.insights ? JSON.parse(assessment.insights) : {},
      completed_at: assessment.completed_at,
      created_at: assessment.created_at
    }));

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        contact_name: user.contact_name,
        company_name: user.company_name,
        job_title: user.job_title,
        industry: user.industry,
        company_size: user.company_size,
        country: user.country
      },
      assessments: transformedAssessments,
      message: `Welcome back, ${user.contact_name}!`
    });

  } catch (error) {
    logger.error('Error during login', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to log in',
      error: error.message
    });
  }
});

// Get lead by ID
leadRouter.get('/:leadId', async (req, res) => {
  try {
    const { leadId } = req.params;
    const lead = await Lead.getById(leadId);

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: lead.id,
        contactName: lead.contact_name,
        jobTitle: lead.job_title,
        email: lead.email,
        phoneNumber: lead.phone_number,
        companyName: lead.company_name,
        companySize: lead.company_size,
        country: lead.country,
        industry: lead.industry,
        leadSource: lead.lead_source,
        createdAt: lead.created_at,
        updatedAt: lead.updated_at
      }
    });

  } catch (error) {
    logger.error('Error fetching lead', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead',
      error: error.message
    });
  }
});

// Request password reset
leadRouter.post('/forgot-password', resetLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    logger.info('Password reset requested', { email });

    // Generate reset token
    const result = await Lead.createPasswordResetToken(email);

    // Always return success to prevent email enumeration
    if (!result.success) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Send reset email
    try {
      await sendPasswordResetEmail({
        contact_name: result.lead.contact_name,
        email: result.lead.email,
        company_name: result.lead.company_name,
        resetToken: result.resetToken
      });
      logger.info('Password reset email sent', { email });
    } catch (emailError) {
      logger.error('Failed to send reset email', { error: emailError.message });
      // Still return success to prevent enumeration
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    });

  } catch (error) {
    logger.error('Error in forgot-password', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      error: error.message
    });
  }
});

// Reset password with token
leadRouter.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    logger.info('Password reset attempt with token');

    // Reset password
    const result = await Lead.resetPassword(token, newPassword);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Invalid or expired reset token'
      });
    }

    logger.info('Password reset successful', { email: result.email });

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    logger.error('Error in reset-password', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
});

// Verify reset token (optional - for UI validation)
leadRouter.post('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    const result = await Lead.verifyResetToken(token);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Invalid or expired token'
      });
    }

    res.json({
      success: true,
      email: result.email,
      message: 'Token is valid'
    });

  } catch (error) {
    console.error('❌ Error verifying token:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify token'
    });
  }
});

export default leadRouter;