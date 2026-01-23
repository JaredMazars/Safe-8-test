# SAFE-8 Frontend Application - Complete Build Specification
## For Claude Sonnet 4.5 Implementation

---

## 🎯 PROJECT OVERVIEW

Build a **modern, professional React frontend** for the SAFE-8 AI Readiness Assessment platform that connects to an existing Express.js backend API.

**Critical Requirements**:
- Apply Forvis Mazars branding guidelines and styling
- Clean, modern UI with excellent UX
- Mobile-first responsive design
- Seamless integration with existing backend
- Real-time data visualization
- Secure authentication flows

---

## 🔌 BACKEND CONNECTION

### **API Base URL**
```javascript
Development: http://localhost:5000
Production: [To be configured]
```

### **Backend is Already Running** ✅
- Express.js server on port 5000
- Azure SQL Database connected
- All API endpoints fully functional
- Authentication & session management ready

### **Your Task**: Build the React frontend that consumes these APIs

---

## 📡 AVAILABLE API ENDPOINTS

### **Authentication & Users**

#### `POST /api/lead` - Create User Account
```javascript
Request:
{
  contactName: string,
  email: string,
  password: string,
  phoneNumber: string,
  companyName: string,
  jobTitle: string,
  industry: string,
  companySize: string,
  country: string
}

Response (201):
{
  success: true,
  leadId: number,
  message: "Lead created successfully"
}
```

#### `POST /api/lead/login` - User Login
```javascript
Request:
{
  email: string,
  password: string
}

Success (200):
{
  success: true,
  user: {
    id: number,
    email: string,
    contact_name: string,
    company_name: string,
    job_title: string,
    industry: string,
    company_size: string,
    country: string
  },
  assessments: [...],
  message: "Welcome back, {name}!"
}

Errors:
- 401: Invalid password (includes attemptsRemaining)
- 423: Account locked
- 404: Email not found
```

### **Questions**

#### `GET /api/questions/questions/:type` - Get Assessment Questions
```javascript
Path: /api/questions/questions/core
     /api/questions/questions/advanced
     /api/questions/questions/frontier

Response (200):
{
  questions: [
    {
      id: number,
      question_text: string,
      assessment_type: string,
      pillar_name: string,
      dimension_name: string,
      question_order: number
    }
  ]
}
```

### **Responses**

#### `POST /api/assessment-response/response` - Save Individual Answer
```javascript
Request:
{
  lead_user_id: number,
  question_id: number,
  response_value: number  // 1-5
}

Response (200):
{
  success: true,
  message: "Response saved",
  id: number
}
```

#### `GET /api/assessment-response/score/:userId/:assessmentType` - Get Current Score
```javascript
Response (200):
{
  success: true,
  score: number,  // 0-100
  answeredQuestions: number,
  totalQuestions: number
}
```

#### `DELETE /api/assessment-response/responses/:userId/:assessmentType` - Clear Responses
```javascript
Response (200):
{
  success: true,
  message: "Responses deleted",
  deletedCount: number
}
```

### **Assessments**

#### `POST /api/assessments/submit-complete` - Submit Complete Assessment
```javascript
Request:
{
  lead_id: number,
  assessment_type: string,  // "CORE", "ADVANCED", "FRONTIER"
  industry: string,
  overall_score: number,
  responses: object,  // {questionId: responseValue}
  pillar_scores: [
    {
      pillar_name: string,
      dimension_name: string,
      score: number
    }
  ],
  risk_assessment: array,
  service_recommendations: array,
  gap_analysis: array,
  completion_time_ms: number,
  metadata: object
}

Response (201):
{
  success: true,
  assessmentId: number,
  message: "Assessment submitted successfully",
  overallScore: number,
  dimension_scores: array
}
```

#### `GET /api/assessments/:assessmentId` - Get Assessment Details
```javascript
Response (200):
{
  success: true,
  assessment: {
    id: number,
    overall_score: number,
    dimension_scores: array,
    responses: object,
    insights: object,
    risk_assessment: array,
    service_recommendations: array,
    completed_at: datetime,
    ...
  }
}
```

### **User Dashboard**

#### `GET /api/user-engagement/dashboard/:userId` - Get User Stats
```javascript
Response (200):
{
  success: true,
  stats: {
    total_assessments: number,
    last_assessment_date: datetime,
    avg_completion_time_minutes: number,
    highest_score: number,
    lowest_score: number,
    total_logins: number
  },
  recentAssessments: array
}
```

### **Admin Endpoints**

#### `POST /api/admin/login` - Admin Login
```javascript
Request:
{
  username: string,
  password: string
}

Response (200):
{
  success: true,
  sessionToken: string,
  admin: {...},
  expiresAt: datetime
}
```

#### `GET /api/admin/dashboard` - Admin Dashboard Stats
```javascript
Headers: Authorization: Bearer {sessionToken}

Response (200):
{
  success: true,
  stats: {
    totalUsers: number,
    totalAssessments: number,
    newUsersToday: number,
    assessmentsToday: number
  }
}
```

#### `GET /api/admin/users` - Get All Users
```javascript
Headers: Authorization: Bearer {sessionToken}
Query: ?page=1&limit=20&search=keyword

Response (200):
{
  success: true,
  users: array,
  totalCount: number,
  currentPage: number,
  totalPages: number
}
```

#### `GET /api/admin/questions` - Get Questions
```javascript
Headers: Authorization: Bearer {sessionToken}
Query: ?type=core&active=true

Response (200):
{
  success: true,
  questions: array
}
```

#### `POST /api/admin/questions` - Create Question
#### `PUT /api/admin/questions/:id` - Update Question
#### `DELETE /api/admin/questions/:id` - Soft Delete Question

---

## 🎨 FRONTEND APPLICATION STRUCTURE

### **Technology Stack**
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.8.0",
  "axios": "^1.3.0",
  "chart.js": "^4.2.0",
  "react-chartjs-2": "^5.2.0"
}
```

### **Project Structure**
```
safe-8-frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── Safe8Assessment.js       # Main orchestrator
│   │   ├── WelcomeScreen.js         # Landing page
│   │   ├── LeadForm.js              # Registration
│   │   ├── AssessmentQuestions.js   # Quiz interface
│   │   ├── AssessmentResults.js     # Results display
│   │   ├── UserDashboard.js         # User history
│   │   ├── AdminLogin.js            # Admin auth
│   │   ├── AdminDashboard.js        # Admin panel
│   │   ├── QuestionManager.js       # Admin CRUD
│   │   └── LoadingScreen.js         # Loading state
│   ├── services/
│   │   └── api.js                    # Axios instance
│   ├── config/
│   │   └── api.js                    # API configuration
│   ├── App.js                        # Main app
│   ├── App.css                       # Forvis Mazars branded styles
│   └── index.js                      # Entry point
└── package.json
```

---

## 🎯 COMPONENT SPECIFICATIONS

### **1. Safe8Assessment.js** - Main Application Orchestrator

**Purpose**: Manages application state and navigation flow

**State Management**:
```javascript
const [currentStep, setCurrentStep] = useState('welcome');
// Values: 'welcome' | 'leadForm' | 'assessment' | 'results' | 'dashboard'

const [selectedAssessmentType, setSelectedAssessmentType] = useState(null);
// Values: 'core' | 'advanced' | 'frontier'

const [selectedIndustry, setSelectedIndustry] = useState(null);
// Industry string from dropdown

const [leadData, setLeadData] = useState(null);
// User data: {leadId, contactName, email, companyName, ...}

const [userId, setUserId] = useState(null);
// Lead ID for API calls

const [userData, setUserData] = useState(null);
// Logged-in user data from login response

const [responses, setResponses] = useState({});
// {questionId: responseValue}

const [assessmentResults, setAssessmentResults] = useState(null);
// Assessment completion data
```

**User Flow Logic**:
```javascript
// Flow 1: New User
welcome → leadForm → assessment → results

// Flow 2: Logged-In User
welcome → (skip leadForm) → assessment → results

// Flow 3: Returning User
welcome → login → dashboard → startNew → assessment → results
```

**Routing**:
```javascript
<Routes>
  <Route path="/" element={<Safe8Assessment />} />
  <Route path="/admin/login" element={<AdminLogin />} />
  <Route path="/admin/dashboard" element={<AdminDashboard />} />
</Routes>
```

---

### **2. WelcomeScreen.js** - Landing Page

**Purpose**: Entry point for all users with assessment selection and login

**Key Elements**:
- Hero section with SAFE-8 branding
- Clear value proposition
- Three assessment cards (Core, Advanced, Frontier)
- Industry selection dropdown
- Login button (inline form or modal)
- Admin portal link

**Assessment Cards** (3 cards side-by-side):

**Core Assessment Card**:
```javascript
{
  type: 'core',
  title: 'Core Assessment',
  icon: 'fas fa-rocket',
  duration: '25 questions • ~5 minutes',
  features: [
    'AI strategy alignment',
    'Governance essentials',
    'Basic readiness factors'
  ],
  audience: 'Executives & Leaders'
}
```

**Advanced Assessment Card**:
```javascript
{
  type: 'advanced',
  title: 'Advanced Assessment',
  icon: 'fas fa-cogs',
  duration: '45 questions • ~9 minutes',
  features: [
    'Technical infrastructure',
    'Data pipeline maturity',
    'Advanced capabilities'
  ],
  audience: 'CIOs & Technical Leaders'
}
```

**Frontier Assessment Card**:
```javascript
{
  type: 'frontier',
  title: 'Frontier Assessment',
  icon: 'fas fa-brain',
  duration: '60 questions • ~12 minutes',
  features: [
    'Next-gen capabilities',
    'Multi-agent orchestration',
    'Cutting-edge readiness'
  ],
  audience: 'AI Centers of Excellence'
}
```

**Industry Options** (Dropdown):
```javascript
const industries = [
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
```

**Login Form** (Inline or Modal):
```javascript
State:
- showLoginForm: boolean
- loginEmail: string
- loginPassword: string
- showLoginPassword: boolean  // Toggle visibility
- loginError: string
- isLoggingIn: boolean

Validation:
- Email: /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,255}\.[A-Za-z]{2,}$/
- Password: Required

API Call:
POST /api/lead/login {email, password}

On Success:
- Store user data locally
- Call onLogin(response.data)
- Navigate to dashboard

Error Handling:
- 401: "Invalid password. {attemptsRemaining} attempts remaining"
- 423: "Account locked due to too many failed attempts"
- 404: "No account found with this email"
```

**Call to Action Button**:
```javascript
// Disabled until both assessment type AND industry selected
<button 
  disabled={!selectedAssessmentType || !selectedIndustry}
  onClick={onStartAssessment}
>
  {userData ? 'Start Assessment' : 'Continue to Assessment'}
</button>
```

**Props**:
```javascript
{
  industries: string[],
  selectedAssessmentType: string | null,
  selectedIndustry: string | null,
  onAssessmentTypeSelect: (type: string) => void,
  onIndustrySelect: (industry: string) => void,
  onStartAssessment: () => void,
  onLogin: (loginData: object) => void,
  userData: object | null
}
```

---

### **3. LeadForm.js** - User Registration

**Purpose**: Capture user details and create account with password

**Form Fields** (All Required):

**Personal Information**:
- First Name (text input)
- Last Name (text input)
- Email (email input, validated)
- Phone Number (tel input)

**Account Security**:
- Password (password input, min 8 chars, toggle visibility)
- Confirm Password (password input, must match)

**Company Information**:
- Company Name (text input)
- Job Title (text input)
- Company Size (dropdown):
  - "1-50 employees"
  - "51-200 employees"
  - "201-1,000 employees"
  - "1,001-10,000 employees"
  - "10,000+ employees"
- Country (dropdown - top 20 countries)

**Static Fields** (Display Only):
- Assessment Type: {selectedAssessmentType} (from props)
- Industry: {selectedIndustry} (from props)

**Validation Rules**:
```javascript
Email Regex: /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,255}\.[A-Za-z]{2,}$/

Password:
- Minimum 8 characters
- Must match confirmation

All fields required
Real-time validation with error messages
```

**API Call**:
```javascript
POST /api/lead
{
  contactName: `${firstName} ${lastName}`,
  email: email,
  password: password,
  phoneNumber: phoneNumber,
  companyName: companyName,
  jobTitle: jobTitle,
  industry: props.industry,
  companySize: companySize,
  country: country,
  leadSource: 'Web Assessment'
}

On Success (201):
{
  success: true,
  leadId: number,
  message: "Lead created successfully"
}

Then:
- Store leadId
- Construct leadData object
- Call onSubmit(leadData)
```

**Error Handling**:
```javascript
400: Email already exists - Show "Email already registered. Try logging in."
500: Server error - Show generic error message
```

**Props**:
```javascript
{
  assessmentType: string,
  industry: string,
  onSubmit: (leadData: object) => void,
  onBack: () => void
}
```

**Layout**:
- Clean, focused question display
- Progress indicator
- Previous/Next navigation
- Auto-save feedback
- Responsive for mobile

---

### **4. AssessmentQuestions.js** - Interactive Quiz Interface

**Purpose**: Display questions one-by-one with real-time scoring

**Features**:
1. Load questions from API on mount
2. Display current question with 5-point Likert scale
3. Save each response immediately to backend
4. Update live score as user progresses
5. Show progress bar
6. Previous/Next navigation
7. Complete assessment when all answered

**Load Questions**:
```javascript
useEffect(() => {
  const loadQuestions = async () => {
    setIsLoading(true);
    
    const response = await api.get(`/api/questions/questions/${assessmentType}`);
    
    // Transform to expected format
    const transformedQuestions = response.data.questions.map(q => ({
      id: q.id,
      text: q.question_text,
      type: 'scale',
      options: [
        {value: 1, label: 'Strongly Disagree'},
        {value: 2, label: 'Disagree'},
        {value: 3, label: 'Neutral'},
        {value: 4, label: 'Agree'},
        {value: 5, label: 'Strongly Agree'}
      ]
    }));
    
    setQuestions(transformedQuestions);
    setIsLoading(false);
  };
  
  loadQuestions();
}, [assessmentType]);
```

**Save Response** (on answer selection):
```javascript
const handleAnswerChange = async (value) => {
  // Update local state
  const newResponses = {...responses, [currentQuestion.id]: value};
  setResponses(newResponses);
  
  // Call parent callback
  if (onResponse) {
    onResponse(currentQuestion.id, value);
  }
  
  // Save to database immediately
  try {
    await api.post('/api/assessment-response/response', {
      lead_user_id: userId,
      question_id: currentQuestion.id,
      response_value: parseInt(value)
    });
    console.log('✅ Response saved');
  } catch (error) {
    console.error('❌ Error saving response:', error);
    // Show error notification but don't block user
  }
};
```

**Live Score Calculation**:
```javascript
const calculateLiveScore = () => {
  let totalScore = 0;
  let answeredQuestions = 0;
  
  Object.values(responses).forEach(response => {
    if (response) {
      answeredQuestions++;
      totalScore += parseInt(response);
    }
  });
  
  if (answeredQuestions === 0) return 0;
  
  // Convert to 0-100 percentage
  const maxPossible = answeredQuestions * 5;
  return Math.round((totalScore / maxPossible) * 100);
};

const liveScore = calculateLiveScore();
```

**Progress Calculation**:
```javascript
const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
```

**Navigation Logic**:
```javascript
const handleNext = () => {
  if (currentQuestionIndex < questions.length - 1) {
    // Move to next question
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  } else {
    // All questions answered - complete assessment
    const results = {
      assessmentType,
      responses,
      score: calculateOverallScore(responses, questions.length),
      completedAt: new Date().toISOString()
    };
    onComplete(results);
  }
};

const handlePrevious = () => {
  if (currentQuestionIndex > 0) {
    setCurrentQuestionIndex(currentQuestionIndex - 1);
  }
};
```

**Visual Layout**:

```
┌─────────────────────────────────────────┐
│   SAFE-8 AI Readiness Assessment        │
│   ADVANCED Level                         │
├─────────────────────────────────────────┤
│                                          │
│   Live AI Maturity Score: 72%           │
│   ████████████████░░░░░░░░░░ 72%        │
│                                          │
├─────────────────────────────────────────┤
│   Progress                               │
│   Question 15 of 45                      │
│   ████████░░░░░░░░░░░░░░░░░░ 33%        │
├─────────────────────────────────────────┤
│                                          │
│   How mature is your organization's     │
│   AI governance framework?               │
│                                          │
│   ┌───────┐ ┌───────┐ ┌───────┐        │
│   │   1   │ │   2   │ │   3   │ ...    │
│   │Strongly│ │Disagree│ │Neutral│        │
│   │Disagree│ │       │ │       │        │
│   └───────┘ └───────┘ └───────┘        │
│                                          │
├─────────────────────────────────────────┤
│   [◄ Previous]         [Next ►]         │
└─────────────────────────────────────────┘
```

**Props**:
```javascript
{
  assessmentType: string,
  userId: number,
  questions: array (optional),
  responses: object (optional),
  currentQuestionIndex: number (optional),
  onResponse: (questionId, value) => void,
  onComplete: (results) => void
}
```

**Loading State**:
```javascript
if (isLoading) {
  return (
    <div className="loading-container">
      <i className="fas fa-spinner fa-spin"></i>
      <h2>Loading Questions...</h2>
      <p>Please wait while we prepare your assessment.</p>
    </div>
  );
}
```

**Error State**:
```javascript
if (error) {
  return (
    <div className="error-container">
      <i className="fas fa-exclamation-circle"></i>
      <h2>Error Loading Questions</h2>
      <p>{error}</p>
      <button onClick={retryLoad}>Try Again</button>
    </div>
  );
}
```

---

### **5. AssessmentResults.js** - Comprehensive Results Display

**Purpose**: Show detailed assessment results with visualizations

**Calculate Dimension Scores**:
```javascript
const calculateDimensionScores = () => {
  const pillarGroups = {};
  
  // Group responses by pillar
  questions.forEach(q => {
    const pillar = q.dimension_name || q.pillar_name || 'General';
    if (!pillarGroups[pillar]) {
      pillarGroups[pillar] = [];
    }
    if (responses[q.id]) {
      pillarGroups[pillar].push(parseInt(responses[q.id]));
    }
  });
  
  // Calculate average score per pillar (0-100)
  const dimensionScores = Object.entries(pillarGroups).map(([pillar, scores]) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const score = Math.round((avg / 5) * 100);
    return {
      pillar_name: pillar,
      dimension_name: pillar,
      score: score
    };
  });
  
  return dimensionScores;
};
```

**Industry Benchmarks** (Hardcoded):
```javascript
const industryBenchmarks = {
  "Financial Services": { average: 65, bestPractice: 85 },
  "Technology": { average: 75, bestPractice: 90 },
  "Healthcare": { average: 55, bestPractice: 78 },
  "Manufacturing": { average: 60, bestPractice: 82 },
  "Retail & E-commerce": { average: 62, bestPractice: 80 },
  "Energy & Utilities": { average: 52, bestPractice: 75 },
  "Government": { average: 42, bestPractice: 65 },
  "Education": { average: 48, bestPractice: 68 },
  "Professional Services": { average: 58, bestPractice: 76 },
  "Other": { average: 55, bestPractice: 75 }
};
```

**Score Categories**:
```javascript
function getScoreCategory(score) {
  if (score >= 80) return {
    status: 'AI Leader',
    description: 'Your organization demonstrates advanced AI maturity'
  };
  if (score >= 60) return {
    status: 'AI Adopter',
    description: 'Your organization is actively adopting AI capabilities'
  };
  if (score >= 40) return {
    status: 'AI Explorer',
    description: 'Your organization is exploring AI opportunities'
  };
  return {
    status: 'AI Starter',
    description: 'Your organization is beginning its AI journey'
  };
}
```

**Visual Sections**:

**1. Overall Score Card** (Hero Section):
```javascript
<div className="score-hero">
  <div className="score-circle">{score}%</div>
  <h2>{scoreCategory.status}</h2>
  <p>{scoreCategory.description}</p>
  <p className="benchmark">
    Industry Average: {benchmark.average}% | 
    Best Practice: {benchmark.bestPractice}%
  </p>
</div>
```

**2. SAFE-8 Radar Chart** (8 Dimensions):
```javascript
import { Radar } from 'react-chartjs-2';

const radarData = {
  labels: dimensionScores.map(d => d.pillar_name),
  datasets: [
    {
      label: 'Your Score',
      data: dimensionScores.map(d => d.score)
    },
    {
      label: 'Industry Best Practice',
      data: dimensionScores.map(() => benchmark.bestPractice)
    },
    {
      label: 'Industry Average',
      data: dimensionScores.map(() => benchmark.average)
    }
  ]
};

<Radar data={radarData} options={chartOptions} />
```
**Note**: Apply your own Chart.js styling configuration

**3. Pillar Breakdown** (Table/Cards):
```javascript
{dimensionScores.map((dimension, index) => (
  <div key={index} className="pillar-row">
    <div className="pillar-name">{dimension.pillar_name}</div>
    <div className="pillar-score">
      <div 
        className="progress-bar" 
        style={{width: `${dimension.score}%`}}
        data-color={getScoreColor(dimension.score)}
      />
      <span>{dimension.score}%</span>
    </div>
  </div>
))}

function getScoreColor(score) {
  if (score >= 80) return 'green';
  if (score >= 60) return 'blue';
  if (score >= 40) return 'yellow';
  return 'red';
}
```

**4. Gap Analysis**:
```javascript
const gapAnalysis = dimensionScores
  .map(dim => ({
    pillar: dim.pillar_name,
    current: dim.score,
    target: benchmark.bestPractice,
    gap: benchmark.bestPractice - dim.score,
    priority: benchmark.bestPractice - dim.score > 30 ? 'High' : 
              benchmark.bestPractice - dim.score > 15 ? 'Medium' : 'Low'
  }))
  .filter(item => item.gap > 0)
  .sort((a, b) => b.gap - a.gap);
```

**5. Risk Assessment**:
```javascript
const riskAssessment = dimensionScores.map(dim => {
  if (dim.score < 40) {
    return {
      pillar: dim.pillar_name,
      risk_level: 'Critical',
      score: dim.score,
      issues: [
        `${dim.pillar_name} maturity is significantly below industry standard`,
        'Immediate action required to build foundational capabilities',
        'High risk of AI initiative failure'
      ]
    };
  } else if (dim.score < 60) {
    return {
      pillar: dim.pillar_name,
      risk_level: 'Moderate',
      score: dim.score,
      issues: [
        `${dim.pillar_name} capabilities need improvement`,
        'Medium risk - address before scaling AI initiatives'
      ]
    };
  }
  return null;
}).filter(Boolean);
```

**6. Service Recommendations**:
```javascript
const serviceRecommendations = [];

if (dimensionScores.some(d => d.pillar_name.includes('Strategy') && d.score < 70)) {
  serviceRecommendations.push({
    category: 'AI Strategy & Roadmap',
    priority: 'High',
    services: [
      'AI Readiness Assessment Deep Dive',
      'AI Strategy Development Workshop',
      'AI Governance Framework Design'
    ],
    timeline: '2-3 months',
    impact: 'Foundation for successful AI adoption'
  });
}

// Add more based on other gaps...
```

**Submit Assessment**:
```javascript
const handleSubmitAssessment = async () => {
  setIsSubmitting(true);
  
  const dimensionScores = calculateDimensionScores();
  const gapAnalysis = calculateGaps(dimensionScores);
  const riskAssessment = calculateRisks(dimensionScores);
  const serviceRecommendations = generateRecommendations(dimensionScores);
  
  try {
    const response = await api.post('/api/assessments/submit-complete', {
      lead_id: userId,
      assessment_type: assessmentType.toUpperCase(),
      industry: leadData.industry,
      overall_score: results.score,
      responses: responses,
      pillar_scores: dimensionScores,
      risk_assessment: riskAssessment,
      service_recommendations: serviceRecommendations,
      gap_analysis: gapAnalysis,
      completion_time_ms: completionTime,
      metadata: {
        questions_count: questions.length,
        completed_at: new Date().toISOString()
      }
    });
    
    if (response.data.success) {
      setIsSubmitted(true);
      console.log('✅ Assessment submitted:', response.data.assessmentId);
    }
  } catch (error) {
    console.error('❌ Error submitting assessment:', error);
    setSubmitError('Failed to save assessment. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

**Action Buttons**:
```javascript
<div className="action-buttons">
  {!isSubmitted && (
    <button 
      onClick={handleSubmitAssessment}
      disabled={isSubmitting}
      className="btn-primary"
    >
      {isSubmitting ? 'Saving...' : 'Save Assessment Results'}
    </button>
  )}
  
  <button onClick={onRestart} className="btn-secondary">
    Take Another Assessment
  </button>
  
  <button onClick={downloadPDF} className="btn-secondary">
    Download PDF Report
  </button>
</div>
```

**Props**:
```javascript
{
  results: {
    score: number,
    responses: object,
    assessmentType: string,
    completedAt: string
  },
  leadData: object,
  assessmentType: string,
  userId: number,
  onRestart: () => void
}
```

---

### **6. UserDashboard.js** - User History & Stats

**Purpose**: Show user's assessment history and engagement stats

**Load Dashboard Data**:
```javascript
useEffect(() => {
  const loadDashboard = async () => {
    try {
      const response = await api.get(`/api/user-engagement/dashboard/${user.id}`);
      setStats(response.data.stats);
      setRecentAssessments(response.data.recentAssessments);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };
  
  loadDashboard();
}, [user.id]);
```

**Stats Cards**:
```javascript
<div className="stats-grid">
  <div className="stat-card">
    <div className="stat-icon">
      <i className="fas fa-clipboard-check"></i>
    </div>
    <div className="stat-value">{stats.total_assessments}</div>
    <div className="stat-label">Total Assessments</div>
  </div>
  
  <div className="stat-card">
    <div className="stat-icon">
      <i className="fas fa-chart-line"></i>
    </div>
    <div className="stat-value">{stats.highest_score}%</div>
    <div className="stat-label">Highest Score</div>
  </div>
  
  <div className="stat-card">
    <div className="stat-icon">
      <i className="fas fa-calendar-alt"></i>
    </div>
    <div className="stat-value">
      {formatDate(stats.last_assessment_date)}
    </div>
    <div className="stat-label">Last Assessment</div>
  </div>
  
  <div className="stat-card">
    <div className="stat-icon">
      <i className="fas fa-clock"></i>
    </div>
    <div className="stat-value">
      {Math.round(stats.avg_completion_time_minutes)} min
    </div>
    <div className="stat-label">Avg. Completion Time</div>
  </div>
</div>
```

**Assessment History Table**:
```javascript
<table className="assessment-history">
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
    {assessments.map(assessment => (
      <tr key={assessment.id}>
        <td>{formatDate(assessment.completed_at)}</td>
        <td className="capitalize">{assessment.assessment_type.toLowerCase()}</td>
        <td>{assessment.industry}</td>
        <td>
          <span className={`score-badge ${getScoreBadgeClass(assessment.overall_score)}`}>
            {assessment.overall_score}%
          </span>
        </td>
        <td>
          <span className="status-badge completed">Completed</span>
        </td>
        <td>
          <button onClick={() => viewResults(assessment.id)}>
            View Results
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

**Props**:
```javascript
{
  user: {
    id: number,
    contact_name: string,
    email: string,
    company_name: string
  },
  assessments: array,
  onStartNewAssessment: () => void,
  onBack: () => void
}
```

---

### **7. AdminLogin.js** - Admin Authentication

**Purpose**: Secure admin portal access

**Form Fields**:
- Username (text input)
- Password (password input, toggle visibility)

**API Call**:
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');
  
  try {
    const response = await api.post('/api/admin/login', {
      username: formData.username,
      password: formData.password
    });
    
    if (response.data.success) {
      // Store session token
      localStorage.setItem('adminToken', response.data.sessionToken);
      
      // Store admin data
      localStorage.setItem('adminUser', JSON.stringify(response.data.admin));
      
      // Navigate to admin dashboard
      navigate('/admin/dashboard');
    }
  } catch (error) {
    if (error.response?.status === 401) {
      setError('Invalid username or password');
    } else if (error.response?.status === 423) {
      setError('Account locked due to too many failed attempts');
    } else {
      setError('Login failed. Please try again.');
    }
  } finally {
    setIsLoading(false);
  }
};
```

**Visual Design**:
- Centered login card
- Professional form layout
- Clear error messages
- Loading state
- "Back to Home" link

---

### **8. AdminDashboard.js** - Admin Control Panel

**Purpose**: Manage users, questions, and view analytics

**Session Verification**:
```javascript
useEffect(() => {
  const verifySession = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    try {
      const response = await api.get('/api/admin/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        // Session expired
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
      }
    }
  };
  
  verifySession();
}, []);
```

**Dashboard Stats**:
```javascript
<div className="admin-stats">
  <div className="stat-card">
    <h3>Total Users</h3>
    <div className="big-number">{stats.totalUsers}</div>
  </div>
  <div className="stat-card">
    <h3>Total Assessments</h3>
    <div className="big-number">{stats.totalAssessments}</div>
  </div>
  <div className="stat-card">
    <h3>New Users Today</h3>
    <div className="big-number">{stats.newUsersToday}</div>
  </div>
  <div className="stat-card">
    <h3>Assessments Today</h3>
    <div className="big-number">{stats.assessmentsToday}</div>
  </div>
</div>
```

**User Management Section**:
```javascript
const [users, setUsers] = useState([]);
const [currentPage, setCurrentPage] = useState(1);
const [searchTerm, setSearchTerm] = useState('');

useEffect(() => {
  const loadUsers = async () => {
    const response = await api.get('/api/admin/users', {
      params: {
        page: currentPage,
        limit: 20,
        search: searchTerm
      }
    });
    setUsers(response.data.users);
    setTotalPages(response.data.totalPages);
  };
  
  loadUsers();
}, [currentPage, searchTerm]);
```

**Navigation Tabs**:
```javascript
const [activeTab, setActiveTab] = useState('dashboard');
// Values: 'dashboard' | 'users' | 'questions' | 'analytics'

<nav className="admin-nav">
  <button 
    className={activeTab === 'dashboard' ? 'active' : ''}
    onClick={() => setActiveTab('dashboard')}
  >
    Dashboard
  </button>
  <button 
    className={activeTab === 'users' ? 'active' : ''}
    onClick={() => setActiveTab('users')}
  >
    Users
  </button>
  <button 
    className={activeTab === 'questions' ? 'active' : ''}
    onClick={() => setActiveTab('questions')}
  >
    Questions
  </button>
</nav>
```

---

### **9. QuestionManager.js** - Question CRUD Interface

**Purpose**: Admin interface for managing assessment questions

**Load Questions**:
```javascript
useEffect(() => {
  const loadQuestions = async () => {
    const response = await api.get('/api/admin/questions', {
      params: {
        type: selectedType,  // 'core' | 'advanced' | 'frontier'
        active: true
      }
    });
    setQuestions(response.data.questions);
  };
  
  loadQuestions();
}, [selectedType]);
```

**Create Question**:
```javascript
const handleCreateQuestion = async (questionData) => {
  try {
    const response = await api.post('/api/admin/questions', {
      question_text: questionData.text,
      assessment_type: questionData.type.toUpperCase(),
      pillar_name: questionData.pillar,
      dimension_name: questionData.dimension,
      question_order: questionData.order
    });
    
    if (response.data.success) {
      // Refresh question list
      loadQuestions();
      closeModal();
    }
  } catch (error) {
    console.error('Error creating question:', error);
  }
};
```

**Update Question**:
```javascript
const handleUpdateQuestion = async (questionId, questionData) => {
  try {
    const response = await api.put(`/api/admin/questions/${questionId}`, questionData);
    
    if (response.data.success) {
      loadQuestions();
      closeModal();
    }
  } catch (error) {
    console.error('Error updating question:', error);
  }
};
```

**Delete Question** (Soft Delete):
```javascript
const handleDeleteQuestion = async (questionId) => {
  if (!confirm('Are you sure you want to delete this question?')) return;
  
  try {
    const response = await api.delete(`/api/admin/questions/${questionId}`);
    
    if (response.data.success) {
      loadQuestions();
    }
  } catch (error) {
    console.error('Error deleting question:', error);
  }
};
```

**Question Form Modal**:
```javascript
<Modal isOpen={showModal} onClose={closeModal}>
  <form onSubmit={handleSubmit}>
    <div className="form-group">
      <label>Question Text *</label>
      <textarea 
        value={formData.text}
        onChange={(e) => setFormData({...formData, text: e.target.value})}
        rows={4}
        required
      />
    </div>
    
    <div className="form-group">
      <label>Assessment Type *</label>
      <select 
        value={formData.type}
        onChange={(e) => setFormData({...formData, type: e.target.value})}
        required
      >
        <option value="">Select type...</option>
        <option value="core">Core</option>
        <option value="advanced">Advanced</option>
        <option value="frontier">Frontier</option>
      </select>
    </div>
    
    <div className="form-group">
      <label>Pillar *</label>
      <select 
        value={formData.pillar}
        onChange={(e) => setFormData({...formData, pillar: e.target.value})}
        required
      >
        <option value="">Select pillar...</option>
        <option value="Strategy & Alignment">Strategy & Alignment</option>
        <option value="Governance & Ethics">Governance & Ethics</option>
        <option value="Data Foundation">Data Foundation</option>
        <option value="Technology Infrastructure">Technology Infrastructure</option>
        <option value="Talent & Culture">Talent & Culture</option>
        <option value="Security & Risk">Security & Risk</option>
        <option value="Operations & Integration">Operations & Integration</option>
        <option value="Innovation & Scaling">Innovation & Scaling</option>
      </select>
    </div>
    
    <div className="form-group">
      <label>Question Order *</label>
      <input 
        type="number"
        value={formData.order}
        onChange={(e) => setFormData({...formData, order: e.target.value})}
        min="1"
        required
      />
    </div>
    
    <div className="button-group">
      <button type="button" onClick={closeModal}>Cancel</button>
      <button type="submit" className="btn-primary">
        {editMode ? 'Update Question' : 'Create Question'}
      </button>
    </div>
  </form>
</Modal>
```

---

## 🎨 STYLING REQUIREMENTS

**CRITICAL**: Apply **Forvis Mazars branding guidelines and styling** throughout the entire application.

**Key Styling Considerations**:
- Follow Forvis Mazars brand identity (colors, typography, logo usage)
- Professional, trustworthy corporate design
- Consistent with Forvis Mazars digital properties
- Mobile-first responsive design
- Accessible color contrasts (WCAG AA compliant)
- Consistent spacing and typography per brand guidelines
- Smooth transitions and professional interactions

**Refer to official Forvis Mazars brand guidelines for**:
- Primary and secondary color palettes
- Typography specifications (fonts, sizes, weights)
- Button styles and interactive elements
- Card and container designs
- Logo placement and usage rules
- Iconography standards
- Gradient and background treatments

---

## 🔧 API SERVICE CONFIGURATION

**src/services/api.js**:
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add admin token to requests if exists
api.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken');
  if (token && config.url.includes('/admin/')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && window.location.pathname.includes('/admin/')) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**src/config/api.js**:
```javascript
export const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
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
```

---

## 📱 RESPONSIVE DESIGN

**Mobile-First Approach**:
- Base styles for mobile (320px+)
- Tablet adjustments (768px+)
- Desktop enhancements (1024px+)

**Key Considerations**:
1. Single-column layouts on mobile
2. Touch-friendly interactive elements (min 44px height)
3. Collapsible navigation
4. Optimized form inputs for mobile keyboards
5. Multi-column layouts on desktop
6. Keyboard shortcuts where appropriate

---

## ✅ TESTING CHECKLIST

### **User Flow Testing**:
- [ ] New user registration works
- [ ] Login with correct credentials works
- [ ] Login with wrong password shows error
- [ ] Account lockout after 5 failed attempts
- [ ] Assessment type selection works
- [ ] Industry selection works
- [ ] Questions load correctly
- [ ] Responses save immediately
- [ ] Live score updates as user answers
- [ ] Previous/Next navigation works
- [ ] Assessment completion triggers results
- [ ] Results display correctly
- [ ] Radar chart renders properly
- [ ] Save assessment works
- [ ] User dashboard loads history
- [ ] Logout works

### **Admin Flow Testing**:
- [ ] Admin login works
- [ ] Session token stored correctly
- [ ] Dashboard stats load
- [ ] User list loads with pagination
- [ ] User search works
- [ ] Question list loads
- [ ] Create question works
- [ ] Edit question works
- [ ] Delete question works
- [ ] Activity log displays
- [ ] Session expiry redirects to login

### **Edge Cases**:
- [ ] Handles network errors gracefully
- [ ] Shows loading states
- [ ] Validates all form inputs
- [ ] Prevents duplicate submissions
- [ ] Handles empty states
- [ ] Works offline (graceful degradation)

---

## 🚀 DEPLOYMENT

### **Environment Variables**:
Create `.env` file:
```
REACT_APP_API_URL=http://localhost:5000
```

For production:
```
REACT_APP_API_URL=https://your-backend-url.com
```

### **Build for Production**:
```bash
npm run build
```

### **Deploy to Azure Static Web Apps**:
1. Build creates `build/` folder
2. Upload to Azure Static Web Apps
3. Configure custom domain
4. Enable HTTPS
5. Set environment variables

---

## 📦 PACKAGE.JSON

```json
{
  "name": "safe-8-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "axios": "^1.3.0",
    "chart.js": "^4.2.0",
    "react-chartjs-2": "^5.2.0"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": ["react-app"]
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": ["last 1 chrome version", "last 1 firefox version", "last 1 safari version"]
  }
}
```

---

## 🎯 SUCCESS CRITERIA

**Functionality**: ✅
- All user flows work end-to-end
- API integration is seamless
- Data persists correctly
- Real-time features work

**Performance**: ✅
- Page load < 2 seconds
- Smooth transitions
- No lag during assessment
- Optimized images and assets

**User Experience**: ✅
- Intuitive navigation
- Clear error messages
- Helpful loading states
- Professional appearance
- Mobile-friendly

**Code Quality**: ✅
- Clean, commented code
- Reusable components
- Proper error handling
- Consistent styling
- TypeScript optional but recommended

---

## 🎨 UI/UX PRINCIPLES

**Apply your own design system with these functional principles**:
- Clear visual hierarchy
- Consistent spacing and layouts
- Intuitive navigation
- Purposeful use of color and typography
- Professional appearance
- Focus on data visualization clarity
- Mobile-responsive approach

---

## 📝 FINAL NOTES

**You Are Building**: A complete React frontend that connects to an existing Express.js backend API.

**Critical Success Factors**:
1. **API Integration**: All endpoints work correctly
2. **User Experience**: Smooth, intuitive flow
3. **Forvis Mazars Branding**: Professional styling per brand guidelines
4. **Mobile Responsive**: Works on all devices
5. **Error Handling**: Graceful failures
6. **Data Visualization**: Clear, informative charts

**Start With**: 
1. Set up project structure
2. Create API service layer
3. Build WelcomeScreen
4. Implement authentication
5. Build assessment flow
6. Add results visualization
7. Create admin panel
8. Test everything
9. Polish and optimize

**Remember**:
- Backend is ready and working ✅
- Focus on frontend excellence
- Apply Forvis Mazars branding guidelines throughout
- User experience is critical
- Test on real devices

---

## 🚀 LET'S BUILD THIS!

You have everything you need:
- ✅ Complete API specification
- ✅ Component requirements
- ✅ User flows
- ✅ Testing checklist

**Create a professional React application styled with Forvis Mazars branding guidelines!**

---

END OF FRONTEND BUILD SPECIFICATION
