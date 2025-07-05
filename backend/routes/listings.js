import express from 'express';
import multer from 'multer';
import Listing from '../models/Listing.js';
import { authenticate } from '../middleware/auth.js';
import { markReplacementFulfilled } from '../utils/replacementMonitor.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check MIME type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const mimeTypeValid = allowedMimeTypes.includes(file.mimetype);
        
        // Check file extension
        const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
        const extensionValid = allowedExtensions.test(file.originalname);
        
        console.log('File upload validation:', {
            filename: file.originalname,
            mimetype: file.mimetype,
            mimeTypeValid,
            extensionValid
        });
        
        if (mimeTypeValid && extensionValid) {
            return cb(null, true);
        } else {
            cb(new Error(`Only image files are allowed. Received: ${file.mimetype}, filename: ${file.originalname}`));
        }
    }
});

// Create a new listing
router.post('/', authenticate, upload.array('images', 5), async (req, res) => {
    try {
        const {
            title,
            description,
            roomType,
            rent,
            roomSize,
            city,
            area,
            amenities,
            isReplacementListing
        } = req.body;

        // Validate required fields
        if (!title || !description || !roomType || !rent || !city || !area) {
            return res.status(400).json({ 
                message: 'Missing required fields' 
            });
        }

        // Parse amenities if it's a string
        let amenitiesArray = [];
        if (amenities) {
            try {
                amenitiesArray = JSON.parse(amenities);
            } catch (e) {
                amenitiesArray = Array.isArray(amenities) ? amenities : [];
            }
        }

        // Process uploaded images
        const images = [];
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                images.push({
                    data: file.buffer,
                    contentType: file.mimetype
                });
            });
        }

        const isReplacement = isReplacementListing === 'true';
        
        const listing = new Listing({
            owner: req.user._id,
            title,
            description,
            roomType,
            rent: parseInt(rent),
            roomSize: roomSize ? parseInt(roomSize) : undefined,
            city,
            area,
            amenities: amenitiesArray,
            images,
            isReplacementListing: isReplacement,
            // Set replacement deadline if this is a replacement listing
            replacementDeadline: isReplacement ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : null,
            replacementStatus: isReplacement ? 'active' : 'pending'
        });

        await listing.save();

        res.status(201).json({
            message: 'Listing created successfully',
            listing: {
                id: listing._id,
                title: listing.title,
                rent: listing.rent,
                city: listing.city,
                status: listing.status,
                createdAt: listing.createdAt
            }
        });
    } catch (error) {
        console.error('Create listing error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all listings (with filters)
router.get('/', authenticate, async (req, res) => {
    try {
        const {
            city,
            roomType,
            minRent,
            maxRent,
            amenities,
            status = 'active',
            page = 1,
            limit = 10
        } = req.query;

        const filter = { status };

        // Add filters
        if (city) {
            filter.city = { $regex: new RegExp(city, 'i') };
        }
        if (roomType) {
            filter.roomType = roomType;
        }
        if (minRent || maxRent) {
            filter.rent = {};
            if (minRent) filter.rent.$gte = parseInt(minRent);
            if (maxRent) filter.rent.$lte = parseInt(maxRent);
        }
        if (amenities) {
            const amenitiesArray = amenities.split(',');
            filter.amenities = { $in: amenitiesArray };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const listings = await Listing.find(filter)
            .populate('owner', 'name age city profilePictureData')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('-images'); // Don't send image data in list

        const total = await Listing.countDocuments(filter);

        res.json({
            listings,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Get listings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a specific listing
router.get('/:id', authenticate, async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id)
            .populate('owner', 'name age city profilePictureData bio instagramHandle');

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Increment views
        listing.views += 1;
        await listing.save();

        // Return listing with image info but without actual image data
        const listingResponse = {
            ...listing.toObject(),
            hasImages: listing.images && listing.images.length > 0,
            imageCount: listing.images ? listing.images.length : 0
        };
        
        // Remove image data to reduce response size
        delete listingResponse.images;

        res.json({ listing: listingResponse });
    } catch (error) {
        console.error('Get listing error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's own listings
router.get('/user/my-listings', authenticate, async (req, res) => {
    try {
        const rawListings = await Listing.find({ owner: req.user._id })
            .sort({ createdAt: -1 });

        // Transform listings to include image metadata but not actual image data
        const listings = rawListings.map(listing => ({
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
            updatedAt: listing.updatedAt,
            hasImages: listing.images && listing.images.length > 0,
            imageCount: listing.images ? listing.images.length : 0,
            interestedUsersCount: listing.interestedUsers ? listing.interestedUsers.length : 0
        }));

        res.json({ listings });
    } catch (error) {
        console.error('Get user listings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a listing
router.put('/:id', authenticate, async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Check if user owns the listing
        if (listing.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const updates = req.body;
        delete updates.owner; // Prevent changing owner

        const updatedListing = await Listing.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).select('-images');

        // Check if listing status changed to 'rented' and mark replacement as fulfilled
        if (updates.status === 'rented' && updatedListing.isReplacementListing) {
            await markReplacementFulfilled(req.params.id);
        }

        res.json({
            message: 'Listing updated successfully',
            listing: updatedListing
        });
    } catch (error) {
        console.error('Update listing error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a listing
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Check if user owns the listing
        if (listing.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Listing.findByIdAndDelete(req.params.id);

        res.json({ message: 'Listing deleted successfully' });
    } catch (error) {
        console.error('Delete listing error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Serve listing images (no auth needed for public images)
router.get('/:id/images/:imageIndex', async (req, res) => {
    try {
        const { id, imageIndex } = req.params;
        
        // Validate inputs
        if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid listing ID' });
        }
        
        if (isNaN(imageIndex) || imageIndex < 0) {
            return res.status(400).json({ message: 'Invalid image index' });
        }
        
        const listing = await Listing.findById(id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        if (!listing.images || !listing.images[imageIndex]) {
            return res.status(404).json({ message: 'Image not found' });
        }

        const image = listing.images[imageIndex];
        
        // Set proper headers for image serving
        res.set('Content-Type', image.contentType || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        res.set('Access-Control-Allow-Origin', '*');
        
        res.send(image.data);
    } catch (error) {
        console.error('Get listing image error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Express interest in a listing
router.post('/:id/interest', authenticate, async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Check if user is not the owner
        if (listing.owner.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot express interest in your own listing' });
        }

        // Add user to interested users if not already there
        if (!listing.interestedUsers.includes(req.user._id)) {
            listing.interestedUsers.push(req.user._id);
            await listing.save();
        }

        res.json({ message: 'Interest expressed successfully' });
    } catch (error) {
        console.error('Express interest error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add more images to existing listing
router.post('/:id/images', authenticate, upload.array('images', 5), async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Check if user owns the listing
        if (listing.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this listing' });
        }

        // Check if files were uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No images provided' });
        }

        // Check total image limit (max 5 images per listing)
        const currentImageCount = listing.images ? listing.images.length : 0;
        const newImageCount = req.files.length;
        
        if (currentImageCount + newImageCount > 5) {
            return res.status(400).json({ 
                message: `Cannot add ${newImageCount} images. Maximum 5 images allowed. Current: ${currentImageCount}` 
            });
        }

        // Process uploaded images
        const newImages = [];
        for (const file of req.files) {
            newImages.push({
                data: file.buffer,
                contentType: file.mimetype
            });
        }

        // Add new images to existing ones
        if (!listing.images) {
            listing.images = [];
        }
        listing.images.push(...newImages);
        await listing.save();

        res.json({
            message: `Successfully added ${newImageCount} image(s)`,
            totalImages: listing.images ? listing.images.length : 0
        });
    } catch (error) {
        console.error('Add images error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete specific image from listing
router.delete('/:id/images/:imageIndex', authenticate, async (req, res) => {
    try {
        const { id, imageIndex } = req.params;
        
        const listing = await Listing.findById(id);

        if (!listing) {
            return res.status(404).json({ message: 'Listing not found' });
        }

        // Check if user owns the listing
        if (listing.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to edit this listing' });
        }

        // Validate image index
        const index = parseInt(imageIndex);
        const imageCount = listing.images ? listing.images.length : 0;
        if (isNaN(index) || index < 0 || index >= imageCount) {
            return res.status(400).json({ message: 'Invalid image index' });
        }

        // Ensure images array exists
        if (!listing.images || listing.images.length === 0) {
            return res.status(400).json({ message: 'No images to delete' });
        }

        // Remove the image
        listing.images.splice(index, 1);
        await listing.save();

        res.json({
            message: 'Image deleted successfully',
            remainingImages: listing.images ? listing.images.length : 0
        });
    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Debug route - check if listings have images
router.get('/debug/images', authenticate, async (req, res) => {
    try {
        const listings = await Listing.find({}).select('title images');
        const debug = listings.map(listing => ({
            id: listing._id,
            title: listing.title,
            hasImages: listing.images && listing.images.length > 0,
            imageCount: listing.images ? listing.images.length : 0,
            imagesSample: listing.images ? listing.images.slice(0, 1).map(img => ({
                contentType: img.contentType,
                dataSize: img.data ? img.data.length : 0
            })) : []
        }));
        
        res.json({ 
            total: listings.length,
            withImages: debug.filter(l => l.hasImages).length,
            listings: debug 
        });
    } catch (error) {
        console.error('Debug images error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Debug route - check replacement listings
router.get('/debug/replacements', authenticate, async (req, res) => {
    try {
        const replacementListings = await Listing.find({
            isReplacementListing: true
        }).populate('owner', 'name email').select('title isReplacementListing replacementDeadline replacementStatus replacementNotified status createdAt owner');
        
        const debug = replacementListings.map(listing => ({
            id: listing._id,
            title: listing.title,
            owner: listing.owner.name,
            ownerEmail: listing.owner.email,
            status: listing.status,
            replacementStatus: listing.replacementStatus,
            replacementDeadline: listing.replacementDeadline,
            replacementNotified: listing.replacementNotified,
            createdAt: listing.createdAt,
            daysRemaining: listing.replacementDeadline ? 
                Math.ceil((new Date(listing.replacementDeadline) - new Date()) / (1000 * 60 * 60 * 24)) : null
        }));
        
        res.json({ 
            total: replacementListings.length,
            listings: debug 
        });
    } catch (error) {
        console.error('Debug replacements error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router; 