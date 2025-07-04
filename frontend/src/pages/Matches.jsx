import React, { useState, useEffect } from 'react';
import { matchingService } from '../services/matching';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MessageCircle, Heart, User, MapPin, Instagram, ArrowLeft, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Matches = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMatches();
    }, []);

    const loadMatches = async () => {
        try {
            setLoading(true);
            const response = await matchingService.getMatches();
            setMatches(response.matches || []);
        } catch (error) {
            toast.error('Failed to load matches');
            console.error('Error loading matches:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatMatchDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays - 1} days ago`;
        return date.toLocaleDateString();
    };

    const getMatchScoreColor = (score) => {
        if (score >= 80) return 'text-green-600 bg-green-100';
        if (score >= 60) return 'text-blue-600 bg-blue-100';
        if (score >= 40) return 'text-yellow-600 bg-yellow-100';
        return 'text-gray-600 bg-gray-100';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center max-w-md mx-auto">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
                        <p className="text-gray-600">Loading your matches...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {matches.length === 0 ? (
                    // No matches state
                    <div className="text-center max-w-md mx-auto py-16">
                        <Heart className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            No matches yet
                        </h2>
                        <p className="text-gray-600 mb-8">
                            Keep swiping to find your perfect roommate match!
                        </p>
                        <button
                            onClick={() => navigate('/app')}
                            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                        >
                            Start Swiping
                        </button>
                    </div>
                ) : (
                    // Matches list
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                Your Matches
                            </h2>
                            <p className="text-gray-600">
                                {matches.length} {matches.length === 1 ? 'person has' : 'people have'} liked you back! Start a conversation.
                            </p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {matches.map((match) => (
                                <div 
                                    key={match._id} 
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
                                >
                                    {/* Profile Image */}
                                    <div className="relative h-64 bg-gradient-to-b from-gray-200 to-gray-300">
                                        {match.user.profilePicture ? (
                                            <img 
                                                src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${match.user.profilePicture}`}
                                                alt={match.user.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User className="w-16 h-16 text-gray-400" />
                                            </div>
                                        )}
                                        
                                        {/* Match Score Badge */}
                                        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${getMatchScoreColor((match.matchScore * 100).toFixed(0))}`}>
                                            {(match.matchScore * 100).toFixed(0)}% Match
                                        </div>

                                        {/* Gradient Overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent"></div>
                                        
                                        {/* Name */}
                                        <div className="absolute bottom-3 left-3 text-white">
                                            <h3 className="font-bold text-lg">
                                                {match.user.name}, {match.user.age}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-4">
                                        {/* Location and User Type */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center text-gray-600 text-sm">
                                                <MapPin className="w-4 h-4 mr-1" />
                                                <span>{match.user.city}</span>
                                            </div>
                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
                                                {match.user.userType?.replace('-', ' ')}
                                            </span>
                                        </div>

                                        {/* Bio Preview */}
                                        {match.user.bio && (
                                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                {match.user.bio.length > 80 
                                                    ? `${match.user.bio.substring(0, 80)}...` 
                                                    : match.user.bio
                                                }
                                            </p>
                                        )}

                                        {/* Instagram */}
                                        {match.user.instagramHandle && (
                                            <div className="flex items-center text-gray-500 text-sm mb-3">
                                                <Instagram className="w-4 h-4 mr-2" />
                                                <span>@{match.user.instagramHandle}</span>
                                            </div>
                                        )}

                                        {/* Match Date */}
                                        <div className="flex items-center text-gray-400 text-xs mb-4">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            <span>Matched {formatMatchDate(match.createdAt)}</span>
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Load More Button */}
                        {matches.length > 0 && (
                            <div className="text-center mt-12">
                                <button
                                    onClick={loadMatches}
                                    className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                                >
                                    Refresh Matches
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Matches; 