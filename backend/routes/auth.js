import express from 'express';
import validator from 'validator';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, age, city, gender } = req.body;
        
        console.log('Registration request body:', req.body);
        
        // Validation
        if (!email || !password || !name || !age || !city || !gender) {
            console.log('Missing fields:', { email: !!email, password: !!password, name: !!name, age: !!age, city: !!city, gender: !!gender });
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        // Check for empty strings
        if (email.trim() === '' || password.trim() === '' || name.trim() === '' || city.trim() === '') {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: 'Please provide a valid email' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        
        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
            return res.status(400).json({ message: 'Age must be between 18 and 100' });
        }
        
        if (!['male', 'female', 'other'].includes(gender)) {
            return res.status(400).json({ message: 'Invalid gender' });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }
        
        // Create new user
        const user = new User({
            email: email.toLowerCase(),
            password,
            name: name.trim(),
            age: parseInt(age),
            city: city.trim(),
            gender: gender // Ensure gender is provided for new users
        });
        
        await user.save();
        
        // Generate token
        const token = user.generateToken();
        
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                age: user.age,
                city: user.city,
                gender: user.gender,
                userType: user.userType,
                isProfileComplete: user.isProfileComplete
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: 'Please provide a valid email' });
        }
        
        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Update last active
        await user.updateLastActive();
        
        // Generate token
        const token = user.generateToken();
        
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                age: user.age,
                city: user.city,
                gender: user.gender,
                userType: user.userType,
                isProfileComplete: user.isProfileComplete,
                profilePicture: user.profilePicture,
                hasProfilePicture: !!user.profilePictureData
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Verify token and get user info
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                age: user.age,
                city: user.city,
                gender: user.gender,
                userType: user.userType,
                isProfileComplete: user.isProfileComplete,
                profilePicture: user.profilePicture,
                hasProfilePicture: !!user.profilePictureData,
                instagramHandle: user.instagramHandle,
                bio: user.bio,
                lastActive: user.lastActive,
                matches: user.matches,
                likedUsers: user.likedUsers,
                dislikedUsers: user.dislikedUsers
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Refresh token
router.post('/refresh', authenticate, async (req, res) => {
    try {
        const token = req.user.generateToken();
        
        res.json({
            message: 'Token refreshed',
            token
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Change password
router.put('/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }
        
        const user = await User.findById(req.user._id);
        
        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        
        // Update password
        user.password = newPassword;
        await user.save();
        
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router; 