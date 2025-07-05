import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { listingsService } from '../services/listings';
import toast from 'react-hot-toast';
import { 
    Home, 
    Plus, 
    Edit, 
    Trash2, 
    Eye, 
    Users, 
    MapPin, 
    Calendar,
    DollarSign,
    Camera,
    Upload,
    X,
    ChevronLeft,
    ChevronRight,
    Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EditListingModal from '../components/EditListingModal';

const YourListings = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingListing, setEditingListing] = useState(null);
    const [managingImages, setManagingImages] = useState(null);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        loadListings();
    }, []);

    const loadListings = async () => {
        try {
            setLoading(true);
            const response = await listingsService.getMyListings();
            setListings(response.listings || []);
        } catch (error) {
            toast.error('Failed to load listings');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteListing = async (listingId) => {
        if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
            return;
        }

        try {
            await listingsService.deleteListing(listingId);
            toast.success('Listing deleted successfully');
            loadListings(); // Refresh listings
        } catch (error) {
            toast.error('Failed to delete listing');
            console.error('Error:', error);
        }
    };

    const handleAddImages = async (listingId, files) => {
        try {
            setUploadingImages(true);
            await listingsService.addImages(listingId, files);
            toast.success('Images added successfully');
            loadListings(); // Refresh to get updated image count
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to add images');
            console.error('Error:', error);
        } finally {
            setUploadingImages(false);
        }
    };

    const handleDeleteImage = async (listingId, imageIndex) => {
        if (!window.confirm('Are you sure you want to delete this image?')) {
            return;
        }

        try {
            await listingsService.deleteImage(listingId, imageIndex);
            toast.success('Image deleted successfully');
            loadListings(); // Refresh to get updated image count
            setCurrentImageIndex(0); // Reset to first image
        } catch (error) {
            toast.error('Failed to delete image');
            console.error('Error:', error);
        }
    };

    const formatRent = (rent) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(rent);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const statusStyles = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
            rented: 'bg-blue-100 text-blue-800'
        };
        return `px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.active}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your listings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Listings</h1>
                            <p className="text-gray-600">
                                Manage your room listings, update details, and track performance
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/add-listing')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium flex items-center"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add New Listing
                        </button>
                    </div>
                </div>

                {listings.length === 0 ? (
                    // No listings state
                    <div className="text-center max-w-md mx-auto py-16">
                        <Home className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            No listings yet
                        </h2>
                        <p className="text-gray-600 mb-8">
                            Create your first room listing to start finding roommates!
                        </p>
                        <button
                            onClick={() => navigate('/add-listing')}
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                        >
                            Create Your First Listing
                        </button>
                    </div>
                ) : (
                    // Listings grid
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {listings.map((listing) => (
                            <div 
                                key={listing.id} 
                                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
                            >
                                {/* Listing Image */}
                                <div className="relative h-48 bg-gray-200">
                                    {listing.hasImages ? (
                                        <img
                                            src={listingsService.getListingImageUrl(listing.id, 0)}
                                            alt={listing.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Home className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}
                                    
                                    {/* Status Badges */}
                                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                                        <span className={getStatusBadge(listing.status)}>
                                            {listing.status}
                                        </span>
                                        {listing.isReplacementListing && (
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                14-Day Guarantee
                                            </span>
                                        )}
                                    </div>

                                    {/* Image Count */}
                                    {listing.hasImages && (
                                        <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                                            <Camera className="w-3 h-3 inline mr-1" />
                                            {listing.imageCount}
                                        </div>
                                    )}
                                </div>

                                {/* Listing Content */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-lg text-gray-900 truncate flex-1">
                                            {listing.title}
                                        </h3>
                                        <span className="text-lg font-bold text-green-600 ml-2">
                                            {formatRent(listing.rent)}
                                        </span>
                                    </div>

                                    <div className="flex items-center text-gray-600 text-sm mb-2">
                                        <MapPin className="w-4 h-4 mr-1" />
                                        <span>{listing.area}, {listing.city}</span>
                                    </div>

                                    <div className="text-sm text-gray-600 mb-3 capitalize">
                                        {listing.roomType.replace('-', ' ')} • {listing.roomSize ? `${listing.roomSize} sq ft` : 'Size not specified'}
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-gray-500">
                                        <div className="flex items-center">
                                            <Eye className="w-3 h-3 mr-1" />
                                            <span>{listing.views} views</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Users className="w-3 h-3 mr-1" />
                                            <span>{listing.interestedUsersCount} interested</span>
                                        </div>
                                        <div className="flex items-center">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            <span>{formatDate(listing.createdAt)}</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingListing(listing)}
                                            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
                                        >
                                            <Edit className="w-4 h-4 mr-1" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setManagingImages(listing)}
                                            className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center text-sm"
                                        >
                                            <Camera className="w-4 h-4 mr-1" />
                                            Photos
                                        </button>
                                        <button
                                            onClick={() => handleDeleteListing(listing.id)}
                                            className="bg-red-600 text-white py-2 px-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center text-sm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Edit Listing Modal */}
                <EditListingModal 
                    listing={editingListing}
                    isOpen={!!editingListing}
                    onClose={() => setEditingListing(null)}
                    onSave={loadListings}
                />

                {/* Image Management Modal */}
                {managingImages && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-6 border-b">
                                <h3 className="text-xl font-bold text-gray-900">
                                    Manage Photos - {managingImages.title}
                                </h3>
                                <button
                                    onClick={() => {
                                        setManagingImages(null);
                                        setCurrentImageIndex(0);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6">
                                {/* Upload New Images */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Add More Photos ({managingImages.imageCount}/5)
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files);
                                                if (files.length > 0) {
                                                    handleAddImages(managingImages.id, files);
                                                }
                                            }}
                                            disabled={uploadingImages || managingImages.imageCount >= 5}
                                            className="hidden"
                                            id="image-upload"
                                        />
                                        <label
                                            htmlFor="image-upload"
                                            className={`cursor-pointer flex flex-col items-center justify-center py-4 ${
                                                managingImages.imageCount >= 5 
                                                    ? 'opacity-50 cursor-not-allowed' 
                                                    : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                            <span className="text-sm text-gray-600">
                                                {managingImages.imageCount >= 5 
                                                    ? 'Maximum 5 images allowed'
                                                    : uploadingImages 
                                                        ? 'Uploading...' 
                                                        : 'Click to upload or drag and drop'
                                                }
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Current Images */}
                                {managingImages.hasImages ? (
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Current Photos</h4>
                                        
                                        {/* Main Image Display */}
                                        <div className="relative mb-4">
                                            <div className="h-64 sm:h-80 bg-gray-200 rounded-lg overflow-hidden">
                                                <img
                                                    src={listingsService.getListingImageUrl(managingImages.id, currentImageIndex)}
                                                    alt={`Photo ${currentImageIndex + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            
                                            {/* Navigation - Only show if multiple images */}
                                            {managingImages.imageCount > 1 && (
                                                <>
                                                    <button
                                                        onClick={() => setCurrentImageIndex(prev => 
                                                            prev === 0 ? managingImages.imageCount - 1 : prev - 1
                                                        )}
                                                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                                                    >
                                                        <ChevronLeft className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setCurrentImageIndex(prev => 
                                                            prev >= managingImages.imageCount - 1 ? 0 : prev + 1
                                                        )}
                                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                                                    >
                                                        <ChevronRight className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                            
                                            {/* Image Counter */}
                                            <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                                                {currentImageIndex + 1} / {managingImages.imageCount}
                                            </div>
                                            
                                            {/* Delete Current Image Button */}
                                            <button
                                                onClick={() => handleDeleteImage(managingImages.id, currentImageIndex)}
                                                className="absolute top-4 left-4 bg-red-600 bg-opacity-80 text-white p-2 rounded-full hover:bg-opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        
                                        {/* Thumbnail Navigation */}
                                        {managingImages.imageCount > 1 && (
                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                {Array.from({ length: managingImages.imageCount }).map((_, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => setCurrentImageIndex(index)}
                                                        className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${
                                                            currentImageIndex === index 
                                                                ? 'border-blue-500' 
                                                                : 'border-gray-300'
                                                        }`}
                                                    >
                                                        <img
                                                            src={listingsService.getListingImageUrl(managingImages.id, index)}
                                                            alt={`Thumbnail ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">No photos uploaded yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default YourListings; 