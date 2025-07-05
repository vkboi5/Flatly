import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profile';
import { getProfilePictureUrl } from '../utils/api';
import { User, Mail, MapPin, Hash, Heart, Instagram, Edit2, Save, X as XIcon, UserCircle2, Venus, Mars, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({
        name: '',
        age: '',
        city: '',
        phoneNumber: '',
        userType: '',
        instagramHandle: '',
        bio: '',
        gender: ''
    });
    const [pictureFile, setPictureFile] = useState(null);
    const [picturePreview, setPicturePreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    
    // Initialize form with profile data
    const initializeForm = (profileData) => {
        setForm({
            name: profileData.name || '',
            age: profileData.age || '',
            city: profileData.city || '',
            phoneNumber: profileData.phoneNumber || '',
            userType: profileData.userType || '',
            instagramHandle: profileData.instagramHandle || '',
            bio: profileData.bio || '',
            gender: profileData.gender || ''
        });
    };

    useEffect(() => {
        const fetchProfile = async () => {
            setLoading(true);
            try {
                const data = await profileService.getProfile();
                console.log('Fetched profile data:', data);
                setProfile(data);
                initializeForm(data);
            } catch (err) {
                console.error('Profile fetch error:', err);
                setError('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePictureChange = (e) => {
        const file = e.target.files[0];
        setPictureFile(file);
        if (file) {
            setPicturePreview(URL.createObjectURL(file));
        } else {
            setPicturePreview(null);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        
        try {
            console.log('Saving form data:', form);
            
            // Update profile in backend
            const updateResponse = await profileService.updateProfile(form);
            console.log('Update response:', updateResponse);
            
            // Upload picture if selected
            if (pictureFile) {
                await profileService.uploadProfilePicture(pictureFile);
            }
            
            // Update user context
            updateUser(updateResponse.user);
            
            // Fetch fresh profile data and update state
            const freshData = await profileService.getProfile();
            console.log('Fresh profile data:', freshData);
            setProfile(freshData);
            initializeForm(freshData);
            
            // Exit edit mode
            setEditMode(false);
            setPictureFile(null);
            setPicturePreview(null);
            
            toast.success('Profile updated successfully!');
            
        } catch (err) {
            console.error('Save error:', err);
            const errorMessage = err.response?.data?.message || 'Failed to save changes';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditMode(false);
        initializeForm(profile);
        setPictureFile(null);
        setPicturePreview(null);
        setError(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-gray-500">Loading profile...</div>
            </div>
        );
    }

    if (error && !editMode) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center px-4 py-8">
            {/* Header with background and profile picture */}
            <div className="w-full max-w-2xl mx-auto relative mb-8">
                <div className="h-40 bg-gradient-to-r from-blue-600 to-blue-400 rounded-3xl shadow-lg flex items-end justify-center relative">
                    <div className="absolute left-1/2 -bottom-12 transform -translate-x-1/2">
                        <div className="relative w-32 h-32">
                            <img
                                src={picturePreview || (profile.hasProfilePicture ? `${getProfilePictureUrl(profile.id)}?t=${Date.now()}` : undefined)}
                                alt="Profile"
                                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl bg-gray-200 transition-opacity duration-300"
                                onError={e => {
                                    console.log('Profile picture failed to load, using default');
                                    e.target.src = '/default-avatar.svg';
                                }}
                                onLoad={(e) => {
                                    console.log('Profile picture loaded successfully');
                                    e.target.style.opacity = '1';
                                }}
                                onLoadStart={(e) => {
                                    e.target.style.opacity = '0.7';
                                }}
                                key={profile.hasProfilePicture ? `profile-${profile.id}-${Date.now()}` : 'no-picture'}
                                style={{ opacity: 0.7 }}
                            />
                            {editMode && (
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePictureChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    title="Change profile picture"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Card */}
            <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-8 pt-20 relative">
                <div className="flex flex-col items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <UserCircle2 className="w-8 h-8 text-blue-500" />
                        {profile.name}
                    </h1>
                    <div className="text-gray-500 flex items-center gap-2 mt-2">
                        <Mail className="w-4 h-4" /> {profile.email}
                    </div>
                </div>

                {error && editMode && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-1">
                            <Hash className="w-4 h-4 text-blue-400" /> Name
                        </label>
                        {editMode ? (
                            <input 
                                type="text" 
                                name="name" 
                                value={form.name} 
                                onChange={handleChange} 
                                className="w-full border-2 border-blue-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" 
                                required 
                            />
                        ) : (
                            <div className="text-gray-900 text-lg">{profile.name}</div>
                        )}
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-1">
                            <User className="w-4 h-4 text-blue-400" /> Age
                        </label>
                        {editMode ? (
                            <input 
                                type="number" 
                                name="age" 
                                value={form.age} 
                                onChange={handleChange} 
                                className="w-full border-2 border-blue-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" 
                                min="18" 
                                max="100" 
                                required 
                            />
                        ) : (
                            <div className="text-gray-900 text-lg">{profile.age}</div>
                        )}
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-1">
                            <Venus className="w-4 h-4 text-blue-400" /> Gender
                        </label>
                        {editMode ? (
                            <select 
                                name="gender" 
                                value={form.gender || ''} 
                                onChange={handleChange} 
                                className="w-full border-2 border-blue-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" 
                                required
                            >
                                <option value="">Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        ) : (
                            <div className="text-gray-900 text-lg flex items-center gap-2">
                                {profile.gender === 'male' && <Mars className="w-4 h-4 text-blue-400" />} 
                                {profile.gender === 'female' && <Venus className="w-4 h-4 text-pink-400" />} 
                                {profile.gender === 'other' && <User className="w-4 h-4 text-gray-400" />} 
                                {profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not specified'}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-blue-400" /> City
                        </label>
                        {editMode ? (
                            <input 
                                type="text" 
                                name="city" 
                                value={form.city} 
                                onChange={handleChange} 
                                className="w-full border-2 border-blue-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" 
                                required 
                            />
                        ) : (
                            <div className="text-gray-900 text-lg">{profile.city}</div>
                        )}
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-1">
                            <Phone className="w-4 h-4 text-blue-400" /> Phone Number
                        </label>
                        {editMode ? (
                            <input 
                                type="tel" 
                                name="phoneNumber" 
                                value={form.phoneNumber} 
                                onChange={handleChange} 
                                className="w-full border-2 border-blue-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" 
                                placeholder="Enter phone number" 
                                required 
                            />
                        ) : (
                            <div className="text-gray-900 text-lg">{profile.phoneNumber || <span className="text-gray-400">Not provided</span>}</div>
                        )}
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-1">
                            <Heart className="w-4 h-4 text-blue-400" /> User Type
                        </label>
                        {editMode ? (
                            <select 
                                name="userType" 
                                value={form.userType || ''} 
                                onChange={handleChange} 
                                className="w-full border-2 border-blue-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" 
                                required
                            >
                                <option value="">Select user type</option>
                                <option value="find-room">Looking for Room</option>
                                <option value="find-roommate">Have a Room</option>
                            </select>
                        ) : (
                            <div className="text-gray-900 text-lg capitalize">{profile.userType?.replace('-', ' ')}</div>
                        )}
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-1">
                            <Instagram className="w-4 h-4 text-blue-400" /> Instagram
                        </label>
                        {editMode ? (
                            <input 
                                type="text" 
                                name="instagramHandle" 
                                value={form.instagramHandle} 
                                onChange={handleChange} 
                                className="w-full border-2 border-blue-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" 
                            />
                        ) : (
                            <div className="text-gray-900 text-lg">{profile.instagramHandle ? `@${profile.instagramHandle}` : <span className="text-gray-400">Not provided</span>}</div>
                        )}
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-gray-700 font-semibold mb-1 flex items-center gap-1">
                            <Edit2 className="w-4 h-4 text-blue-400" /> Bio
                        </label>
                        {editMode ? (
                            <textarea 
                                name="bio" 
                                value={form.bio} 
                                onChange={handleChange} 
                                className="w-full border-2 border-blue-100 rounded-lg px-3 py-2 min-h-[80px] focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition" 
                                maxLength={500} 
                            />
                        ) : (
                            <div className="text-gray-900 whitespace-pre-line text-lg">{profile.bio || <span className="text-gray-400">No bio yet</span>}</div>
                        )}
                    </div>
                </form>

                {/* Edit/Save Bar */}
                <div className="flex justify-end gap-3 mt-10">
                    {editMode ? (
                        <>
                            <button 
                                type="button" 
                                onClick={handleCancel}
                                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2 border border-gray-200"
                            >
                                <XIcon className="w-4 h-4" /> Cancel
                            </button>
                            <button 
                                type="button" 
                                onClick={handleSave} 
                                disabled={saving} 
                                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center gap-2 shadow disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <button 
                            type="button" 
                            onClick={() => setEditMode(true)} 
                            className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center gap-2 shadow"
                        >
                            <Edit2 className="w-4 h-4" /> Edit Profile
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile; 