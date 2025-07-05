import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listingsService } from '../services/listings';
import { 
    Home, 
    MapPin, 
    Bed, 
    Users, 
    Camera, 
    X, 
    Plus, 
    Trash2, 
    Save,
    ArrowLeft,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const AddListing = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        roomType: '',
        rent: '',
        roomSize: '',
        city: '',
        area: '',
        amenities: [],
        images: [],
        isReplacementListing: false
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [errors, setErrors] = useState({});

    const roomTypeOptions = [
        { value: 'private-room', label: 'Private Room' },
        { value: 'shared-room', label: 'Shared Room' },
        { value: 'studio', label: 'Studio Apartment' },
        { value: '1bhk', label: '1 BHK' },
        { value: '2bhk', label: '2 BHK' },
        { value: '3bhk', label: '3 BHK' }
    ];

    const amenitiesOptions = [
        'WiFi', 'AC', 'Heating', 'Laundry', 'Parking', 'Gym', 'Pool', 
        'Balcony', 'Security', 'Elevator', 'Kitchen', 'Furnished', 
        'Cleaning', 'Utilities', 'Pet Friendly', 'Wheelchair Accessible'
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleAmenitiesChange = (amenity) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files).slice(0, 5 - imageFiles.length);
        if (files.length + imageFiles.length > 5) {
            toast.error('You can upload a maximum of 5 images');
            return;
        }

        const validFiles = files.filter(file => {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is too large. Maximum size is 5MB`);
                return false;
            }
            return true;
        });

        setImageFiles(prev => [...prev, ...validFiles]);
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.title) newErrors.title = 'Title is required';
        if (!formData.description) newErrors.description = 'Description is required';
        if (!formData.roomType) newErrors.roomType = 'Room type is required';
        if (!formData.rent) newErrors.rent = 'Rent amount is required';
        if (!formData.city) newErrors.city = 'City is required';
        if (!formData.area) newErrors.area = 'Area is required';
        if (imageFiles.length === 0) newErrors.images = 'At least one image is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSubmitting(true);

        try {
            // Create FormData for file upload
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('roomType', formData.roomType);
            submitData.append('rent', formData.rent);
            submitData.append('roomSize', formData.roomSize);
            submitData.append('city', formData.city);
            submitData.append('area', formData.area);
            submitData.append('amenities', JSON.stringify(formData.amenities));
            submitData.append('isReplacementListing', formData.isReplacementListing);

            // Append images
            imageFiles.forEach((file, index) => {
                submitData.append('images', file);
            });

            // Call the API
            await listingsService.createListing(submitData);

            toast.success('Listing posted successfully!');
            navigate('/app');
        } catch (error) {
            console.error('Error posting listing:', error);
            const errorMessage = error.response?.data?.message || 'Failed to post listing. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Post Your Room</h1>
                    <p className="text-gray-600 mt-2">Share details about your room with potential roommates</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Replacement Listing Section */}
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Replacement Listing</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Are you looking to replace a current roommate?
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.isReplacementListing}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            isReplacementListing: e.target.checked
                                        }))}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            {formData.isReplacementListing && (
                                <div className="mt-4 p-3 bg-blue-100 rounded-md">
                                    <div className="flex items-start">
                                        <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-blue-900">14-Day Replacement Guarantee</p>
                                            <p className="text-sm text-blue-700 mt-1">
                                                We'll help you find a replacement roommate within 14 days or less!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Basic Details */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Listing Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            errors.title ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="e.g., Cozy 2BHK near Metro"
                                    />
                                    {errors.title && (
                                        <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Room Type *
                                    </label>
                                    <select
                                        name="roomType"
                                        value={formData.roomType}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            errors.roomType ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    >
                                        <option value="">Select room type</option>
                                        {roomTypeOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.roomType && (
                                        <p className="text-red-500 text-sm mt-1">{errors.roomType}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Monthly Rent (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        name="rent"
                                        value={formData.rent}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            errors.rent ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="e.g., 15000"
                                    />
                                    {errors.rent && (
                                        <p className="text-red-500 text-sm mt-1">{errors.rent}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Room Size (sq ft)
                                    </label>
                                    <input
                                        type="number"
                                        name="roomSize"
                                        value={formData.roomSize}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., 200"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            errors.city ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="e.g., Mumbai"
                                    />
                                    {errors.city && (
                                        <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Area/Locality *
                                    </label>
                                    <input
                                        type="text"
                                        name="area"
                                        value={formData.area}
                                        onChange={handleInputChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                            errors.area ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="e.g., Bandra West"
                                    />
                                    {errors.area && (
                                        <p className="text-red-500 text-sm mt-1">{errors.area}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.description ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder="Describe your room, its features, and what makes it special..."
                            />
                            {errors.description && (
                                <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                            )}
                        </div>

                        {/* Amenities */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Amenities
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {amenitiesOptions.map(amenity => (
                                    <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.amenities.includes(amenity)}
                                            onChange={() => handleAmenitiesChange(amenity)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">{amenity}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Images */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Room Photos * (Max 5)
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="image-upload"
                                />
                                <label htmlFor="image-upload" className="cursor-pointer">
                                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">
                                        Click to upload photos or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        PNG, JPG up to 5MB each
                                    </p>
                                </label>
                            </div>
                            {errors.images && (
                                <p className="text-red-500 text-sm mt-1">{errors.images}</p>
                            )}

                            {/* Image Previews */}
                            {imagePreviews.length > 0 && (
                                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={preview}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-32 object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6 border-t border-gray-200">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Posting...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 mr-2" />
                                        Post Listing
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddListing; 