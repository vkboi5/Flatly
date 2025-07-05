import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import matchingRoutes from './routes/matching.js';
import listingRoutes from './routes/listings.js';
import replacementRoutes from './routes/replacementRoutes.js';

// Import replacement monitoring
import { initializeReplacementMonitoring } from './utils/replacementMonitor.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving removed - images now stored in MongoDB

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/replacement', replacementRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ message: 'Flatly API is running!', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flatly')
    .then(() => {
        console.log('Connected to MongoDB');
        
        // Initialize replacement monitoring
        initializeReplacementMonitoring();
        
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Database connection error:', error);
        process.exit(1);
    });

export default app; 