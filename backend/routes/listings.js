import express from 'express';
import multer from 'multer';
import Listing from '../models/Listing.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
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
            isReplacementListing: isReplacementListing === 'true'
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

        res.json({ listing });
    } catch (error) {
        console.error('Get listing error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's own listings
router.get('/user/my-listings', authenticate, async (req, res) => {
    try {
        const listings = await Listing.find({ owner: req.user._id })
            .sort({ createdAt: -1 })
            .select('-images');

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

// Serve listing images
router.get('/:id/images/:imageIndex', async (req, res) => {
    try {
        const { id, imageIndex } = req.params;
        const listing = await Listing.findById(id);

        if (!listing || !listing.images[imageIndex]) {
            return res.status(404).json({ message: 'Image not found' });
        }

        const image = listing.images[imageIndex];
        res.set('Content-Type', image.contentType);
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
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

export default router; 