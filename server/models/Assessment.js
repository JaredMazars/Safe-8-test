import database from "../config/database.js";

class Assessment {
  // Create a new assessment record with final results
  static async create(assessmentData) {
    const {
      lead_id,
      assessment_type,
      industry,
      overall_score,
      dimension_scores,
      responses,
      insights
    } = assessmentData;

    const sql = `
      INSERT INTO assessments (
        lead_id, assessment_type, industry, overall_score, 
        dimension_scores, responses, insights, completed_at
      ) OUTPUT INSERTED.id
      VALUES (?, ?, ?, ?, ?, ?, ?, GETDATE());
    `;

    try {
      const result = await database.query(sql, [
        lead_id,
        assessment_type.toUpperCase(),
        industry,
        overall_score,
        JSON.stringify(dimension_scores),
        JSON.stringify(responses),
        JSON.stringify(insights)
      ]);
      
      return { 
        success: true, 
        assessmentId: result.recordset[0]?.id,
        message: 'Assessment saved successfully'
      };
    } catch (error) {
      console.error('Error creating assessment:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Update or Create assessment
  static async updateOrCreate(assessmentData) {
    const { lead_id, assessment_type, industry } = assessmentData;
    
    // First check if assessment exists for this user, type, and industry
    const existingAssessment = await this.getByUserTypeAndIndustry(lead_id, assessment_type, industry);
    
    if (existingAssessment) {
      // Update existing assessment
      const sql = `
        UPDATE assessments 
        SET overall_score = ?, 
            dimension_scores = ?, 
            responses = ?, 
            insights = ?,
            completed_at = GETDATE()
        WHERE id = ?;
      `;
      
      try {
        await database.query(sql, [
          assessmentData.overall_score,
          JSON.stringify(assessmentData.dimension_scores),
          JSON.stringify(assessmentData.responses),
          JSON.stringify(assessmentData.insights),
          existingAssessment.id
        ]);
        
        return { 
          success: true, 
          assessmentId: existingAssessment.id,
          isNew: false,
          message: 'Assessment updated successfully'
        };
      } catch (error) {
        console.error('Error updating assessment:', error);
        return { success: false, error: error.message };
      }
    } else {
      // Create new assessment
      const createResult = await this.create(assessmentData);
      if (createResult.success) {
        return { 
          ...createResult, 
          isNew: true 
        };
      }
      return createResult;
    }
  }

  // Get assessment by user, type, and industry
  static async getByUserTypeAndIndustry(lead_id, assessment_type, industry) {
    const sql = `
      SELECT * FROM assessments 
      WHERE lead_id = ? AND assessment_type = ? AND industry = ?
      ORDER BY completed_at DESC;
    `;

    try {
      const result = await database.query(sql, [lead_id, assessment_type.toUpperCase(), industry]);
      if (result.recordset && result.recordset.length > 0) {
        const assessment = result.recordset[0];
        return {
          ...assessment,
          dimension_scores: JSON.parse(assessment.dimension_scores || '{}'),
          responses: JSON.parse(assessment.responses || '{}')
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting assessment:', error);
      return null;
    }
  }

  // Get assessment by ID
  static async getById(assessmentId) {
    const sql = `
      SELECT a.*, l.contact_name, l.email, l.company_name
      FROM assessments a
      INNER JOIN leads l ON a.lead_id = l.id
      WHERE a.id = ?;
    `;

    try {
      const result = await database.query(sql, [assessmentId]);
      if (result.length > 0) {
        const assessment = result[0];
        return {
          ...assessment,
          dimension_scores: JSON.parse(assessment.dimension_scores),
          responses: JSON.parse(assessment.responses)
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting assessment:', error);
      return null;
    }
  }

  // Get all assessments for a user
  static async getByUserId(lead_id) {
    const sql = `
      SELECT * FROM assessments 
      WHERE lead_id = ? 
      ORDER BY completed_at DESC;
    `;

    try {
      const result = await database.query(sql, [lead_id]);
      return result.map(assessment => ({
        ...assessment,
        dimension_scores: JSON.parse(assessment.dimension_scores),
        responses: JSON.parse(assessment.responses)
      }));
    } catch (error) {
      console.error('Error getting user assessments:', error);
      return [];
    }
  }

  // Calculate dimension scores from responses
  static async calculateDimensionScores(lead_user_id, assessment_type) {
    const sql = `
      SELECT 
        aq.pillar_name,
        aq.pillar_short_name,
        COUNT(*) as total_questions,
        COUNT(ar.response_value) as answered_questions,
        AVG(CAST(ar.response_value AS FLOAT)) as avg_score,
        MIN(ar.response_value) as min_score,
        MAX(ar.response_value) as max_score
      FROM assessment_questions aq
      LEFT JOIN assessment_responses ar ON aq.id = ar.question_id AND ar.lead_user_id = ?
      WHERE aq.assessment_type = ?
      GROUP BY aq.pillar_name, aq.pillar_short_name
      ORDER BY aq.pillar_name;
    `;

    try {
      const result = await database.query(sql, [lead_user_id, assessment_type.toUpperCase()]);
      
      return result.map(pillar => ({
        pillar_name: pillar.pillar_name,
        pillar_short_name: pillar.pillar_short_name,
        total_questions: pillar.total_questions,
        answered_questions: pillar.answered_questions,
        score: pillar.answered_questions > 0 ? Math.round((pillar.avg_score / 5) * 100) : 0,
        raw_average: pillar.avg_score,
        min_score: pillar.min_score,
        max_score: pillar.max_score,
        completion_rate: Math.round((pillar.answered_questions / pillar.total_questions) * 100)
      }));
    } catch (error) {
      console.error('Error calculating dimension scores:', error);
      return [];
    }
  }

  // Generate insights based on assessment results
  static generateInsights(overall_score, dimension_scores) {
    const insights = {
      overall_assessment: '',
      strengths: [],
      improvement_areas: [],
      recommendations: []
    };

    // Overall assessment
    if (overall_score >= 80) {
      insights.overall_assessment = 'Your organization demonstrates advanced AI readiness with strong foundations across most dimensions.';
    } else if (overall_score >= 60) {
      insights.overall_assessment = 'Your organization shows good AI readiness with solid foundations and clear opportunities for enhancement.';
    } else if (overall_score >= 40) {
      insights.overall_assessment = 'Your organization has emerging AI capabilities with significant potential for development.';
    } else {
      insights.overall_assessment = 'Your organization is in the early stages of AI readiness with substantial opportunities for growth.';
    }

    // Identify strengths (scores >= 70)
    dimension_scores.forEach(dimension => {
      if (dimension.score >= 70) {
        insights.strengths.push({
          area: dimension.pillar_name,
          score: dimension.score,
          description: `Strong performance in ${dimension.pillar_name.toLowerCase()}`
        });
      }
    });

    // Identify improvement areas (scores < 60)
    dimension_scores.forEach(dimension => {
      if (dimension.score < 60) {
        insights.improvement_areas.push({
          area: dimension.pillar_name,
          score: dimension.score,
          priority: dimension.score < 40 ? 'High' : 'Medium',
          description: `${dimension.pillar_name} requires focused attention`
        });
      }
    });

    // Generate recommendations
    if (overall_score < 50) {
      insights.recommendations.push('Focus on building foundational AI capabilities and governance');
      insights.recommendations.push('Develop a comprehensive AI strategy aligned with business objectives');
    }
    
    if (dimension_scores.some(d => d.pillar_short_name === 'DATA' && d.score < 60)) {
      insights.recommendations.push('Invest in data quality and governance infrastructure');
    }
    
    if (dimension_scores.some(d => d.pillar_short_name === 'SECURITY' && d.score < 70)) {
      insights.recommendations.push('Strengthen security and compliance frameworks for AI');
    }

    insights.recommendations.push('Consider engaging AI readiness experts for detailed transformation planning');

    return insights;
  }
}

export default Assessment;
