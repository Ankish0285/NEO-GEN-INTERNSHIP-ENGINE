# NEO GEN - Project File Structure

## Project Overview
NEO GEN is a full-stack internship management and ATS (Applicant Tracking System) platform with resume analysis capabilities.

- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: Node.js/Express + MongoDB
- **AI/ML**: Python inside `backend/ai` (scikit-learn + FastAPI, auto-started with backend)

---

## Root Directory Structure

```
NEO GEN/
├── .git/                          # Git repository
├── .venv/                         # Python virtual environment
├── backend/                      # REST API + AI/ML (Node.js + backend/ai)
├── frontend/                     # Frontend (React/Vite)
├── package.json                  # Root workspace config
├── package-lock.json            # Dependencies lock
├── FILE_STRUCTURE.md            # This file
└── FILE_STRUCTURE.pdf           # PDF version
```

---

## 1. FRONTEND (React/Vite Application)

### Path: `/frontend`
Modern React frontend with TailwindCSS styling and Vite bundler.

```
frontend/
├── index.html                    # HTML entry point
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # TailwindCSS configuration
├── postcss.config.js            # PostCSS configuration
├── eslint.config.js             # ESLint configuration
├── package.json                 # Dependencies: React 18, Vite, TailwindCSS, etc.
├── package-lock.json
├── dist/                        # Production build output
├── node_modules/                # Dependencies
└── src/
    ├── main.jsx                 # React app entry point
    ├── App.jsx                  # Root component
    ├── index.css                # Global styles
    │
    ├── components/              # Reusable UI components
    │   ├── ATSScoreCard.jsx     # ATS score display component
    │   ├── Navbar.jsx           # Navigation bar
    │   ├── Footer.jsx           # Footer component
    │   ├── LoginModal.jsx       # Login modal
    │   ├── ResumeUpload.jsx     # Resume upload interface
    │   ├── ErrorMessage.jsx     # Error display component
    │   ├── dashboard/           # Dashboard components
    │   ├── home/                # Home page components
    │   └── ui/                  # Generic UI components
    │
    ├── pages/                   # Page-level components
    │   ├── Home.jsx             # Home page
    │   ├── ResumeTemplates.jsx  # Resume templates page
    │   ├── admin/               # Admin dashboard pages
    │   ├── auth/                # Authentication pages (login, register)
    │   └── dashboard/           # Student/Partner dashboards
    │
    ├── services/                # API service layer
    │   ├── api.js               # Axios instance & base config
    │   ├── authService.js       # Auth API calls
    │   ├── applicationService.js # Application API calls
    │   ├── internshipService.js # Internship API calls
    │   ├── profileService.js    # Profile API calls
    │   ├── resumeService.js     # Resume API calls
    │   ├── messageService.js    # Messaging API calls
    │   ├── notificationService.js # Notification API calls
    │   ├── reviewService.js     # Review API calls
    │   └── dashboardService.js  # Dashboard API calls
    │
    ├── context/                 # React Context for state management
    │   ├── AuthContext.jsx      # Authentication context
    │   └── StudentDashboardContext.jsx # Dashboard state
    │
    ├── routes/                  # Routing configuration
    │   └── AppRoutes.jsx        # Route definitions
    │
    ├── layout/                  # Layout components (headers, sidebars, etc.)
    │
    ├── styles/                  # CSS/Styling files
    │   ├── style.css            # Main stylesheet
    │   ├── admin.css            # Admin-specific styles
    │   ├── atsScore.css         # ATS score styles
    │   ├── resumeUpload.css     # Resume upload styles
    │   ├── chatbot.css          # Chatbot styles
    │   └── ... (other CSS files)
    │
    ├── assets/                  # Static assets
    │   └── images/              # Image files
    │
    └── utils/                   # Utility functions
```
---

## 2. BACKEND (Node.js/Express API)

### Path: `/backend`
RESTful API server for handling business logic, database operations, and file uploads.

```
backend/
├── server.js
├── verify.js
├── package.json
├── package-lock.json
├── .env
├── db.sqlite3
├── node_modules/
├── uploads/
│
├── config/
│   ├── db.js
│   └── cloudinary.js
│
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── internshipController.js
│   ├── applicationController.js
│   ├── guideController.js
│   ├── messageController.js
│   ├── notificationController.js
│   ├── reviewController.js
│   ├── profileController.js
│   ├── dashboardController.js
│   └── atsController.js
│
├── models/
│   ├── User.js
│   ├── TempUser.js
│   ├── Internship.js
│   ├── Application.js
│   ├── Guide.js
│   ├── Message.js
│   ├── Notification.js
│   ├── Review.js
│   ├── Resume.js
│   └── ActivityLog.js
│
├── middleware/
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   └── uploadMiddleware.js
│
├── routes/
│   ├── authRoutes.js
│   ├── adminRoutes.js
│   ├── userRoutes.js
│   ├── internshipRoutes.js
│   ├── applicationRoutes.js
│   ├── guideRoutes.js
│   ├── messageRoutes.js
│   ├── notificationRoutes.js
│   ├── reviewRoutes.js
│   ├── profileRoutes.js
│   ├── dashboardRoutes.js
│   ├── atsRoutes.js             # ATS endpoints (/api/resume)
│   └── uploadRoutes.js          # Upload endpoints (/api/upload)
│
└── utils/                       # Helper functions
    ├── sendEmail.js             # Email sending (Nodemailer)
    ├── parseResume.js           # Resume parsing (PDF/DOCX)
    ├── atsScoring.js            # ATS scoring logic
    ├── validation.js            # Input validation helpers
    └── ensureAdmin.js           # Admin initialization
```

### Backend Technologies
- **Express**: Web framework
- **Mongoose**: MongoDB ODM
- **MongoDB**: NoSQL database
- **JWT**: Authentication tokens
- **Bcryptjs**: Password hashing
- **Multer**: File upload handling
- **Nodemailer**: Email sending
- **Cloudinary**: Image/file hosting
- **Mammoth**: DOCX parsing
- **PDF-Parse**: PDF parsing
- **Axios**: HTTP requests

### API Routes
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth/register | User registration |
| POST | /api/auth/login | User login |
| POST | /api/auth/verify-otp | OTP verification |
| POST | /api/admin/login | Admin login |
| GET | /api/users | Get all users |
| POST | /api/internships | Create internship |
| GET | /api/internships | List internships |
| POST | /api/applications | Apply for internship |
| GET | /api/messages | Get messages |
| GET | /api/dashboard | Get dashboard data |
| POST | /api/resume/analyze | ATS score analysis |

---

## 3. ATS ML BACKEND (Python/Django)

### Path: `/ats-ml-backend`
Machine learning service for resume analysis and ATS scoring using scikit-learn.

```
ats-ml-backend/
├── manage.py                    # Django management script
├── db.sqlite3                   # SQLite database (development)
├── requirements.txt             # Python dependencies
│
├── ats_project/                 # Django project configuration
│   ├── __init__.py
│   ├── settings.py              # Django settings
│   ├── urls.py                  # Project URL routing
│   ├── wsgi.py                  # WSGI configuration
│   └── __pycache__/
│
├── ml/                          # Machine Learning models
│   ├── train_model.py           # Model training script
│   ├── ats_model.pkl            # Trained ML model (pickle)
│   ├── tfidf.pkl                # TF-IDF vectorizer (pickle)
│   └── ats_dataset.csv          # Training dataset
│
└── predictor/                   # Django app for predictions
    ├── apps.py                  # App configuration
    ├── urls.py                  # App URL routing
    ├── views.py                 # View handlers for API endpoints
    ├── ml_loader.py             # ML model loading utilities
    ├── skill_extractor.py       # Skill extraction from resumes
    ├── __pycache__/
    └── migrations/              # Database migrations
```
