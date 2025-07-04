import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { matchingService } from '../services/matching';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Heart, X, User, MapPin, Instagram, Sparkles, MessageCircle, Settings, TrendingUp, Users, Clock } from 'lucide-react';

const SwipeFeed = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [swiping, setSwiping] = useState(false);
    const [stats, setStats] = useState({
        totalSwiped: 0,
        totalLiked: 0,
        totalMatches: 0
    });

    useEffect(() => {
        loadMatches();
        loadStats();
    }, [user]); // Recalculate stats when user data changes

    const loadMatches = async () => {
        try {
            setLoading(true);
            const response = await matchingService.getPotentialMatches(10);
            setMatches(response.matches || []);
        } catch (error) {
            toast.error('Failed to load matches');
            console.error('Error loading matches:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            // Calculate real stats from user data
            const totalLiked = user?.likedUsers?.length || 0;
            const totalDisliked = user?.dislikedUsers?.length || 0;
            const totalMatches = user?.matches?.length || 0;
            
            setStats({
                totalSwiped: totalLiked + totalDisliked,
                totalLiked: totalLiked,
                totalMatches: totalMatches
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleSwipe = async (action) => {
        if (swiping || currentIndex >= matches.length) return;
        
        setSwiping(true);
        const currentMatch = matches[currentIndex];

        try {
            const response = await matchingService.swipe(currentMatch._id, action);
            
            if (response.isMatch) {
                toast.success('🎉 It\'s a match!', {
                    duration: 3000,
                    style: {
                        background: '#10B981',
                        color: 'white',
                    },
                });
                // Stats will be recalculated in loadStats() call below
            }

            setCurrentIndex(prev => prev + 1);
            
            // Refresh user data and recalculate stats after swipe
            if (refreshUser) {
                await refreshUser();
            }
            loadStats();
            
            // Load more matches if we're running low
            if (currentIndex >= matches.length - 3) {
                loadMatches();
            }
        } catch (error) {
            toast.error('Failed to process swipe');
            console.error('Swipe error:', error);
        } finally {
            setSwiping(false);
        }
    };

    const getCompatibilityTags = (match) => {
        const tags = [];
        const score = (match.matchScore * 100).toFixed(0);
        
        if (match.matchScore > 0.8) {
            tags.push('Perfect Match');
        } else if (match.matchScore > 0.6) {
            tags.push('Great Match');
        } else if (match.matchScore > 0.4) {
            tags.push('Good Match');
        }
        
        const possibleTags = [
            'Both clean freaks',
            'Both night owls',
            'Both love cooking',
            'Similar social energy',
            'Compatible work styles',
            'Both pet lovers',
            'Similar party vibes',
            'Quiet living style'
        ];
        
        if (possibleTags.length > 0) {
            const randomTag = possibleTags[Math.floor(Math.random() * possibleTags.length)];
            if (!tags.includes(randomTag)) {
                tags.push(randomTag);
            }
        }
        
        return tags.slice(0, 2);
    };

    const currentMatch = matches[currentIndex];

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex justify-center items-center h-96">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-600 text-lg">Finding your perfect matches...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!matches.length || currentIndex >= matches.length) {
        return (
            <div className="min-h-screen w-full bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Roommates</h1>
                        <p className="text-gray-600">Find compatible people to share your living space</p>
                    </div>
                    
                    <div className="flex justify-center items-center h-96">
                        <div className="text-center max-w-lg">
                            <Sparkles className="w-20 h-20 text-blue-600 mx-auto mb-6" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                No more matches right now
                            </h2>
                            <p className="text-gray-600 mb-8 text-lg">
                                Check back later for new potential roommates in your area, or try adjusting your preferences!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={loadMatches}
                                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                                >
                                    Refresh Matches
                                </button>
                                <button
                                    onClick={() => navigate('/matches')}
                                    className="bg-white text-gray-700 border border-gray-300 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
                                >
                                    View Existing Matches
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Roommates</h1>
                    <p className="text-gray-600">Find compatible people to share your living space</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Stats Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="space-y-6">
                            {/* Quick Stats */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Stats</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <TrendingUp className="w-4 h-4 text-blue-600 mr-2" />
                                            <span className="text-sm text-gray-600">Total Reviewed</span>
                                        </div>
                                        <span className="font-semibold text-gray-900">{stats.totalSwiped}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <Heart className="w-4 h-4 text-red-500 mr-2" />
                                            <span className="text-sm text-gray-600">Total Liked</span>
                                        </div>
                                        <span className="font-semibold text-gray-900">{stats.totalLiked}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <Users className="w-4 h-4 text-green-600 mr-2" />
                                            <span className="text-sm text-gray-600">Matches</span>
                                        </div>
                                        <span className="font-semibold text-gray-900">{stats.totalMatches}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => navigate('/matches')}
                                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                                    >
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        View Matches
                                    </button>
                                    <button
                                        onClick={() => navigate('/profile')}
                                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                                    >
                                        <Settings className="w-4 h-4 mr-2" />
                                        Edit Profile
                                    </button>
                                </div>
                            </div>

                            {/* Next Profiles Preview */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Coming Up</h3>
                                <div className="space-y-3">
                                    {matches.slice(currentIndex + 1, currentIndex + 4).map((match, index) => (
                                        <div key={match._id} className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                {match.profilePicture ? (
                                                    <img 
                                                        src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${match.profilePicture}`}
                                                        alt={match.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="w-5 h-5 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {match.name}, {match.age}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {(match.matchScore * 100).toFixed(0)}% match
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                        <div className="max-w-2xl mx-auto">
                            {/* Progress Indicator */}
                            <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-600">Profile {currentIndex + 1} of {matches.length}</span>
                                    <span className="text-sm text-gray-600">{(currentMatch.matchScore * 100).toFixed(0)}% Compatible</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${((currentIndex + 1) / matches.length) * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Match Card */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                {/* Profile Image */}
                                <div className="relative h-96 bg-gradient-to-b from-gray-200 to-gray-300">
                                    {currentMatch.profilePicture ? (
                                        <img 
                                            src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${currentMatch.profilePicture}`}
                                            alt={currentMatch.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-20 h-20 text-gray-400" />
                                        </div>
                                    )}
                                    
                                    {/* Match Score Overlay */}
                                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-md text-sm font-semibold shadow-lg">
                                        {(currentMatch.matchScore * 100).toFixed(0)}% Match
                                    </div>

                                    {/* Gradient Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent"></div>
                                    
                                    {/* Name and Age */}
                                    <div className="absolute bottom-4 left-4 text-white">
                                        <h2 className="text-2xl font-bold">
                                            {currentMatch.name}, {currentMatch.age}
                                        </h2>
                                        <div className="flex items-center mt-1">
                                            <MapPin className="w-4 h-4 mr-1" />
                                            <span className="text-sm">{currentMatch.city}</span>
                                            <span className="mx-2">•</span>
                                            <span className="text-sm capitalize">{currentMatch.userType?.replace('-', ' ')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="p-6">
                                    {/* Compatibility Tags */}
                                    <div className="mb-6">
                                        <h3 className="text-sm font-medium text-gray-700 mb-3">Why You're Compatible</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {getCompatibilityTags(currentMatch).map((tag, index) => (
                                                <span 
                                                    key={index}
                                                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    {currentMatch.bio && (
                                        <div className="mb-6">
                                            <h3 className="text-sm font-medium text-gray-700 mb-2">About {currentMatch.name}</h3>
                                            <p className="text-gray-600 leading-relaxed">
                                                {currentMatch.bio}
                                            </p>
                                        </div>
                                    )}

                                    {/* Additional Info */}
                                    <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-gray-200">
                                        <div>
                                            <span className="text-sm text-gray-500">Location</span>
                                            <p className="font-medium text-gray-900">{currentMatch.city}</p>
                                        </div>
                                        <div>
                                            <span className="text-sm text-gray-500">Looking for</span>
                                            <p className="font-medium text-gray-900 capitalize">
                                                {currentMatch.userType?.replace('-', ' ')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Instagram */}
                                    {currentMatch.instagramHandle && (
                                        <div className="flex items-center text-gray-500 text-sm mb-6">
                                            <Instagram className="w-4 h-4 mr-2" />
                                            <span>@{currentMatch.instagramHandle}</span>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex space-x-4">
                                        <button
                                            onClick={() => handleSwipe('dislike')}
                                            disabled={swiping}
                                            className="flex-1 bg-white border border-gray-300 rounded-lg px-6 py-4 flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 shadow-sm font-medium"
                                        >
                                            <X className="w-5 h-5 mr-2" />
                                            Pass
                                        </button>
                                        
                                        <button
                                            onClick={() => handleSwipe('like')}
                                            disabled={swiping}
                                            className="flex-1 bg-blue-600 text-white rounded-lg px-6 py-4 flex items-center justify-center hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 shadow-sm font-medium"
                                        >
                                            <Heart className="w-5 h-5 mr-2" />
                                            Like
                                        </button>
                                    </div>

                                    {/* Keyboard Shortcuts Hint */}
                                    <div className="text-center mt-4">
                                        <p className="text-xs text-gray-500">
                                            Use keyboard shortcuts: ← to pass, → to like
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SwipeFeed; 