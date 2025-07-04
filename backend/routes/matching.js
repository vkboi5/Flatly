import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { getPotentialMatches, checkMutualMatch, calculateMatchScore, fixOrphanedMatches } from '../utils/matching.js';

const router = express.Router();

// Get potential matches for the current user
router.get('/potential', authenticate, async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        
        // Check if user has completed their profile
        if (!req.user.isProfileComplete) {
            return res.status(400).json({ message: 'Please complete your profile first' });
        }
        
        const matches = await getPotentialMatches(req.user, User, parseInt(limit));
        
        res.json({
            matches,
            count: matches.length,
            hasMore: matches.length === parseInt(limit)
        });
    } catch (error) {
        console.error('Get potential matches error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Handle user swipe (like or dislike)
router.post('/swipe', authenticate, async (req, res) => {
    try {
        const { targetUserId, action } = req.body;
        
        if (!targetUserId || !action) {
            return res.status(400).json({ message: 'Target user ID and action are required' });
        }
        
        if (!['like', 'dislike'].includes(action)) {
            return res.status(400).json({ message: 'Action must be either "like" or "dislike"' });
        }
        
        // Check if target user exists
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: 'Target user not found' });
        }
        
        // Check if user has already swiped on this person
        const currentUser = await User.findById(req.user._id);
        const alreadyLiked = currentUser.likedUsers.includes(targetUserId);
        const alreadyDisliked = currentUser.dislikedUsers.includes(targetUserId);
        
        if (alreadyLiked || alreadyDisliked) {
            return res.status(400).json({ message: 'You have already swiped on this user' });
        }
        
        // Update user's swipe history
        let updateQuery = {};
        if (action === 'like') {
            updateQuery = { $push: { likedUsers: targetUserId } };
        } else {
            updateQuery = { $push: { dislikedUsers: targetUserId } };
        }
        
        await User.findByIdAndUpdate(req.user._id, updateQuery);
        
        // If it's a like, check for mutual match
        let matchResult = { isMatch: false, matchScore: 0 };
        if (action === 'like') {
            // Refetch updated currentUser to get the latest likedUsers array
            const updatedCurrentUser = await User.findById(req.user._id);
            matchResult = await checkMutualMatch(updatedCurrentUser, targetUser, User);
        }
        
        res.json({
            message: `${action === 'like' ? 'Liked' : 'Disliked'} user successfully`,
            action,
            targetUserId,
            isMatch: matchResult.isMatch,
            matchScore: matchResult.matchScore
        });
    } catch (error) {
        console.error('Swipe error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's matches
router.get('/matches', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('matches.user', 'name age city profilePicture instagramHandle bio userType')
            .select('matches');
        
        // Sort matches by creation date (newest first)
        const matches = user.matches.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json({
            matches,
            count: matches.length
        });
    } catch (error) {
        console.error('Get matches error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get detailed match information
router.get('/match/:matchId', authenticate, async (req, res) => {
    try {
        const { matchId } = req.params;
        
        const user = await User.findById(req.user._id);
        const match = user.matches.id(matchId);
        
        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }
        
        // Get full user details for the match
        const matchUser = await User.findById(match.user)
            .select('name age city profilePicture instagramHandle bio userType');
        
        res.json({
            match: {
                id: match._id,
                user: matchUser,
                matchScore: match.matchScore,
                createdAt: match.createdAt
            }
        });
    } catch (error) {
        console.error('Get match details error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove/unmatch a user
router.delete('/match/:matchId', authenticate, async (req, res) => {
    try {
        const { matchId } = req.params;
        
        const user = await User.findById(req.user._id);
        const match = user.matches.id(matchId);
        
        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }
        
        const otherUserId = match.user;
        
        // Remove match from current user
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { matches: { _id: matchId } }
        });
        
        // Remove match from other user
        await User.findByIdAndUpdate(otherUserId, {
            $pull: { matches: { user: req.user._id } }
        });
        
        res.json({ message: 'Match removed successfully' });
    } catch (error) {
        console.error('Remove match error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's swipe history
router.get('/swipe-history', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('likedUsers', 'name age city profilePicture userType')
            .populate('dislikedUsers', 'name age city profilePicture userType')
            .select('likedUsers dislikedUsers');
        
        res.json({
            liked: user.likedUsers,
            disliked: user.dislikedUsers,
            likedCount: user.likedUsers.length,
            dislikedCount: user.dislikedUsers.length
        });
    } catch (error) {
        console.error('Get swipe history error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Calculate match score between current user and another user
router.get('/score/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        
        const otherUser = await User.findById(userId);
        if (!otherUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const matchScore = calculateMatchScore(req.user, otherUser);
        
        res.json({
            matchScore,
            userA: req.user.name,
            userB: otherUser.name
        });
    } catch (error) {
        console.error('Calculate match score error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset swipe history (for development/testing)
router.post('/reset-swipes', authenticate, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            $set: {
                likedUsers: [],
                dislikedUsers: [],
                matches: []
            }
        });
        
        res.json({ message: 'Swipe history reset successfully' });
    } catch (error) {
        console.error('Reset swipes error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Temporary endpoint to fix orphaned matches
router.post('/fix-orphaned-matches', authenticate, async (req, res) => {
    try {
        const fixedCount = await fixOrphanedMatches(User);
        res.json({ 
            message: `Fixed ${fixedCount} orphaned matches`,
            fixedCount 
        });
    } catch (error) {
        console.error('Fix orphaned matches error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router; 