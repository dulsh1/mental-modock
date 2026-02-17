# Mental Modock - Mental Health & Productivity Application

A comprehensive MERN stack application featuring AI-powered mental health analysis, smart task management, and personalized wellness coaching.

![Mental Modock](https://img.shields.io/badge/Version-1.0.0-blue) ![MERN](https://img.shields.io/badge/Stack-MERN-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

## 🌟 Features

### Feature 1: Mental Health Analyst 🧠
- **Basic**: Daily mood, energy, and stress logging with journal entries
- **Advanced**: Predictive Stress Alert System
  - ML-based stress spike prediction using linear regression
  - Pattern analysis for proactive alerts ("Based on your pattern, tomorrow may be high stress due to task load")
  - Interactive stress trend visualization with Chart.js

### Feature 2: Smart Task Manager 📝
- **Basic**: Full CRUD operations with due dates and priorities
- **Advanced**: AI-Powered Task Breakdown & Scheduling
  - OpenAI/Cohere integration for intelligent subtask suggestions
  - Example: "Study for Database exam" → "Review notes (1h), Practice SQL (2h), Past papers (2h)"
  - Automatic scheduling based on productive time patterns from journal data
  - Smart task prioritization

### Feature 3: Integration & Wellness Coach 🌱
- **Basic**: Unified dashboard showing mood and tasks
- **Advanced**: Personalized Wellness Intervention Engine
  - Rule engine for context-aware interventions
  - "High stress detected. Try: 5-min breathing (launches guided timer)"
  - "Low energy + many tasks → Suggest: Pomodoro timer with breaks"
  - Guided breathing exercises (4-7-8, Box Breathing, etc.)
  - Meditation sessions with progress tracking
  - Pomodoro timer with customizable focus/break intervals

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js, Tailwind CSS, Chart.js, React Router |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose ODM |
| AI Integration | OpenAI API / Cohere |
| ML/Statistics | simple-statistics library |
| Authentication | JWT (JSON Web Tokens) |

## 📁 Project Structure

```
mental-modock/
├── client/                          # React Frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Reusable UI components
│   │   │   │   ├── Card.js
│   │   │   │   ├── Layout.js
│   │   │   │   └── LoadingSpinner.js
│   │   │   ├── auth/                # Authentication components
│   │   │   │   └── PrivateRoute.js
│   │   │   ├── dashboard/           # Dashboard components
│   │   │   │   ├── StatsOverview.js
│   │   │   │   ├── MoodChart.js
│   │   │   │   ├── QuickActions.js
│   │   │   │   ├── RecentActivity.js
│   │   │   │   └── StressAlert.js
│   │   │   ├── mental-health/       # Mental health features
│   │   │   │   ├── MoodTracker.js
│   │   │   │   ├── EnergySlider.js
│   │   │   │   ├── StressIndicator.js
│   │   │   │   └── JournalEntry.js
│   │   │   ├── tasks/               # Task management
│   │   │   │   ├── TaskCard.js
│   │   │   │   ├── TaskForm.js
│   │   │   │   └── AITaskBreakdown.js
│   │   │   └── wellness/            # Wellness features
│   │   │       ├── PomodoroTimer.js
│   │   │       ├── BreathingExercise.js
│   │   │       ├── GuidedMeditation.js
│   │   │       └── WellnessIntervention.js
│   │   ├── context/
│   │   │   ├── AuthContext.js       # Authentication state
│   │   │   └── ThemeContext.js      # Dark/Light theme
│   │   ├── hooks/
│   │   │   └── useCustomHooks.js    # Custom React hooks
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── MentalHealthLog.js
│   │   │   ├── Analytics.js
│   │   │   ├── Tasks.js
│   │   │   ├── WellnessCoach.js
│   │   │   └── Settings.js
│   │   ├── services/
│   │   │   ├── api.js               # Axios configuration
│   │   │   └── services.js          # API service functions
│   │   ├── utils/
│   │   │   └── helpers.js           # Utility functions
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── server/                          # Express Backend
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   └── constants.js             # App constants
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── mentalHealth.controller.js
│   │   ├── task.controller.js
│   │   ├── wellness.controller.js
│   │   └── dashboard.controller.js
│   ├── middleware/
│   │   ├── auth.js                  # JWT authentication
│   │   ├── validate.js              # Request validation
│   │   └── errorHandler.js          # Error handling
│   ├── models/
│   │   ├── User.js
│   │   ├── MentalHealthLog.js
│   │   ├── Task.js
│   │   ├── StressPrediction.js
│   │   └── WellnessIntervention.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── mentalHealth.routes.js
│   │   ├── task.routes.js
│   │   ├── wellness.routes.js
│   │   └── dashboard.routes.js
│   ├── services/
│   │   ├── ml/                      # Machine Learning
│   │   │   ├── predictionService.js # Stress prediction
│   │   │   └── patternAnalyzer.js   # Pattern detection
│   │   ├── ai/                      # AI Integration
│   │   │   ├── taskBreakdownService.js
│   │   │   └── schedulingService.js
│   │   └── wellness/                # Wellness Engine
│   │       ├── interventionEngine.js
│   │       └── exercises.js
│   └── index.js                     # Server entry point
│
├── package.json                     # Root package.json
├── .env.example                     # Environment template
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn
- OpenAI API key (optional, for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/mental-modock.git
   cd mental-modock
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server && npm install
   
   # Install client dependencies
   cd ../client && npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example env file
   cp .env.example .env
   
   # Edit .env with your values
   MONGODB_URI=mongodb://localhost:27017/mental-modock
   JWT_SECRET=your-super-secret-jwt-key
   OPENAI_API_KEY=your-openai-api-key
   PORT=5000
   ```

4. **Run the application**
   ```bash
   # From the root directory
   npm run dev
   ```
   This starts both the server (port 5000) and client (port 3000) concurrently.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run both server and client in development |
| `npm run server` | Run only the server |
| `npm run client` | Run only the client |
| `npm run build` | Build the client for production |

## 📊 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Mental Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mental-health/logs` | Get all logs |
| GET | `/api/mental-health/logs/today` | Get today's log |
| POST | `/api/mental-health/logs` | Create new log |
| PUT | `/api/mental-health/logs/:id` | Update log |
| GET | `/api/mental-health/analytics` | Get analytics |
| GET | `/api/mental-health/prediction` | Get stress prediction |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| POST | `/api/tasks/:id/breakdown` | AI task breakdown |
| GET | `/api/tasks/schedule` | Get smart schedule |

### Wellness
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/wellness/interventions` | Get interventions |
| GET | `/api/wellness/exercises` | Get exercises |
| POST | `/api/wellness/activity` | Log wellness activity |
| GET | `/api/wellness/stats` | Get wellness stats |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get dashboard data |
| GET | `/api/dashboard/summary` | Get weekly summary |

## 🧠 AI/ML Features

### Stress Prediction Algorithm
Uses linear regression and pattern analysis on:
- Historical mood/energy/stress data
- Sleep patterns
- Task completion rates
- Time-of-day patterns

### Task Breakdown Service
Integrates with OpenAI to:
- Analyze task complexity
- Suggest logical subtasks
- Estimate time for each subtask
- Consider user's productive hours

### Intervention Engine
Rule-based system that:
- Monitors real-time stress levels
- Triggers contextual interventions
- Adapts recommendations based on history

## 🎨 UI Components

### Wellness Tools
- **Pomodoro Timer**: 25/5 minute work/break cycles with customization
- **Breathing Exercises**: 4-7-8, Box Breathing, and more
- **Guided Meditation**: Various durations and focus types

### Visualizations
- **Mood Chart**: Line charts for mood/energy trends
- **Stress Indicator**: Real-time stress level display
- **Stats Overview**: Key metrics at a glance

## 🔒 Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Input validation and sanitization

## 📱 Responsive Design
Built with Tailwind CSS for:
- Mobile-first approach
- Dark/Light theme support
- Accessible UI components

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License.

## 👏 Acknowledgments
- OpenAI for AI capabilities
- Chart.js for data visualization
- Tailwind CSS for styling
- MongoDB for database

---

Made with ❤️ for mental wellness and productivity
