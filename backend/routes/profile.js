import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { mapSelfAnswersToVector, mapDesiredAnswersToVector } from '../utils/matching.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profiles/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Update basic profile information
router.put('/update', authenticate, async (req, res) => {
    try {
        const { name, age, city, instagramHandle, bio } = req.body;
        const updates = {};
        
        if (name) updates.name = name.trim();
        if (age) {
            if (age < 18 || age > 100) {
                return res.status(400).json({ message: 'Age must be between 18 and 100' });
            }
            updates.age = parseInt(age);
        }
        if (city) updates.city = city.trim();
        if (instagramHandle !== undefined) updates.instagramHandle = instagramHandle.trim() || null;
        if (bio !== undefined) updates.bio = bio.trim() || null;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');
        
        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                age: user.age,
                city: user.city,
                userType: user.userType,
                isProfileComplete: user.isProfileComplete,
                profilePicture: user.profilePicture,
                instagramHandle: user.instagramHandle,
                bio: user.bio
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload profile picture
router.post('/upload-picture', authenticate, upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { profilePicture: profilePictureUrl },
            { new: true }
        ).select('-password');
        
        res.json({
            message: 'Profile picture uploaded successfully',
            profilePicture: profilePictureUrl,
            user: {
                id: user._id,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error('Profile picture upload error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit self questionnaire
router.post('/questionnaire/self', authenticate, async (req, res) => {
    try {
        const { answers } = req.body;
        
        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({ message: 'Invalid questionnaire answers' });
        }
        
        // Convert answers to vector
        const selfVector = mapSelfAnswersToVector(answers);
        
        // Get current user to check desired vector
        const currentUser = await User.findById(req.user._id);
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { 
                selfVector,
                // Update profile completion status if both vectors exist
                isProfileComplete: selfVector.length > 0 && currentUser.desiredVector.length > 0
            },
            { new: true }
        ).select('-password');
        
        res.json({
            message: 'Self questionnaire submitted successfully',
            selfVector: user.selfVector,
            isProfileComplete: user.isProfileComplete
        });
    } catch (error) {
        console.error('Self questionnaire error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit desired roommate questionnaire
router.post('/questionnaire/desired', authenticate, async (req, res) => {
    try {
        const { answers } = req.body;
        
        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({ message: 'Invalid questionnaire answers' });
        }
        
        // Convert answers to vector
        const desiredVector = mapDesiredAnswersToVector(answers);
        
        // Get current user to check self vector
        const currentUser = await User.findById(req.user._id);
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { 
                desiredVector,
                // Update profile completion status if both vectors exist
                isProfileComplete: desiredVector.length > 0 && currentUser.selfVector.length > 0
            },
            { new: true }
        ).select('-password');
        
        res.json({
            message: 'Desired roommate questionnaire submitted successfully',
            desiredVector: user.desiredVector,
            isProfileComplete: user.isProfileComplete
        });
    } catch (error) {
        console.error('Desired questionnaire error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's own profile
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        res.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                age: user.age,
                city: user.city,
                userType: user.userType,
                isProfileComplete: user.isProfileComplete,
                profilePicture: user.profilePicture,
                instagramHandle: user.instagramHandle,
                bio: user.bio,
                selfVector: user.selfVector,
                desiredVector: user.desiredVector,
                matches: user.matches,
                lastActive: user.lastActive
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get another user's profile (limited info)
router.get('/user/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findById(id).select('name age city profilePicture instagramHandle bio userType');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({
            user: {
                id: user._id,
                name: user.name,
                age: user.age,
                city: user.city,
                userType: user.userType,
                profilePicture: user.profilePicture,
                instagramHandle: user.instagramHandle,
                bio: user.bio
            }
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete profile picture
router.delete('/picture', authenticate, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { profilePicture: null },
            { new: true }
        ).select('-password');
        
        res.json({
            message: 'Profile picture deleted successfully',
            user: {
                id: user._id,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error('Delete profile picture error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router; 