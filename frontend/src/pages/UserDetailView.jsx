import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profile';
import { listingsService } from '../services/listings';
import toast from 'react-hot-toast';
import { 
    ArrowLeft, 
    MapPin, 
    Instagram, 
    Heart, 
    MessageCircle, 
    Home, 
    Bed, 
    Users, 
    DollarSign, 
    Calendar,
    Eye,
    ChevronLeft,
    ChevronRight,
    Phone,
    Mail
} from 'lucide-react';
import { getProfilePictureUrl } from '../utils/api';

const UserDetailView = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [userDetails, setUserDetails] = useState(null);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedListing, setSelectedListing] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        loadUserDetails();
    }, [userId]);

    const loadUserDetails = async () => {
        try {
            setLoading(true);
            const data = await profileService.getUserDetailed(userId);
            setUserDetails(data.user);
            setListings(data.listings || []);
            if (data.listings && data.listings.length > 0) {
                setSelectedListing(data.listings[0]);
            }
        } catch (error) {
            toast.error('Failed to load user details');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const nextImage = () => {
        if (selectedListing && selectedListing.hasImages && selectedListing.imageCount > 0) {
            setCurrentImageIndex((prev) => 
                prev >= (selectedListing.imageCount - 1) ? 0 : prev + 1
            );
        }
    };

    const prevImage = () => {
        if (selectedListing && selectedListing.hasImages && selectedListing.imageCount > 0) {
            setCurrentImageIndex((prev) => 
                prev === 0 ? (selectedListing.imageCount - 1) : prev - 1
            );
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!userDetails) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">User not found</h2>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900">Profile Details</h1>
                        <div className="w-16"></div> {/* Spacer for centering */}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* User Profile Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            {/* Profile Picture */}
                            <div className="relative h-64 bg-gradient-to-b from-gray-200 to-gray-300">
                                {userDetails.hasProfilePicture ? (
                                    <img 
                                        src={`${getProfilePictureUrl(userDetails.id)}?t=${Date.now()}`}
                                        alt={userDetails.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Users className="w-16 h-16 text-gray-400" />
                                    </div>
                                )}
                            </div>

                            {/* Profile Info */}
                            <div className="p-6">
                                <div className="text-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                        {userDetails.name}, {userDetails.age}
                                    </h2>
                                    <div className="flex items-center justify-center text-gray-600 mb-2">
                                        <MapPin className="w-4 h-4 mr-1" />
                                        <span>{userDetails.city}</span>
                                    </div>
                                    <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full capitalize">
                                        {userDetails.userType?.replace('-', ' ')}
                                    </span>
                                </div>

                                {/* Bio */}
                                {userDetails.bio && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-2">About</h3>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            {userDetails.bio}
                                        </p>
                                    </div>
                                )}

                                {/* Instagram */}
                                {userDetails.instagramHandle && (
                                    <div className="mb-6">
                                        <div className="flex items-center text-gray-600">
                                            <Instagram className="w-4 h-4 mr-2" />
                                            <span className="text-sm">@{userDetails.instagramHandle}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Listings Section */}
                    <div className="lg:col-span-2">
                        {listings.length > 0 ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-gray-900">Available Rooms</h2>
                                    <span className="text-sm text-gray-600">
                                        {listings.length} {listings.length === 1 ? 'listing' : 'listings'}
                                    </span>
                                </div>

                                {/* Selected Listing Detail */}
                                {selectedListing && (
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                        {/* Image Gallery */}
                                        {selectedListing.hasImages && selectedListing.imageCount > 0 ? (
                                            <div className="relative h-64 sm:h-80">
                                                <img
                                                    src={listingsService.getListingImageUrl(selectedListing.id, currentImageIndex)}
                                                    alt={selectedListing.title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        // Show fallback if image fails to load
                                                        e.target.style.display = 'none';
                                                        e.target.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                                
                                                {/* Fallback for failed image */}
                                                <div className="hidden w-full h-full bg-gray-200 flex items-center justify-center">
                                                    <div className="text-center">
                                                        <Home className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                                                        <p className="text-gray-500 text-sm">Image not available</p>
                                                    </div>
                                                </div>
                                                
                                                {/* Image Navigation - Only show if multiple images */}
                                                {selectedListing.imageCount > 1 && (
                                                    <>
                                                        <button
                                                            onClick={prevImage}
                                                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                                                        >
                                                            <ChevronLeft className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={nextImage}
                                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                                                        >
                                                            <ChevronRight className="w-5 h-5" />
                                                        </button>

                                                        {/* Image Indicators */}
                                                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                                                            {Array.from({ length: selectedListing.imageCount }).map((_, index) => (
                                                                <button
                                                                    key={index}
                                                                    onClick={() => setCurrentImageIndex(index)}
                                                                    className={`w-2 h-2 rounded-full transition-opacity ${
                                                                        currentImageIndex === index 
                                                                            ? 'bg-white' 
                                                                            : 'bg-white bg-opacity-50'
                                                                    }`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </>
                                                )}
                                                
                                                {/* Image Counter */}
                                                <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                                                    {currentImageIndex + 1} / {selectedListing.imageCount}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-64 bg-gray-200 flex items-center justify-center">
                                                <div className="text-center">
                                                    <Home className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                                                    <p className="text-gray-500">No photos available</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Listing Details */}
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                        {selectedListing.title}
                                                    </h3>
                                                    <div className="flex items-center text-gray-600 text-sm mb-2">
                                                        <MapPin className="w-4 h-4 mr-1" />
                                                        <span>{selectedListing.area}, {selectedListing.city}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-bold text-green-600">
                                                        {formatRent(selectedListing.rent)}
                                                    </div>
                                                    <div className="text-sm text-gray-600">per month</div>
                                                </div>
                                            </div>

                                            {/* Room Details */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                    <Bed className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                                                    <div className="text-sm font-semibold text-gray-900 capitalize">
                                                        {selectedListing.roomType.replace('-', ' ')}
                                                    </div>
                                                </div>
                                                {selectedListing.roomSize && (
                                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                        <Home className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {selectedListing.roomSize} sq ft
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                    <Eye className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {selectedListing.views} views
                                                    </div>
                                                </div>
                                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                    <Calendar className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {formatDate(selectedListing.createdAt)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div className="mb-6">
                                                <h4 className="text-lg font-semibold text-gray-900 mb-2">Description</h4>
                                                <p className="text-gray-600 leading-relaxed">
                                                    {selectedListing.description}
                                                </p>
                                            </div>

                                            {/* Amenities */}
                                            {selectedListing.amenities && selectedListing.amenities.length > 0 && (
                                                <div className="mb-6">
                                                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h4>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                        {selectedListing.amenities.map((amenity, index) => (
                                                            <div 
                                                                key={index}
                                                                className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg"
                                                            >
                                                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                                                {amenity}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Other Listings */}
                                {listings.length > 1 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Available Rooms</h3>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {listings.filter(listing => listing.id !== selectedListing?.id).map((listing) => (
                                                <div 
                                                    key={listing.id}
                                                    onClick={() => {
                                                        setSelectedListing(listing);
                                                        setCurrentImageIndex(0);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                                                >
                                                    {/* Thumbnail */}
                                                    <div className="h-32 bg-gray-200 flex items-center justify-center">
                                                        {listing.hasImages ? (
                                                            <img
                                                                src={listingsService.getListingImageUrl(listing.id, 0)}
                                                                alt={listing.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <Home className="w-8 h-8 text-gray-400" />
                                                        )}
                                                    </div>
                                                    
                                                    <div className="p-4">
                                                        <h4 className="font-semibold text-gray-900 mb-1 truncate">
                                                            {listing.title}
                                                        </h4>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-gray-600 capitalize">
                                                                {listing.roomType.replace('-', ' ')}
                                                            </span>
                                                            <span className="font-bold text-green-600">
                                                                {formatRent(listing.rent)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                                <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings available</h3>
                                <p className="text-gray-600">
                                    This user hasn't posted any room listings yet.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetailView; 