import express from 'express';
import Admin from '../models/Admin.js';
import Assessment from '../models/Assessment.js';
import Lead from '../models/Lead.js';
import database from '../config/database.js';
import { validateAdminLogin, validatePasswordChange, validateId, validatePagination } from '../middleware/validation.js';
import { doubleCsrfProtection } from '../middleware/csrf.js';

const router = express.Router();

// Middleware to verify admin authentication
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    const session = await Admin.verifySession(token);
    
    if (!session.success) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    req.admin = session.admin;
    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Middleware to check if admin is super admin
const requireSuperAdmin = (req, res, next) => {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Super admin access required'
    });
  }
  next();
};

// ======================
// ADMIN AUTHENTICATION
// ======================

// Admin login (NO CSRF - allow login without token)
router.post('/login', validateAdminLogin, async (req, res) => {
  try {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    console.log('🔐 Admin login attempt:', username);

    const result = await Admin.authenticate(username, password, ipAddress, userAgent);

    if (result.success) {
      console.log('✅ Admin logged in:', result.admin.username);
      res.json(result);
    } else {
      console.log('❌ Login failed:', result.message);
      res.status(401).json(result);
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login error'
    });
  }
});

// Admin logout (CSRF protected)
router.post('/logout', doubleCsrfProtection, authenticateAdmin, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    await Admin.logout(token);
    
    console.log('✅ Admin logged out:', req.admin.username);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout error'
    });
  }
});

// Verify session (for frontend to check if still authenticated)
router.get('/verify', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    admin: req.admin
  });
});

// Change password
// Change password (CSRF protected)
router.post('/change-password', doubleCsrfProtection, authenticateAdmin, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Old and new passwords are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters'
      });
    }

    const result = await Admin.changePassword(req.admin.id, oldPassword, newPassword);
    
    if (result.success) {
      await Admin.logActivity(req.admin.id, 'UPDATE', 'admin', req.admin.id, 'Password changed', req.ip, req.headers['user-agent']);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
});

// ======================
// ADMIN DASHBOARD
// ======================

// Get dashboard statistics
router.get('/dashboard/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await Admin.getDashboardStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('❌ Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
});

// ======================
// USER MANAGEMENT
// ======================

// Get all users
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, industry } = req.query;
    const offset = (page - 1) * limit;

    // Build query without parameters for SQL Server compatibility
    let whereConditions = [];

    if (search) {
      const escapedSearch = search.replace(/'/g, "''");
      whereConditions.push(`(contact_name LIKE '%${escapedSearch}%' OR email LIKE '%${escapedSearch}%' OR company_name LIKE '%${escapedSearch}%')`);
    }

    if (industry) {
      const escapedIndustry = industry.replace(/'/g, "''");
      whereConditions.push(`industry = '${escapedIndustry}'`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM leads ${whereClause}`;
    const countResult = await database.query(countSql);
    const total = Array.isArray(countResult) ? countResult[0].total : countResult.recordset[0].total;

    // Query leads with assessment count using correct column names (lead_id not lead_user_id)
    const sql = `
      SELECT 
        l.id,
        l.contact_name as full_name,
        l.email,
        l.company_name,
        l.industry,
        l.job_title as position,
        l.phone_number,
        l.created_at as registered_at,
        l.last_login_at,
        COUNT(a.id) as total_assessments,
        AVG(a.overall_score) as avg_score,
        MAX(a.completed_at) as last_assessment_date
      FROM leads l
      LEFT JOIN assessments a ON l.id = a.lead_id
      ${whereClause}
      GROUP BY l.id, l.contact_name, l.email, l.company_name, l.industry, l.job_title, l.phone_number, l.created_at, l.last_login_at
      ORDER BY l.created_at DESC
      OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY;
    `;

    const result = await database.query(sql);
    const users = Array.isArray(result) ? result : result.recordset;

    await Admin.logActivity(req.admin.id, 'VIEW', 'users', null, 'Viewed user list', req.ip, req.headers['user-agent']);

    res.json({
      success: true,
      users: users,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit),
        has_prev: page > 1,
        has_next: page < Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// Get user by ID with full details
router.get('/users/:userId', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user details
    const user = await Lead.getById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's assessments
    const assessments = await Assessment.getByUserId(userId);

    await Admin.logActivity(req.admin.id, 'VIEW', 'user', userId, `Viewed user profile: ${user.email}`, req.ip, req.headers['user-agent']);

    res.json({
      success: true,
      user: {
        ...user,
        password_hash: undefined // Don't send password hash
      },
      assessments
    });
  } catch (error) {
    console.error('❌ Error getting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details'
    });
  }
});

// Get user's assessment responses
router.get('/users/:userId/responses/:assessmentType', authenticateAdmin, async (req, res) => {
  try {
    const { userId, assessmentType } = req.params;

    const sql = `
      SELECT ar.*, aq.question_text, aq.pillar_name, aq.question_order
      FROM assessment_responses ar
      INNER JOIN assessment_questions aq ON ar.question_id = aq.id
      WHERE ar.lead_user_id = ? AND aq.assessment_type = ?
      ORDER BY aq.pillar_name, aq.question_order;
    `;

    const result = await database.query(sql, [userId, assessmentType.toUpperCase()]);

    res.json({
      success: true,
      responses: result.recordset
    });
  } catch (error) {
    console.error('❌ Error getting user responses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user responses'
    });
  }
});

// ======================
// QUESTION MANAGEMENT
// ======================

// Get all questions
router.get('/questions', authenticateAdmin, async (req, res) => {
  try {
    const { assessment_type, pillar_name, is_active, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereConditions = [];

    if (assessment_type && assessment_type !== 'all') {
      const escapedType = assessment_type.toUpperCase().replace(/'/g, "''");
      whereConditions.push(`assessment_type = '${escapedType}'`);
    }

    if (pillar_name && pillar_name !== 'all') {
      const escapedPillar = pillar_name.replace(/'/g, "''");
      whereConditions.push(`pillar_name = '${escapedPillar}'`);
    }

    if (is_active !== undefined && is_active !== null && is_active !== '') {
      whereConditions.push(`is_active = ${is_active === 'true' || is_active === '1' ? 1 : 0}`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM assessment_questions ${whereClause}`;
    const countResult = await database.query(countSql);
    const total = Array.isArray(countResult) ? countResult[0].total : countResult.recordset[0].total;

    const sql = `
      SELECT * FROM assessment_questions
      ${whereClause}
      ORDER BY assessment_type, pillar_name, question_order
      OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY
    `;

    const result = await database.query(sql);
    const questions = Array.isArray(result) ? result : result.recordset;

    console.log(`✅ Loaded ${questions.length} questions (Total: ${total})`);

    res.json({
      success: true,
      questions: questions,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_items: total,
        items_per_page: parseInt(limit),
        has_prev: parseInt(page) > 1,
        has_next: parseInt(page) < Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error getting questions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching questions'
    });
  }
});

// Get question by ID
router.get('/questions/:questionId', authenticateAdmin, async (req, res) => {
  try {
    const { questionId } = req.params;

    const sql = `SELECT * FROM assessment_questions WHERE id = ?`;
    const result = await database.query(sql, [questionId]);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      question: result.recordset[0]
    });
  } catch (error) {
    console.error('❌ Error getting question:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching question'
    });
  }
});

// Create new question (CSRF protected)
router.post('/questions', doubleCsrfProtection, authenticateAdmin, async (req, res) => {
  try {
    const {
      assessment_type,
      pillar_name,
      pillar_short_name,
      question_text,
      question_order
    } = req.body;

    if (!assessment_type || !pillar_name || !pillar_short_name || !question_text) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const sql = `
      INSERT INTO assessment_questions (
        assessment_type, pillar_name, pillar_short_name, question_text, question_order, created_by, is_active
      )
      OUTPUT INSERTED.id
      VALUES (?, ?, ?, ?, ?, ?, 1);
    `;

    const result = await database.query(sql, [
      assessment_type.toUpperCase(),
      pillar_name,
      pillar_short_name,
      question_text,
      question_order || 999,
      req.admin.id
    ]);

    const questionId = result.recordset[0].id;

    await Admin.logActivity(req.admin.id, 'CREATE', 'question', questionId, `Created question: ${question_text.substring(0, 50)}...`, req.ip, req.headers['user-agent']);

    console.log('✅ Question created:', questionId);

    res.json({
      success: true,
      questionId,
      message: 'Question created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating question:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating question',
      error: error.message
    });
  }
});

// Update question (CSRF protected)
router.put('/questions/:questionId', doubleCsrfProtection, authenticateAdmin, async (req, res) => {
  try {
    const { questionId } = req.params;
    const {
      assessment_type,
      pillar_name,
      pillar_short_name,
      question_text,
      question_order,
      is_active
    } = req.body;

    const updates = [];
    const params = [];

    if (assessment_type) {
      updates.push('assessment_type = ?');
      params.push(assessment_type.toUpperCase());
    }

    if (pillar_name) {
      updates.push('pillar_name = ?');
      params.push(pillar_name);
    }

    if (pillar_short_name) {
      updates.push('pillar_short_name = ?');
      params.push(pillar_short_name);
    }

    if (question_text) {
      updates.push('question_text = ?');
      params.push(question_text);
    }

    if (question_order !== undefined) {
      updates.push('question_order = ?');
      params.push(question_order);
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    updates.push('updated_by = ?');
    params.push(req.admin.id);

    params.push(questionId);

    const sql = `UPDATE assessment_questions SET ${updates.join(', ')} WHERE id = ?`;
    await database.query(sql, params);

    await Admin.logActivity(req.admin.id, 'UPDATE', 'question', questionId, `Updated question`, req.ip, req.headers['user-agent']);

    console.log('✅ Question updated:', questionId);

    res.json({
      success: true,
      message: 'Question updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating question:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating question',
      error: error.message
    });
  }
});

// Delete question (soft delete by setting is_active = 0, CSRF protected)
router.delete('/questions/:questionId', doubleCsrfProtection, authenticateAdmin, async (req, res) => {
  try {
    const { questionId } = req.params;

    const sql = `UPDATE assessment_questions SET is_active = 0, updated_by = ? WHERE id = ?`;
    await database.query(sql, [req.admin.id, questionId]);

    await Admin.logActivity(req.admin.id, 'DELETE', 'question', questionId, `Deleted question`, req.ip, req.headers['user-agent']);

    console.log('✅ Question deleted:', questionId);

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting question:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting question'
    });
  }
});

// ======================
// ASSESSMENT TYPE MANAGEMENT
// ======================

// Get all assessment types with question counts
router.get('/assessment-types', authenticateAdmin, async (req, res) => {
  try {
    const sql = `
      SELECT 
        assessment_type,
        COUNT(*) as total_questions,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_questions,
        COUNT(DISTINCT pillar_name) as pillar_count
      FROM assessment_questions
      GROUP BY assessment_type
      ORDER BY assessment_type;
    `;

    const result = await database.query(sql);

    res.json({
      success: true,
      assessmentTypes: result.recordset
    });
  } catch (error) {
    console.error('❌ Error getting assessment types:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assessment types'
    });
  }
});

// ======================
// ACTIVITY LOG
// ======================

// Get activity log
router.get('/activity-log', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, action_type, entity_type } = req.query;
    const offset = (page - 1) * limit;

    const logs = await Admin.getActivityLog({
      actionType: action_type,
      entityType: entity_type,
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('❌ Error getting activity log:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity log'
    });
  }
});

// ======================
// AUDIT LOGS / ACTIVITY LOG
// ======================

// Get audit logs/activity log
router.get('/audit-logs', authenticateAdmin, async (req, res) => {
  try {
    console.log('📋 Fetching audit logs...');
    
    const { limit = 100, offset = 0, action_type, admin_id } = req.query;
    
    let query = `
      SELECT 
        aal.id,
        aal.admin_id,
        au.username as admin_username,
        au.full_name as admin_name,
        aal.action_type,
        aal.entity_type,
        aal.entity_id,
        aal.description,
        aal.ip_address,
        aal.user_agent,
        aal.created_at
      FROM admin_activity_log aal
      LEFT JOIN admin_users au ON aal.admin_id = au.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (action_type) {
      query += ` AND aal.action_type = @action_type`;
      params.push({ name: 'action_type', type: 'NVarChar', value: action_type });
    }
    
    if (admin_id) {
      query += ` AND aal.admin_id = @admin_id`;
      params.push({ name: 'admin_id', type: 'Int', value: parseInt(admin_id) });
    }
    
    query += ` ORDER BY aal.created_at DESC
              OFFSET @offset ROWS
              FETCH NEXT @limit ROWS ONLY`;
    
    params.push(
      { name: 'offset', type: 'Int', value: parseInt(offset) },
      { name: 'limit', type: 'Int', value: parseInt(limit) }
    );
    
    const result = await database.query(query, params);
    const logs = result.recordset || result;
    
    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM admin_activity_log aal
      WHERE 1=1
    `;
    
    const countParams = [];
    
    if (action_type) {
      countQuery += ` AND aal.action_type = @action_type`;
      countParams.push({ name: 'action_type', type: 'NVarChar', value: action_type });
    }
    
    if (admin_id) {
      countQuery += ` AND aal.admin_id = @admin_id`;
      countParams.push({ name: 'admin_id', type: 'Int', value: parseInt(admin_id) });
    }
    
    const countResult = await database.query(countQuery, countParams);
    const total = countResult.recordset?.[0]?.total || countResult[0]?.total || 0;
    
    console.log(`✅ Found ${logs.length} audit logs (Total: ${total})`);
    console.log('📊 Sample log data:', JSON.stringify(logs.slice(0, 2), null, 2));
    
    res.json({
      success: true,
      logs,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + logs.length) < total
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
});

// Get audit log statistics
router.get('/audit-logs/stats', authenticateAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching audit log statistics...');
    
    const query = `
      SELECT 
        action_type,
        COUNT(*) as count,
        MAX(created_at) as last_occurrence
      FROM admin_activity_log
      GROUP BY action_type
      ORDER BY count DESC
    `;
    
    const result = await database.query(query);
    const stats = result.recordset || result;
    
    console.log('✅ Audit log stats:', stats);
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('❌ Error fetching audit log stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log statistics',
      error: error.message
    });
  }
});

// Get detailed activity logs (enhanced version with pagination)
router.get('/activity-logs/detailed', authenticateAdmin, async (req, res) => {
  try {
    console.log('📋 Fetching detailed activity logs...');
    
    const { limit = 50, page = 1, action_type, entity_type } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build WHERE clause for admin logs
    let adminWhereClause = '1=1';
    let userWhereClause = '1=1';
    
    if (action_type && action_type !== 'all') {
      const escapedAction = action_type.replace(/'/g, "''");
      adminWhereClause += ` AND aal.action_type = '${escapedAction}'`;
      userWhereClause += ` AND ual.action_type = '${escapedAction}'`;
    }
    
    if (entity_type && entity_type !== 'all') {
      const escapedEntity = entity_type.replace(/'/g, "''");
      adminWhereClause += ` AND aal.entity_type = '${escapedEntity}'`;
      userWhereClause += ` AND ual.entity_type = '${escapedEntity}'`;
    }
    
    // Get combined logs from both admin and user activity tables
    const sql = `
      WITH CombinedLogs AS (
        SELECT
          'admin' as actor_type,
          aal.id,
          au.username as actor_name,
          au.full_name as actor_full_name,
          au.email as actor_email,
          CAST(NULL AS NVARCHAR(255)) as company_name,
          aal.action_type,
          aal.entity_type,
          aal.entity_id,
          aal.description,
          aal.ip_address,
          aal.user_agent,
          aal.created_at
        FROM dbo.admin_activity_log aal
        LEFT JOIN dbo.admin_users au ON aal.admin_id = au.id
        WHERE ${adminWhereClause}
        
        UNION ALL
        
        SELECT
          'user' as actor_type,
          ual.id,
          l.contact_name as actor_name,
          l.contact_name as actor_full_name,
          l.email as actor_email,
          l.company_name,
          ual.action_type,
          ual.entity_type,
          CAST(ual.entity_id AS NVARCHAR(50)) as entity_id,
          ual.description,
          ual.ip_address,
          ual.user_agent,
          ual.created_at
        FROM dbo.user_activity_log ual
        INNER JOIN dbo.leads l ON ual.lead_id = l.id
        WHERE ${userWhereClause}
      )
      SELECT *
      FROM CombinedLogs
      ORDER BY created_at DESC
      OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY
    `;
    
    const result = await database.query(sql);
    const logs = Array.isArray(result) ? result : result.recordset;
    
    // Get total count
    const countSql = `
      SELECT COUNT(*) as total FROM (
        SELECT id FROM dbo.admin_activity_log aal WHERE ${adminWhereClause}
        UNION ALL
        SELECT id FROM dbo.user_activity_log ual WHERE ${userWhereClause}
      ) combined
    `;
    const countResult = await database.query(countSql);
    const total = Array.isArray(countResult) ? countResult[0].total : countResult.recordset[0].total;
    
    console.log(`✅ Found ${logs.length} activity logs (Total: ${total})`);
    
    res.json({
      success: true,
      logs,
      pagination: {
        total,
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_items: total,
        items_per_page: parseInt(limit),
        has_prev: page > 1,
        has_next: page < Math.ceil(total / parseInt(limit))
      }
    });
    
  } catch (error) {
    console.error('❌ Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
});

// ======================
// ADMIN USER MANAGEMENT (Super Admin Only)
// ======================

// Get all admins
router.get('/admins', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const admins = await Admin.getAll();

    res.json({
      success: true,
      admins
    });
  } catch (error) {
    console.error('❌ Error getting admins:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admins'
    });
  }
});

// Create new admin
router.post('/admins', doubleCsrfProtection, authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { username, email, password, full_name, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    const result = await Admin.create({
      username,
      email,
      password,
      full_name,
      role: role || 'admin',
      created_by: req.admin.id
    });

    if (result.success) {
      await Admin.logActivity(req.admin.id, 'CREATE', 'admin', result.adminId, `Created admin: ${username}`, req.ip, req.headers['user-agent']);
    }

    res.json(result);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating admin'
    });
  }
});

// Deactivate admin
router.post('/admins/:adminId/deactivate', doubleCsrfProtection, authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { adminId } = req.params;

    if (parseInt(adminId) === req.admin.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const result = await Admin.deactivate(adminId, req.admin.id);

    res.json(result);
  } catch (error) {
    console.error('❌ Error deactivating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error deactivating admin'
    });
  }
});

// ======================
// USER CRUD (Missing Endpoints)
// ======================

// Create new user
router.post('/users', doubleCsrfProtection, authenticateAdmin, async (req, res) => {
  try {
    const { contact_name, email, company_name, industry, job_title, phone_number, password } = req.body;

    // Validate required fields
    if (!contact_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Contact name, email, and password are required'
      });
    }

    // Check if email already exists
    const existingUser = await Lead.getByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    // Create new user
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(password, 12);

    const sql = `
      INSERT INTO leads (contact_name, email, company_name, industry, job_title, phone_number, password_hash, password_created_at, created_at)
      OUTPUT INSERTED.id, INSERTED.contact_name, INSERTED.email, INSERTED.company_name, INSERTED.industry, INSERTED.job_title, INSERTED.phone_number, INSERTED.created_at
      VALUES (?, ?, ?, ?, ?, ?, ?, GETDATE(), GETDATE());
    `;

    const result = await database.query(sql, [
      contact_name,
      email,
      company_name || null,
      industry || null,
      job_title || null,
      phone_number || null,
      passwordHash
    ]);

    const newUser = result.recordset[0];

    await Admin.logActivity(
      req.admin.id,
      'CREATE',
      'user',
      newUser.id,
      `Created new user: ${email}`,
      req.ip,
      req.headers['user-agent']
    );

    console.log('✅ User created by admin:', newUser.email);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
});

// Update user
router.put('/users/:userId', doubleCsrfProtection, authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { contact_name, email, company_name, industry, job_title, phone_number, password } = req.body;

    // Check if user exists
    const existingUser = await Lead.getById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If email is being changed, check for duplicates
    if (email && email !== existingUser.email) {
      const emailCheck = await Lead.getByEmail(email);
      if (emailCheck && emailCheck.id !== parseInt(userId)) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Build update query
    const updates = [];
    const params = [];

    if (contact_name !== undefined) {
      updates.push('contact_name = ?');
      params.push(contact_name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    if (company_name !== undefined) {
      updates.push('company_name = ?');
      params.push(company_name);
    }
    if (industry !== undefined) {
      updates.push('industry = ?');
      params.push(industry);
    }
    if (job_title !== undefined) {
      updates.push('job_title = ?');
      params.push(job_title);
    }
    if (phone_number !== undefined) {
      updates.push('phone_number = ?');
      params.push(phone_number);
    }
    if (password) {
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash(password, 12);
      updates.push('password_hash = ?');
      params.push(passwordHash);
      updates.push('password_updated_at = GETDATE()');
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updates.push('updated_at = GETDATE()');
    params.push(userId);

    const sql = `
      UPDATE leads
      SET ${updates.join(', ')}
      OUTPUT INSERTED.id, INSERTED.contact_name, INSERTED.email, INSERTED.company_name, INSERTED.industry, INSERTED.job_title, INSERTED.phone_number, INSERTED.updated_at
      WHERE id = ?;
    `;

    const result = await database.query(sql, params);
    const updatedUser = result.recordset[0];

    await Admin.logActivity(
      req.admin.id,
      'UPDATE',
      'user',
      userId,
      `Updated user: ${updatedUser.email}`,
      req.ip,
      req.headers['user-agent']
    );

    console.log('✅ User updated by admin:', updatedUser.email);

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});

// Delete user (soft delete)
router.delete('/users/:userId', doubleCsrfProtection, authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await Lead.getById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete by locking account permanently
    const sql = `
      UPDATE leads
      SET account_locked = 1, 
          locked_until = DATEADD(year, 100, GETDATE()),
          updated_at = GETDATE()
      WHERE id = ?;
    `;

    await database.query(sql, [userId]);

    await Admin.logActivity(
      req.admin.id,
      'DELETE',
      'user',
      userId,
      `Deleted user: ${user.email}`,
      req.ip,
      req.headers['user-agent']
    );

    console.log('✅ User deleted by admin:', user.email);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

// ======================
// ASSESSMENT MANAGEMENT (Missing Endpoints)
// ======================

// Get all assessments with pagination and filters
router.get('/assessments', authenticateAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, assessment_type, lead_id } = req.query;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';

    if (assessment_type && assessment_type !== 'all') {
      const escapedType = assessment_type.toUpperCase().replace(/'/g, "''");
      whereClause += ` AND a.assessment_type = '${escapedType}'`;
    }

    if (lead_id) {
      whereClause += ` AND a.lead_id = ${parseInt(lead_id)}`;
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM assessments a ${whereClause}`;
    const countResult = await database.query(countSql);
    const total = Array.isArray(countResult) ? countResult[0].total : countResult.recordset[0].total;

    // Get assessments with dimension_scores
    const sql = `
      SELECT 
        a.id,
        a.lead_id,
        l.contact_name as user_name,
        l.email as user_email,
        a.assessment_type,
        a.industry,
        a.overall_score,
        a.dimension_scores,
        a.responses,
        a.insights,
        a.completed_at,
        a.created_at
      FROM assessments a
      LEFT JOIN leads l ON a.lead_id = l.id
      ${whereClause}
      ORDER BY a.completed_at DESC
      OFFSET ${offset} ROWS FETCH NEXT ${parseInt(limit)} ROWS ONLY
    `;

    const result = await database.query(sql);
    const assessments = Array.isArray(result) ? result : result.recordset;

    res.json({
      success: true,
      assessments: assessments,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit),
        has_prev: page > 1,
        has_next: page < Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error getting assessments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assessments'
    });
  }
});

// Get single assessment by ID
router.get('/assessments/:assessmentId', authenticateAdmin, async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const id = parseInt(assessmentId);

    const sql = `
      SELECT 
        a.*,
        l.contact_name as user_name,
        l.email as user_email,
        l.company_name
      FROM assessments a
      LEFT JOIN leads l ON a.lead_id = l.id
      WHERE a.id = @param1
    `;
    
    const result = await database.query(sql, [id]);
    const assessment = Array.isArray(result) ? result[0] : result.recordset[0];
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    console.log('✅ Loaded assessment details:', assessmentId);

    res.json({
      success: true,
      assessment: assessment
    });
  } catch (error) {
    console.error('❌ Error getting assessment details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assessment details'
    });
  }
});

// Delete assessment (CSRF protected)
router.delete('/assessments/:assessmentId', doubleCsrfProtection, authenticateAdmin, async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const id = parseInt(assessmentId);

    // Check if assessment exists
    const checkSql = `SELECT * FROM assessments WHERE id = @param1`;
    const checkResult = await database.query(checkSql, [id]);
    const assessment = Array.isArray(checkResult) ? checkResult[0] : checkResult.recordset[0];
    
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Delete assessment (responses table doesn't exist or isn't used)
    const deleteAssessmentSql = `DELETE FROM assessments WHERE id = @param1`;
    await database.query(deleteAssessmentSql, [id]);

    await Admin.logActivity(
      req.admin.id,
      'DELETE',
      'assessment',
      assessmentId,
      `Deleted assessment: ${assessment.assessment_type} (ID: ${assessmentId})`,
      req.ip,
      req.headers['user-agent']
    );

    console.log('✅ Assessment deleted by admin:', assessmentId);

    res.json({
      success: true,
      message: 'Assessment deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting assessment'
    });
  }
});

// ======================
// QUESTION REORDERING (Missing Endpoint)
// ======================

// Reorder question
router.put('/questions/:questionId/reorder', doubleCsrfProtection, authenticateAdmin, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { direction } = req.body; // 'up' or 'down'

    if (!direction || !['up', 'down'].includes(direction)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid direction. Must be "up" or "down"'
      });
    }

    // Get current question
    const getQuestionSql = `SELECT * FROM assessment_questions WHERE id = ?;`;
    const questionResult = await database.query(getQuestionSql, [questionId]);
    
    if (questionResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const currentQuestion = questionResult.recordset[0];
    const currentOrder = currentQuestion.question_order;
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;

    if (newOrder < 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot move question further up'
      });
    }

    // Find question at target position
    const findTargetSql = `
      SELECT id FROM assessment_questions 
      WHERE assessment_type = ? 
      AND pillar_name = ? 
      AND question_order = ?
      AND is_active = 1;
    `;
    const targetResult = await database.query(findTargetSql, [
      currentQuestion.assessment_type,
      currentQuestion.pillar_name,
      newOrder
    ]);

    if (targetResult.recordset.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot move question further in that direction'
      });
    }

    const targetQuestionId = targetResult.recordset[0].id;

    // Swap orders
    await database.query(
      `UPDATE assessment_questions SET question_order = ? WHERE id = ?;`,
      [newOrder, questionId]
    );
    await database.query(
      `UPDATE assessment_questions SET question_order = ? WHERE id = ?;`,
      [currentOrder, targetQuestionId]
    );

    await Admin.logActivity(
      req.admin.id,
      'UPDATE',
      'question',
      questionId,
      `Reordered question ${direction}: ${currentQuestion.question_text.substring(0, 50)}...`,
      req.ip,
      req.headers['user-agent']
    );

    console.log('✅ Question reordered:', questionId, direction);

    res.json({
      success: true,
      message: 'Question reordered successfully'
    });
  } catch (error) {
    console.error('❌ Error reordering question:', error);
    res.status(500).json({
      success: false,
      message: 'Error reordering question'
    });
  }
});

// ======================
// CONFIGURATION MANAGEMENT
// ======================

// Get all assessment types
router.get('/config/assessment-types', authenticateAdmin, async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT assessment_type
      FROM assessment_questions
      WHERE is_active = 1
      ORDER BY assessment_type;
    `;
    const result = await database.query(sql);
    
    res.json({
      success: true,
      assessmentTypes: Array.isArray(result) ? result.map(r => r.assessment_type) : []
    });
  } catch (error) {
    console.error('❌ Error getting assessment types:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assessment types'
    });
  }
});

// Get all industries
router.get('/config/industries', authenticateAdmin, async (req, res) => {
  try {
    // Check if industries table exists, if not return default list
    const checkTableSql = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'industries';
    `;
    const tableCheck = await database.query(checkTableSql);
    
    if (!Array.isArray(tableCheck) || tableCheck.length === 0) {
      // Return default industries
      return res.json({
        success: true,
        industries: [
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
        ]
      });
    }
    
    const sql = `
      SELECT id, name, is_active
      FROM industries
      ORDER BY name;
    `;
    const result = await database.query(sql);
    
    res.json({
      success: true,
      industries: Array.isArray(result) ? result : []
    });
  } catch (error) {
    console.error('❌ Error getting industries:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching industries'
    });
  }
});

// Create new assessment type (by creating first question for it)
router.post('/config/assessment-types', doubleCsrfProtection, authenticateAdmin, async (req, res) => {
  try {
    const { assessment_type, description } = req.body;

    if (!assessment_type) {
      return res.status(400).json({
        success: false,
        message: 'Assessment type is required'
      });
    }

    // Check if already exists
    const checkSql = `
      SELECT COUNT(*) as count
      FROM assessment_questions
      WHERE assessment_type = ?;
    `;
    const checkResult = await database.query(checkSql, [assessment_type.toUpperCase()]);
    
    if (checkResult.recordset[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: 'Assessment type already exists'
      });
    }

    // Create a placeholder question for the new assessment type
    const sql = `
      INSERT INTO assessment_questions (
        assessment_type, pillar_name, pillar_short_name, question_text, question_order, created_by, is_active
      )
      OUTPUT INSERTED.id
      VALUES (?, 'Strategy', 'STRAT', ?, 1, ?, 1);
    `;

    const result = await database.query(sql, [
      assessment_type.toUpperCase(),
      description || `Sample question for ${assessment_type} assessment`,
      req.admin.id
    ]);

    const questionId = result.recordset[0].id;

    await Admin.logActivity(
      req.admin.id,
      'CREATE',
      'assessment_type',
      questionId,
      `Created new assessment type: ${assessment_type}`,
      req.ip,
      req.headers['user-agent']
    );

    console.log('✅ Assessment type created:', assessment_type);

    res.json({
      success: true,
      message: 'Assessment type created successfully',
      assessmentType: assessment_type.toUpperCase()
    });
  } catch (error) {
    console.error('❌ Error creating assessment type:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating assessment type'
    });
  }
});

// Update assessment type
router.put('/config/assessment-types/:oldType', doubleCsrfProtection, authenticateAdmin, async (req, res) => {
  try {
    const { oldType } = req.params;
    const { new_type } = req.body;

    if (!new_type) {
      return res.status(400).json({
        success: false,
        message: 'New assessment type name is required'
      });
    }

    const newTypeUpper = new_type.toUpperCase();
    const oldTypeUpper = oldType.toUpperCase();

    // Check if new type already exists
    const checkSql = `
      SELECT COUNT(*) as count
      FROM assessment_questions
      WHERE assessment_type = ?;
    `;
    const checkResult = await database.query(checkSql, [newTypeUpper]);
    
    if (checkResult.recordset[0].count > 0 && newTypeUpper !== oldTypeUpper) {
      return res.status(409).json({
        success: false,
        message: 'Assessment type already exists'
      });
    }

    // Update all questions with this assessment type
    const sql = `
      UPDATE assessment_questions
      SET assessment_type = ?
      WHERE assessment_type = ?;
    `;

    await database.query(sql, [newTypeUpper, oldTypeUpper]);

    // Update all assessments with this type
    const updateAssessmentsSql = `
      UPDATE assessments
      SET assessment_type = ?
      WHERE assessment_type = ?;
    `;

    await database.query(updateAssessmentsSql, [newTypeUpper, oldTypeUpper]);

    await Admin.logActivity(
      req.admin.id,
      'UPDATE',
      'assessment_type',
      null,
      `Updated assessment type from ${oldTypeUpper} to ${newTypeUpper}`,
      req.ip,
      req.headers['user-agent']
    );

    console.log('✅ Assessment type updated:', oldTypeUpper, '->', newTypeUpper);

    res.json({
      success: true,
      message: 'Assessment type updated successfully',
      assessmentType: newTypeUpper
    });
  } catch (error) {
    console.error('❌ Error updating assessment type:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating assessment type'
    });
  }
});

// Delete assessment type (soft delete by deactivating all questions)
router.delete('/config/assessment-types/:assessmentType', doubleCsrfProtection, authenticateAdmin, async (req, res) => {
  try {
    const { assessmentType } = req.params;
    const assessmentTypeUpper = assessmentType.toUpperCase();

    // Soft delete by setting is_active = 0 for all questions of this type
    const sql = `
      UPDATE assessment_questions
      SET is_active = 0
      WHERE assessment_type = ?;
    `;

    const result = await database.query(sql, [assessmentTypeUpper]);

    await Admin.logActivity(
      req.admin.id,
      'DELETE',
      'assessment_type',
      null,
      `Deleted assessment type: ${assessmentTypeUpper}`,
      req.ip,
      req.headers['user-agent']
    );

    console.log('✅ Assessment type deleted:', assessmentTypeUpper);

    res.json({
      success: true,
      message: 'Assessment type deleted successfully (all questions deactivated)'
    });
  } catch (error) {
    console.error('❌ Error deleting assessment type:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting assessment type'
    });
  }
});

// Add new industry
router.post('/config/industries', doubleCsrfProtection, authenticateAdmin, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Industry name is required'
      });
    }

    // Create industries table if it doesn't exist
    const createTableSql = `
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'industries')
      BEGIN
        CREATE TABLE industries (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(100) NOT NULL UNIQUE,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          created_by NVARCHAR(50)
        );
      END
    `;
    await database.query(createTableSql);

    // Insert new industry
    const sql = `
      INSERT INTO industries (name, created_by)
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.is_active
      VALUES (?, ?);
    `;

    const result = await database.query(sql, [name, req.admin.id]);
    const industry = result.recordset[0];

    await Admin.logActivity(
      req.admin.id,
      'CREATE',
      'industry',
      industry.id,
      `Created new industry: ${name}`,
      req.ip,
      req.headers['user-agent']
    );

    console.log('✅ Industry created:', name);

    res.json({
      success: true,
      message: 'Industry created successfully',
      industry
    });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({
        success: false,
        message: 'Industry already exists'
      });
    }
    console.error('❌ Error creating industry:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating industry'
    });
  }
});

// Update industry
router.put('/config/industries/:industryId', doubleCsrfProtection, authenticateAdmin, async (req, res) => {
  try {
    const { industryId } = req.params;
    const { name, is_active } = req.body;

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(industryId);

    const sql = `
      UPDATE industries
      SET ${updates.join(', ')}
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.is_active
      WHERE id = ?;
    `;

    const result = await database.query(sql, params);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Industry not found'
      });
    }

    const industry = result.recordset[0];

    await Admin.logActivity(
      req.admin.id,
      'UPDATE',
      'industry',
      industryId,
      `Updated industry: ${industry.name}`,
      req.ip,
      req.headers['user-agent']
    );

    console.log('✅ Industry updated:', industry.name);

    res.json({
      success: true,
      message: 'Industry updated successfully',
      industry
    });
  } catch (error) {
    console.error('❌ Error updating industry:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating industry'
    });
  }
});

// Delete industry
router.delete('/config/industries/:industryId', doubleCsrfProtection, authenticateAdmin, async (req, res) => {
  try {
    const { industryId } = req.params;

    // Soft delete by setting is_active = 0
    const sql = `
      UPDATE industries
      SET is_active = 0
      OUTPUT DELETED.name
      WHERE id = ?;
    `;

    const result = await database.query(sql, [industryId]);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Industry not found'
      });
    }

    const industryName = result.recordset[0].name;

    await Admin.logActivity(
      req.admin.id,
      'DELETE',
      'industry',
      industryId,
      `Deleted industry: ${industryName}`,
      req.ip,
      req.headers['user-agent']
    );

    console.log('✅ Industry deleted:', industryName);

    res.json({
      success: true,
      message: 'Industry deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting industry:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting industry'
    });
  }
});

// ======================
// PILLAR MANAGEMENT
// ======================

// Get all pillars
router.get('/config/pillars', authenticateAdmin, async (req, res) => {
  try {
    // Check if pillars table exists, if not return default list
    const checkTableSql = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'pillars';
    `;
    const tableCheck = await database.query(checkTableSql);
    
    if (!Array.isArray(tableCheck) || tableCheck.length === 0) {
      // Get distinct pillars from existing questions
      const sql = `
        SELECT DISTINCT pillar_name as name, pillar_short_name as short_name
        FROM assessment_questions
        WHERE is_active = 1
        ORDER BY pillar_name;
      `;
      const result = await database.query(sql);
      
      return res.json({
        success: true,
        pillars: Array.isArray(result) ? result : []
      });
    }
    
    const sql = `
      SELECT id, name, short_name, is_active
      FROM pillars
      ORDER BY name;
    `;
    const result = await database.query(sql);
    
    res.json({
      success: true,
      pillars: Array.isArray(result) ? result : []
    });
  } catch (error) {
    console.error('❌ Error getting pillars:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pillars'
    });
  }
});

// Create new pillar
router.post('/config/pillars', doubleCsrfProtection, authenticateAdmin, async (req, res) => {
  try {
    const { name, short_name } = req.body;

    if (!name || !short_name) {
      return res.status(400).json({
        success: false,
        message: 'Pillar name and short name are required'
      });
    }

    // Create pillars table if it doesn't exist
    const createTableSql = `
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'pillars')
      BEGIN
        CREATE TABLE pillars (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(100) NOT NULL UNIQUE,
          short_name NVARCHAR(10) NOT NULL UNIQUE,
          is_active BIT DEFAULT 1,
          created_at DATETIME2 DEFAULT GETDATE(),
          created_by NVARCHAR(50)
        );
      END
    `;
    await database.query(createTableSql);

    // Insert new pillar
    const sql = `
      INSERT INTO pillars (name, short_name, created_by)
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.short_name, INSERTED.is_active
      VALUES (?, ?, ?);
    `;

    const result = await database.query(sql, [name, short_name.toUpperCase(), req.admin.id]);
    const pillar = result.recordset[0];

    await Admin.logActivity(
      req.admin.id,
      'CREATE',
      'pillar',
      pillar.id,
      `Created new pillar: ${name} (${short_name})`,
      req.ip,
      req.headers['user-agent']
    );

    console.log('✅ Pillar created:', name);

    res.json({
      success: true,
      message: 'Pillar created successfully',
      pillar
    });
  } catch (error) {
    if (error.message.includes('UNIQUE')) {
      return res.status(409).json({
        success: false,
        message: 'Pillar name or short name already exists'
      });
    }
    console.error('❌ Error creating pillar:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating pillar'
    });
  }
});

// Update pillar
router.put('/config/pillars/:pillarId', doubleCsrfProtection, authenticateAdmin, async (req, res) => {
  try {
    const { pillarId } = req.params;
    const { name, short_name, is_active } = req.body;

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }

    if (short_name !== undefined) {
      updates.push('short_name = ?');
      params.push(short_name.toUpperCase());
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    params.push(pillarId);

    const sql = `
      UPDATE pillars
      SET ${updates.join(', ')}
      OUTPUT INSERTED.id, INSERTED.name, INSERTED.short_name, INSERTED.is_active
      WHERE id = ?;
    `;

    const result = await database.query(sql, params);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pillar not found'
      });
    }

    const pillar = result.recordset[0];

    // Update all questions using this pillar if name changed
    if (name !== undefined) {
      await database.query(`
        UPDATE assessment_questions
        SET pillar_name = ?
        WHERE pillar_name = (SELECT name FROM pillars WHERE id = ? AND name != ?);
      `, [name, pillarId, name]);
    }

    if (short_name !== undefined) {
      await database.query(`
        UPDATE assessment_questions
        SET pillar_short_name = ?
        WHERE pillar_short_name = (SELECT short_name FROM pillars WHERE id = ? AND short_name != ?);
      `, [short_name.toUpperCase(), pillarId, short_name.toUpperCase()]);
    }

    await Admin.logActivity(
      req.admin.id,
      'UPDATE',
      'pillar',
      pillarId,
      `Updated pillar: ${pillar.name}`,
      req.ip,
      req.headers['user-agent']
    );

    console.log('✅ Pillar updated:', pillar.name);

    res.json({
      success: true,
      message: 'Pillar updated successfully',
      pillar
    });
  } catch (error) {
    console.error('❌ Error updating pillar:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating pillar'
    });
  }
});

// Delete pillar (soft delete)
router.delete('/config/pillars/:pillarId', doubleCsrfProtection, authenticateAdmin, async (req, res) => {
  try {
    const { pillarId } = req.params;

    // Soft delete by setting is_active = 0
    const sql = `
      UPDATE pillars
      SET is_active = 0
      OUTPUT DELETED.name
      WHERE id = ?;
    `;

    const result = await database.query(sql, [pillarId]);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pillar not found'
      });
    }

    const pillarName = result.recordset[0].name;

    await Admin.logActivity(
      req.admin.id,
      'DELETE',
      'pillar',
      pillarId,
      `Deleted pillar: ${pillarName}`,
      req.ip,
      req.headers['user-agent']
    );

    console.log('✅ Pillar deleted:', pillarName);

    res.json({
      success: true,
      message: 'Pillar deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting pillar:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting pillar'
    });
  }
});

export default router;


