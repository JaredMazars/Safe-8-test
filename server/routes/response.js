// routes/responseRouter.js
import express from 'express';
import Response from '../models/Response.js';
import Lead from '../models/Lead.js';

const responseRouter = express.Router();

// GET all assessment questions
responseRouter.get('/questions/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const allQuestions = await Response.getAll();

        console.log('Questions from DB:', allQuestions); // ✅ Confirm it's an array

        if (!Array.isArray(allQuestions)) {
            console.error('Expected an array but got:', typeof allQuestions);
            return res.status(500).json({ message: 'Internal error: questions not loaded properly' });
        }

        const filteredQuestions = allQuestions.filter(q =>
            q.assessment_type?.toLowerCase() === type.toLowerCase()
        );

        res.json({ questions: filteredQuestions });
    } catch (error) {
        console.error('Error fetching questions:', error.message);
        res.status(500).json({ message: 'Failed to fetch questions' });
    }
});

// GET all responses for a specific user
responseRouter.get('/responses/:leadUserId', async (req, res) => {
  try {
    const leadUserId = parseInt(req.params.leadUserId);
    const responses = await Response.getByUser(leadUserId);
    res.json({ success: true, data: responses });
  } catch (error) {
    console.error('Error fetching responses:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch responses' });
  }
});

// POST route to create a new lead
responseRouter.post('/lead', async (req, res) => {
  try {
    const leadData = req.body;
    console.log('📝 Creating lead with data:', leadData);
    
    // Use updateOrCreate to handle duplicate emails
    const result = await Lead.updateOrCreate(leadData);
    console.log('Lead result:', result);
    
    if (result.success) {
      res.status(result.isNew ? 201 : 200).json({
        success: true,
        message: result.isNew ? 'Lead created successfully' : 'Lead updated successfully',
        leadId: result.leadId,
        isNew: result.isNew
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to process lead'
      });
    }
  } catch (error) {
    console.error(`❌ Error processing lead: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to process lead'
    });
  }
});

export default responseRouter;