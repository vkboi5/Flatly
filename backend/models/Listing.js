import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
    // Owner information
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Basic listing information
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000
    },
    
    // Room details
    roomType: {
        type: String,
        required: true,
        enum: ['private-room', 'shared-room', 'studio', '1bhk', '2bhk', '3bhk']
    },
    roomSize: {
        type: Number,
        min: 0
    },
    rent: {
        type: Number,
        required: true,
        min: 0
    },
    
    // Location
    city: {
        type: String,
        required: true,
        trim: true
    },
    area: {
        type: String,
        required: true,
        trim: true
    },
    
    // Amenities
    amenities: [{
        type: String,
        enum: [
            'WiFi', 'AC', 'Heating', 'Laundry', 'Parking', 'Gym', 'Pool', 
            'Balcony', 'Security', 'Elevator', 'Kitchen', 'Furnished', 
            'Cleaning', 'Utilities', 'Pet Friendly', 'Wheelchair Accessible'
        ]
    }],
    
    // Images
    images: [{
        data: Buffer,
        contentType: String
    }],
    
    // Special features
    isReplacementListing: {
        type: Boolean,
        default: false
    },
    
    // Replacement tracking
    replacementDeadline: {
        type: Date,
        default: null
    },
    replacementStatus: {
        type: String,
        enum: ['pending', 'active', 'extended', 'fulfilled', 'expired'],
        default: 'pending'
    },
    replacementNotified: {
        type: Boolean,
        default: false
    },
    
    // Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'rented'],
        default: 'active'
    },
    
    // Views and interactions
    views: {
        type: Number,
        default: 0
    },
    interestedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
listingSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for formatted rent
listingSchema.virtual('formattedRent').get(function() {
    return `₹${this.rent.toLocaleString()}`;
});

// Virtual for first image
listingSchema.virtual('mainImage').get(function() {
    return this.images && this.images.length > 0 ? this.images[0] : null;
});

// Ensure virtual fields are serialized
listingSchema.set('toJSON', { virtuals: true });
listingSchema.set('toObject', { virtuals: true });

const Listing = mongoose.model('Listing', listingSchema);

export default Listing; 