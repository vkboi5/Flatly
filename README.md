# Flatly - Roommate Matching MVP

A compatibility-based roommate matching platform built with the MERN stack.

## Project Structure

```
Flatly/
├── frontend/          # React frontend with Vite
├── backend/           # Node.js backend with Express
```

## Features

- **Two-step onboarding**: "Tell us about you" + "Your ideal roommate" questionnaires
- **Vector-based matching**: Cosine similarity algorithm for compatibility scoring
- **Swipe interface**: Tinder-like matching experience
- **Chat system**: Basic messaging for mutual matches
- **Mobile-first**: Responsive design optimized for mobile devices

## Tech Stack

### Frontend
- React with Vite
- TailwindCSS for styling
- Axios for API calls
- React Router for navigation

### Backend
- Node.js with Express
- MongoDB for database
- Vector-based matching algorithm
- RESTful API endpoints

## Database Structure

### Users Table
- user_id
- name
- age
- photo_url
- city
- self_vector (array)
- desired_vector (array)
- created_at

### Matches Table
- match_id
- user_a_id
- user_b_id
- match_score
- matched_on

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

### Development

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

## Matching Algorithm

The matching score is calculated using:
```javascript
match_score = cosine_similarity(your_self_vector vs their_self_vector) * 
              cosine_similarity(your_desired_vector vs their_self_vector) * 
              cosine_similarity(their_desired_vector vs your_self_vector)
```

Only users with a match score > 0.7 are displayed.

## Development Progress

See the project todos for current development status and next steps. 