import cron from 'node-cron';
import Listing from '../models/Listing.js';
import User from '../models/User.js';

// Check replacement listings approaching deadline
export const checkReplacementDeadlines = async () => {
    try {
        console.log('Running replacement deadline check...');
        
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        
        // Find replacement listings that are:
        // 1. Active
        // 2. Approaching deadline (within 3 days)
        // 3. Not yet notified
        const approachingDeadline = await Listing.find({
            isReplacementListing: true,
            replacementStatus: 'active',
            status: 'active',
            replacementDeadline: { $lte: threeDaysFromNow, $gt: now },
            replacementNotified: false
        }).populate('owner', 'name email');
        
        console.log(`Found ${approachingDeadline.length} replacement listings approaching deadline`);
        
        for (const listing of approachingDeadline) {
            // Calculate days remaining
            const daysRemaining = Math.ceil((listing.replacementDeadline - now) / (1000 * 60 * 60 * 24));
            
            console.log(`Listing ${listing._id} has ${daysRemaining} days remaining`);
            
            // Mark as notified
            await Listing.findByIdAndUpdate(listing._id, {
                replacementNotified: true
            });
            
            // Here you would typically send email notification
            // For now, we'll just log it
            console.log(`Notification sent to ${listing.owner.email} for listing "${listing.title}"`);
        }
        
        // Find expired replacement listings
        const expiredListings = await Listing.find({
            isReplacementListing: true,
            replacementStatus: 'active',
            replacementDeadline: { $lt: now }
        }).populate('owner', 'name email');
        
        console.log(`Found ${expiredListings.length} expired replacement listings`);
        
        for (const listing of expiredListings) {
            // Extend deadline by 7 more days and mark as extended
            const newDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            
            await Listing.findByIdAndUpdate(listing._id, {
                replacementDeadline: newDeadline,
                replacementStatus: 'extended',
                replacementNotified: false
            });
            
            console.log(`Extended deadline for listing ${listing._id} by 7 days`);
        }
        
        console.log('Replacement deadline check completed');
        
    } catch (error) {
        console.error('Error checking replacement deadlines:', error);
    }
};

// Mark replacement as fulfilled when listing gets rented
export const markReplacementFulfilled = async (listingId) => {
    try {
        const listing = await Listing.findById(listingId);
        
        if (listing && listing.isReplacementListing) {
            await Listing.findByIdAndUpdate(listingId, {
                replacementStatus: 'fulfilled'
            });
            
            console.log(`Marked replacement listing ${listingId} as fulfilled`);
        }
    } catch (error) {
        console.error('Error marking replacement as fulfilled:', error);
    }
};

// Get replacement statistics
export const getReplacementStats = async () => {
    try {
        const stats = await Listing.aggregate([
            {
                $match: { isReplacementListing: true }
            },
            {
                $group: {
                    _id: '$replacementStatus',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        return stats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
        }, {});
    } catch (error) {
        console.error('Error getting replacement stats:', error);
        return {};
    }
};

// Initialize replacement monitoring
export const initializeReplacementMonitoring = () => {
    console.log('Initializing replacement monitoring...');
    
    // Run every day at 9 AM
    cron.schedule('0 9 * * *', () => {
        console.log('Running daily replacement deadline check...');
        checkReplacementDeadlines();
    });
    
    // Run every hour during business hours (9 AM - 6 PM)
    cron.schedule('0 9-18 * * *', () => {
        console.log('Running hourly replacement check...');
        checkReplacementDeadlines();
    });
    
    console.log('Replacement monitoring initialized');
};

// Manual trigger for testing
export const triggerReplacementCheck = async () => {
    console.log('Manually triggering replacement check...');
    await checkReplacementDeadlines();
}; 