import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Listing from '../models/Listing.js';
import { 
    triggerReplacementCheck, 
    getReplacementStats, 
    markReplacementFulfilled 
} from '../utils/replacementMonitor.js';

const router = express.Router();

// Manual trigger for replacement check (admin/testing purposes)
router.post('/check-deadlines', authenticate, async (req, res) => {
    try {
        console.log('Manual replacement check triggered by user:', req.user._id);
        await triggerReplacementCheck();
        res.json({ message: 'Replacement deadline check completed' });
    } catch (error) {
        console.error('Error in manual replacement check:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get replacement statistics
router.get('/stats', authenticate, async (req, res) => {
    try {
        const stats = await getReplacementStats();
        res.json({ stats });
    } catch (error) {
        console.error('Error getting replacement stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark replacement as fulfilled
router.post('/fulfill/:listingId', authenticate, async (req, res) => {
    try {
        const { listingId } = req.params;
        await markReplacementFulfilled(listingId);
        res.json({ message: 'Replacement marked as fulfilled' });
    } catch (error) {
        console.error('Error marking replacement as fulfilled:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// TEST ROUTE: Set replacement deadline to past date (for testing expiration)
router.post('/test-expire/:listingId', authenticate, async (req, res) => {
    try {
        const { listingId } = req.params;
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
        
        await Listing.findByIdAndUpdate(listingId, {
            replacementDeadline: pastDate,
            replacementStatus: 'active',
            replacementNotified: false
        });
        
        res.json({ 
            message: 'Replacement deadline set to past date for testing',
            newDeadline: pastDate
        });
    } catch (error) {
        console.error('Error setting test expiration:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// TEST ROUTE: Set replacement deadline to near future (for testing notifications)
router.post('/test-notify/:listingId', authenticate, async (req, res) => {
    try {
        const { listingId } = req.params;
        const nearFuture = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
        
        await Listing.findByIdAndUpdate(listingId, {
            replacementDeadline: nearFuture,
            replacementStatus: 'active',
            replacementNotified: false
        });
        
        res.json({ 
            message: 'Replacement deadline set to 2 days from now for testing notifications',
            newDeadline: nearFuture
        });
    } catch (error) {
        console.error('Error setting test notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router; 