# 🏠 Flatly v1 - Roommate Matching App Startup Guide

Welcome to Flatly! This is a complete MERN stack roommate matching application with Tinder-like swipe functionality and compatibility-based matching.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running locally or MongoDB Atlas)
- Git

### Installation & Setup

1. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Setup Environment Variables**
   
   **Backend (.env)** - Update the JWT secret and MongoDB URL if needed:
   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   MONGODB_URI=mongodb://localhost:27017/flatly
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   ```

   **Frontend (.env)** - Already configured:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or start MongoDB service (Windows/Linux)
   sudo systemctl start mongod
   ```

5. **Run the Application**
   
   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   
   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the App**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api

## 📱 Application Flow

### 1. **Registration & Login**
- Users register with name, email, age, city, and user type
- User types: "Find a Room" or "Find a Roommate"
- JWT authentication with secure token management

### 2. **Onboarding**
- Welcome page with CTA buttons
- Optional city selection

### 3. **Self Questionnaire (10 Questions)**
- Cleanliness habits
- Sleep patterns
- Work arrangement
- Food habits
- Party style
- Guest preferences
- Social energy
- Pet tolerance
- Music/noise preferences
- Weekend activities

### 4. **Ideal Roommate Questionnaire (8 Questions)**
- Cleanliness expectations
- Noise tolerance
- Food preferences
- Guest policy
- Chore expectations
- Sleep schedule compatibility
- Deal breakers
- Co-living relationship style

### 5. **Profile Creation**
- Upload profile picture
- Add bio (optional)
- Instagram handle (optional)
- City confirmation

### 6. **Swipe Feed**
- Tinder-like interface
- Cards show:
  - Profile photo
  - Name, age, city
  - Compatibility score (%)
  - Top compatibility tags
  - Bio preview
  - Instagram handle
- Swipe left (❌) to pass
- Swipe right (❤️) to like

### 7. **Matching System**
- Mutual likes create matches
- Cosine similarity algorithm calculates compatibility
- Formula: `selfSimilarity × desiredAtoB × desiredBtoA`

### 8. **Matches Page**
- View all successful matches
- See compatibility scores
- Match timestamps
- Start chat functionality (UI ready)

## 🛠 Technical Features

### Backend
- **Express.js** RESTful API
- **MongoDB** with Mongoose ODM
- **JWT** authentication
- **Multer** file upload handling
- **Cosine similarity** matching algorithm
- **Password hashing** with bcryptjs
- **Input validation** and error handling

### Frontend
- **React 19** with hooks
- **React Router** for navigation
- **TailwindCSS** for styling
- **Axios** for API calls
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **Responsive design** for all devices

### Database Schema
- User profiles with questionnaire vectors
- Swipe history tracking
- Match relationships
- Profile completion status

## 🎯 Key Features

✅ **Complete Authentication Flow**
✅ **10+8 MCQ Questionnaire System**
✅ **Cosine Similarity Matching**
✅ **Tinder-like Swipe Interface**
✅ **Real-time Match Detection**
✅ **Responsive Design**
✅ **Profile Management**
✅ **Image Upload Support**
✅ **Compatibility Scoring**
✅ **Match History**

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```bash
   # Make sure MongoDB is running
   mongod --dbpath /path/to/your/db
   ```

2. **Port Already in Use**
   ```bash
   # Kill process on port 5000
   npx kill-port 5000
   
   # Kill process on port 5173
   npx kill-port 5173
   ```

3. **CORS Issues**
   - Ensure backend CORS is configured for frontend URL
   - Check environment variables

4. **Image Upload Issues**
   - Ensure `backend/uploads/profiles/` directory exists
   - Check file size limits (5MB max)

### Development Tips

- Use browser dev tools to inspect API calls
- Check MongoDB compass for data verification
- Use Postman to test API endpoints
- Check console logs for errors

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `GET /api/auth/me` - Get current user

### Profile
- `PUT /api/profile/update` - Update profile
- `POST /api/profile/upload-picture` - Upload profile picture
- `POST /api/profile/questionnaire/self` - Submit self questionnaire
- `POST /api/profile/questionnaire/desired` - Submit desired questionnaire

### Matching
- `GET /api/matching/potential` - Get potential matches
- `POST /api/matching/swipe` - Handle swipe action
- `GET /api/matching/matches` - Get user matches

## 🔮 Future Enhancements

- Real-time chat system
- Push notifications
- Advanced filters
- Location-based matching
- Video profiles
- Room listing integration
- Payment processing
- Mobile app (React Native)

## 📞 Support

If you encounter any issues:
1. Check this guide first
2. Verify all dependencies are installed
3. Ensure MongoDB is running
4. Check environment variables
5. Look at console logs for errors

---

**Happy Roommate Matching! 🏠✨** 