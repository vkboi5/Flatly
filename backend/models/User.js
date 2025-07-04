import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
    // Authentication fields
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    
    // Profile information
    name: {
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        required: true,
        min: 18,
        max: 100
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(v) {
                // Allow various phone number formats
                return /^[\+]?[1-9][\d]{0,15}$/.test(v.replace(/[\s\-\(\)]/g, ''));
            },
            message: 'Please enter a valid phone number'
        }
    },
    profilePicture: {
        type: String,
        default: null
    },
    // New field for storing profile picture as binary data in MongoDB
    profilePictureData: {
        data: Buffer,
        contentType: String
    },
    instagramHandle: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        maxlength: 500
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true
    },
    preferredGender: {
        type: String,
        enum: ['male', 'female', 'other', 'any'],
        default: 'any'
    },
    
    // User type
    userType: {
        type: String,
        enum: ['find-room', 'find-roommate'],
        default: null
    },
    
    // Questionnaire vectors
    selfVector: {
        type: [Number],
        default: []
    },
    desiredVector: {
        type: [Number],
        default: []
    },
    
    // Profile completion status
    isProfileComplete: {
        type: Boolean,
        default: false
    },
    
    // Activity tracking
    lastActive: {
        type: Date,
        default: Date.now
    },
    
    // Swipe tracking
    likedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dislikedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // Matches
    matches: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        matchScore: {
            type: Number,
            min: 0,
            max: 1
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateToken = function() {
    return jwt.sign(
        { userId: this._id, email: this.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

// Update last active timestamp
userSchema.methods.updateLastActive = function() {
    this.lastActive = new Date();
    return this.save();
};

// Add indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ city: 1 });
userSchema.index({ lastActive: -1 });

export default mongoose.model('User', userSchema); 