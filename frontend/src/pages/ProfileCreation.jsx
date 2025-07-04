import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profile';
import toast from 'react-hot-toast';
import { Camera, Upload, User, Instagram, FileText, MapPin } from 'lucide-react';

const ProfileCreation = () => {
    const navigate = useNavigate();
    const { updateUser, user } = useAuth();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState({
        bio: '',
        instagramHandle: '',
        city: user?.city || ''
    });
    const [profilePicture, setProfilePicture] = useState(null);
    const [profilePicturePreview, setProfilePicturePreview] = useState(null);

    const handleInputChange = (e) => {
        setProfileData({
            ...profileData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error('File size should be less than 5MB');
                return;
            }
            
            setProfilePicture(file);
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setProfilePicturePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            // Upload profile picture if selected
            if (profilePicture) {
                await profileService.uploadProfilePicture(profilePicture);
                toast.success('Profile picture uploaded!');
            }

            // Update profile information
            if (profileData.bio || profileData.instagramHandle || profileData.city) {
                await profileService.updateProfile(profileData);
                toast.success('Profile updated!');
            }

            // Get updated user data and mark profile as complete
            const updatedUser = await profileService.getProfile();
            
            // Mark profile as complete locally (backend should handle this automatically)
            const completeUser = {
                ...updatedUser,
                isProfileComplete: true
            };
            
            updateUser(completeUser);
            toast.success('Profile completed! Welcome to Flatly!');
            navigate('/app');
        } catch (error) {
            toast.error('Failed to complete profile');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="w-full max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                            Complete Your Profile
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Add your photo and details to attract compatible roommates
                        </p>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 space-y-8">
                        {/* Profile Picture Section */}
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Profile Picture
                            </h2>
                            
                            <div className="relative inline-block">
                                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                    {profilePicturePreview ? (
                                        <img 
                                            src={profilePicturePreview} 
                                            alt="Profile preview" 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User className="w-12 h-12 text-gray-400" />
                                    )}
                                </div>
                                
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                                
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>
                            
                            <p className="text-sm text-gray-500 mt-2">
                                Upload a clear photo of yourself (Max 5MB)
                            </p>
                        </div>

                        {/* Bio Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FileText className="inline w-4 h-4 mr-2" />
                                Tell us about yourself
                            </label>
                            <textarea
                                name="bio"
                                value={profileData.bio}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="Write a short bio about yourself, your interests, and what you're looking for in a living situation..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500"
                                maxLength={500}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {profileData.bio.length}/500 characters
                            </p>
                        </div>

                        {/* Instagram Handle */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Instagram className="inline w-4 h-4 mr-2" />
                                Instagram Handle (Optional)
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                                    @
                                </span>
                                <input
                                    type="text"
                                    name="instagramHandle"
                                    value={profileData.instagramHandle}
                                    onChange={handleInputChange}
                                    placeholder="yourusername"
                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                                />
                            </div>
                        </div>

                        {/* City Update */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <MapPin className="inline w-4 h-4 mr-2" />
                                City
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={profileData.city}
                                onChange={handleInputChange}
                                placeholder="Enter your city"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                            />
                        </div>

                        {/* Profile Summary */}
                        <div className="bg-blue-50 rounded-lg p-6">
                            <h3 className="font-semibold text-blue-900 mb-3">Profile Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-blue-700">Name:</span>
                                    <span className="ml-2 text-blue-600">{user?.name}</span>
                                </div>
                                <div>
                                    <span className="font-medium text-blue-700">Age:</span>
                                    <span className="ml-2 text-blue-600">{user?.age}</span>
                                </div>
                                <div>
                                    <span className="font-medium text-blue-700">Looking for:</span>
                                    <span className="ml-2 text-blue-600 capitalize">
                                        {user?.userType?.replace('-', ' ')}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-blue-700">City:</span>
                                    <span className="ml-2 text-blue-600">{profileData.city || user?.city}</span>
                                </div>
                            </div>
                        </div>

                        {/* Complete Button */}
                        <div className="pt-4">
                            <button
                                onClick={handleComplete}
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Completing Profile...
                                    </div>
                                ) : (
                                    'Complete Profile & Start Matching'
                                )}
                            </button>
                        </div>

                        {/* Skip Option */}
                        <div className="text-center">
                            <button
                                onClick={() => navigate('/app')}
                                className="text-gray-500 hover:text-gray-700 text-sm underline"
                            >
                                Skip for now (you can complete later)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileCreation; 