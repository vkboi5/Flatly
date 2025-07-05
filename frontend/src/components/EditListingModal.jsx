import React, { useState, useEffect } from 'react';
import { listingsService } from '../services/listings';
import toast from 'react-hot-toast';
import { X, Save, DollarSign, Home, MapPin } from 'lucide-react';

const EditListingModal = ({ listing, isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        roomType: '',
        rent: '',
        roomSize: '',
        city: '',
        area: '',
        amenities: [],
        status: 'active'
    });
    const [loading, setLoading] = useState(false);

    const availableAmenities = [
        'WiFi', 'AC', 'Heating', 'Laundry', 'Parking', 'Gym', 'Pool', 
        'Balcony', 'Security', 'Elevator', 'Kitchen', 'Furnished', 
        'Cleaning', 'Utilities', 'Pet Friendly', 'Wheelchair Accessible'
    ];

    const roomTypes = [
        { value: 'private-room', label: 'Private Room' },
        { value: 'shared-room', label: 'Shared Room' },
        { value: 'studio', label: 'Studio' },
        { value: '1bhk', label: '1 BHK' },
        { value: '2bhk', label: '2 BHK' },
        { value: '3bhk', label: '3 BHK' }
    ];

    const statusOptions = [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'rented', label: 'Rented' }
    ];

    useEffect(() => {
        if (listing) {
            setFormData({
                title: listing.title || '',
                description: listing.description || '',
                roomType: listing.roomType || '',
                rent: listing.rent || '',
                roomSize: listing.roomSize || '',
                city: listing.city || '',
                area: listing.area || '',
                amenities: listing.amenities || [],
                status: listing.status || 'active'
            });
        }
    }, [listing]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAmenityToggle = (amenity) => {
        setFormData(prev => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim() || !formData.description.trim() || !formData.rent) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            
            // Prepare data for API
            const updateData = {
                ...formData,
                rent: parseInt(formData.rent),
                roomSize: formData.roomSize ? parseInt(formData.roomSize) : undefined
            };

            await listingsService.updateListing(listing.id, updateData);
            toast.success('Listing updated successfully');
            onSave(); // Callback to refresh listings
            onClose();
        } catch (error) {
            toast.error('Failed to update listing');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-xl font-bold text-gray-900">
                        Edit Listing
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Cozy 2BHK near Metro Station"
                            required
                        />
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Describe your room and what makes it special..."
                            required
                        />
                    </div>

                    {/* Room Type and Rent */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Room Type *
                            </label>
                            <select
                                name="roomType"
                                value={formData.roomType}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">Select room type</option>
                                {roomTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Monthly Rent (₹) *
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="number"
                                    name="rent"
                                    value={formData.rent}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="15000"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                City *
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Mumbai"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Area *
                            </label>
                            <input
                                type="text"
                                name="area"
                                value={formData.area}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Andheri West"
                                required
                            />
                        </div>
                    </div>

                    {/* Room Size and Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Room Size (sq ft)
                            </label>
                            <div className="relative">
                                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="number"
                                    name="roomSize"
                                    value={formData.roomSize}
                                    onChange={handleInputChange}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {statusOptions.map(status => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Amenities */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Amenities
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {availableAmenities.map(amenity => (
                                <label key={amenity} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={formData.amenities.includes(amenity)}
                                        onChange={() => handleAmenityToggle(amenity)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">{amenity}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditListingModal; 