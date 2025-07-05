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

// Configure multer for memory storage (to store in MongoDB)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        console.log('Profile fileFilter - File details:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        });
        
        // Check MIME type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const mimeTypeValid = allowedMimeTypes.includes(file.mimetype);
        
        // Check file extension
        const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
        const extensionValid = allowedExtensions.test(file.originalname);
        
        console.log('Profile fileFilter - Validation:', {
            mimeType: file.mimetype,
            mimeTypeValid,
            extensionValid,
            filename: file.originalname
        });
        
        if (mimeTypeValid && extensionValid) {
            console.log('Profile fileFilter - File accepted');
            return cb(null, true);
        } else {
            console.log('Profile fileFilter - File rejected');
            return cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'));
        }
    }
});

// Update basic profile information
router.put('/update', authenticate, async (req, res) => {
    try {
        const { name, age, city, phoneNumber, instagramHandle, bio, userType, gender } = req.body;
        const updates = {};
        
        if (name) updates.name = name.trim();
        if (age) {
            if (age < 18 || age > 100) {
                return res.status(400).json({ message: 'Age must be between 18 and 100' });
            }
            updates.age = parseInt(age);
        }
        if (city) updates.city = city.trim();
        if (phoneNumber) {
            // Validate phone number format
            const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
            if (!/^[\+]?[1-9][\d]{0,15}$/.test(cleanPhone)) {
                return res.status(400).json({ message: 'Please provide a valid phone number' });
            }
            
            // Check if phone number already exists (exclude current user)
            const existingPhone = await User.findOne({ 
                phoneNumber: cleanPhone,
                _id: { $ne: req.user._id }
            });
            if (existingPhone) {
                return res.status(400).json({ message: 'Phone number is already registered' });
            }
            
            updates.phoneNumber = cleanPhone;
        }
        if (instagramHandle !== undefined) updates.instagramHandle = instagramHandle.trim() || null;
        if (bio !== undefined) updates.bio = bio.trim() || null;
        if (userType) {
            if (!['find-room', 'find-roommate'].includes(userType)) {
                return res.status(400).json({ message: 'Invalid user type' });
            }
            updates.userType = userType;
        }
        if (gender) {
            if (!['male', 'female', 'other'].includes(gender)) {
                return res.status(400).json({ message: 'Invalid gender' });
            }
            updates.gender = gender;
        }
        
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
                phoneNumber: user.phoneNumber,
                gender: user.gender,
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
router.post('/upload-picture', authenticate, (req, res) => {
    upload.single('profilePicture')(req, res, async (err) => {
        if (err) {
            console.error('Profile picture upload error:', err);
            return res.status(400).json({ 
                message: err.message || 'Error uploading profile picture',
                error: err.message 
            });
        }
        
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }
            
            console.log('Profile picture uploaded successfully:', {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            });
            
            // Store image data in MongoDB
            const profilePictureData = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
            
            const user = await User.findByIdAndUpdate(
                req.user._id,
                { 
                    profilePictureData: profilePictureData,
                    profilePicture: null // Clear the old file path
                },
                { new: true }
            ).select('-password');
            
            res.json({
                message: 'Profile picture uploaded successfully',
                user: {
                    id: user._id,
                    profilePicture: null,
                    hasProfilePicture: !!user.profilePictureData
                }
            });
        } catch (error) {
            console.error('Profile picture processing error:', error);
            res.status(500).json({ message: 'Server error while processing profile picture' });
        }
    });
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
        const desiredVector = mapDesiredAnswersToVector(answers, req.user.userType);
        
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
                phoneNumber: user.phoneNumber,
                gender: user.gender,
                userType: user.userType,
                isProfileComplete: user.isProfileComplete,
                profilePicture: user.profilePicture,
                hasProfilePicture: !!user.profilePictureData,
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
        
        const user = await User.findById(id).select('name age city profilePicture profilePictureData instagramHandle bio userType');
        
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
                hasProfilePicture: !!user.profilePictureData,
                instagramHandle: user.instagramHandle,
                bio: user.bio
            }
        });
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get detailed user profile with listings (for room seekers viewing room providers)
router.get('/user/:id/detailed', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate ObjectId
        if (!id || id === 'undefined' || id === 'null' || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        
        const user = await User.findById(id).select('name age city profilePicture profilePictureData instagramHandle bio userType gender');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Get user's listings if they are a room provider (find-roommate)
        let listings = [];
        if (user.userType === 'find-roommate') {
            const Listing = (await import('../models/Listing.js')).default;
            const rawListings = await Listing.find({ 
                owner: id, 
                status: 'active' 
            }).select('-interestedUsers'); // Keep images for counting, exclude interested users for privacy
            
            listings = rawListings.map(listing => ({
                id: listing._id,
                title: listing.title,
                description: listing.description,
                roomType: listing.roomType,
                rent: listing.rent,
                roomSize: listing.roomSize,
                city: listing.city,
                area: listing.area,
                amenities: listing.amenities,
                isReplacementListing: listing.isReplacementListing,
                status: listing.status,
                views: listing.views,
                createdAt: listing.createdAt,
                hasImages: listing.images && listing.images.length > 0,
                imageCount: listing.images ? listing.images.length : 0
            }));
        }
        
        res.json({
            user: {
                id: user._id,
                name: user.name,
                age: user.age,
                city: user.city,
                userType: user.userType,
                gender: user.gender,
                profilePicture: user.profilePicture,
                hasProfilePicture: !!user.profilePictureData,
                instagramHandle: user.instagramHandle,
                bio: user.bio
            },
            listings: listings
        });
    } catch (error) {
        console.error('Get detailed user profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Serve profile picture from MongoDB
router.get('/picture/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Validate ObjectId
        if (!userId || userId === 'undefined' || userId === 'null' || !userId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        
        const user = await User.findById(userId).select('profilePictureData');
        
        if (!user || !user.profilePictureData) {
            return res.status(404).json({ message: 'Profile picture not found' });
        }
        
        // Set proper headers for image serving
        res.set('Content-Type', user.profilePictureData.contentType);
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        
        res.send(user.profilePictureData.data);
    } catch (error) {
        console.error('Get profile picture error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete profile picture
router.delete('/picture', authenticate, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { 
                profilePicture: null,
                profilePictureData: null
            },
            { new: true }
        ).select('-password');
        
        res.json({
            message: 'Profile picture deleted successfully',
            user: {
                id: user._id,
                profilePicture: user.profilePicture,
                hasProfilePicture: false
            }
        });
    } catch (error) {
        console.error('Delete profile picture error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router; 