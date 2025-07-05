import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { matchingService } from '../services/matching';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Heart, X, User, MapPin, Instagram, Sparkles, MessageCircle, Settings, TrendingUp, Users, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { getProfilePictureUrl } from '../utils/api';

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
    
    // Swipe state
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const cardRef = useRef(null);
    
    // Tutorial state
    const [showTutorial, setShowTutorial] = useState(() => {
        return localStorage.getItem('flatly_tutorial_shown') !== 'true';
    });
    const [tutorialAnimating, setTutorialAnimating] = useState(true);
    const [tutorialStep, setTutorialStep] = useState('right'); // 'right', 'left', 'center'

    // Swipe feedback animation state
    const [swipeFeedback, setSwipeFeedback] = useState(null); // 'like' | 'dislike' | null

    useEffect(() => {
        loadMatches();
        loadStats();
    }, [user]); // Recalculate stats when user data changes

    useEffect(() => {
        // Auto-hide tutorial after 5 seconds
        if (showTutorial) {
            const timer = setTimeout(() => {
                setShowTutorial(false);
                localStorage.setItem('flatly_tutorial_shown', 'true');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [showTutorial]);

    useEffect(() => {
        // Add keyboard event listeners
        const handleKeyPress = (e) => {
            if (e.key === 'ArrowLeft') {
                handleSwipe('dislike');
            } else if (e.key === 'ArrowRight') {
                handleSwipe('like');
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentIndex, matches]);

    useEffect(() => {
        if (!tutorialAnimating) return;
        // Animate: right (like), left (pass), center
        let step = 'right';
        setTutorialStep('right');
        const t1 = setTimeout(() => {
            step = 'left';
            setTutorialStep('left');
        }, 900);
        const t2 = setTimeout(() => {
            step = 'center';
            setTutorialStep('center');
        }, 1800);
        const t3 = setTimeout(() => {
            setTutorialAnimating(false);
        }, 2600);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
        };
    }, [tutorialAnimating, currentIndex]);

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
        setSwipeFeedback(action); // Show feedback overlay
        setTimeout(() => setSwipeFeedback(null), 700); // Hide after 700ms
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
            }

            setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
                setDragOffset({ x: 0, y: 0 });
            }, 700); // Move to next card after feedback
            
            // Refresh user data after swipe; stats will update via useEffect
            if (refreshUser) {
                await refreshUser();
            }
            
            // Load more matches if we're running low
            if (currentIndex >= matches.length - 3) {
                loadMatches();
            }
        } catch (error) {
            toast.error('Failed to process swipe');
            console.error('Swipe error:', error);
            setSwipeFeedback(null); // Hide feedback if error
        } finally {
            setSwiping(false);
        }
    };

    // Touch/Mouse handlers for swipe gestures
    const handleDragStart = (e) => {
        setIsDragging(true);
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        setDragStart({ x: clientX, y: clientY });
        setDragOffset({ x: 0, y: 0 });
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const offsetX = clientX - dragStart.x;
        const offsetY = clientY - dragStart.y;
        
        setDragOffset({ x: offsetX, y: offsetY });
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        
        const threshold = 100; // Minimum distance to trigger swipe
        const rotation = (dragOffset.x / 20) * (dragOffset.x > 0 ? 1 : -1);
        
        if (Math.abs(dragOffset.x) > threshold) {
            // Trigger swipe
            const action = dragOffset.x > 0 ? 'like' : 'dislike';
            handleSwipe(action);
        } else {
            // Reset position
            setDragOffset({ x: 0, y: 0 });
        }
    };

    const getCompatibilityTags = (match) => {
        const tags = [];
        // Only show tags for real shared fields between current user and match
        if (!user || !match) return tags;

        // Example: Same city
        if (user.city && match.city && user.city.toLowerCase() === match.city.toLowerCase()) {
            tags.push('Same city');
        }
        // Example: Same user type
        if (user.userType && match.userType && user.userType === match.userType) {
            tags.push('Same type');
        }
        // Example: Both have Instagram
        if (user.instagramHandle && match.instagramHandle) {
            tags.push('Both on Instagram');
        }
        // Example: Both have bio
        if (user.bio && match.bio) {
            tags.push('Both have bio');
        }
        // You can add more real comparisons if you add more fields to the user model
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

                {/* Tutorial Overlay */}
                {showTutorial && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                        <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
                            <div className="mb-6">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Heart className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to Flatly!</h3>
                                <p className="text-gray-600 mb-6">Swipe right to like, left to pass on potential roommates</p>
                            </div>
                            
                            {/* Swipe Animation */}
                            <div className="relative mb-6">
                                <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200 relative">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2"></div>
                                    <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                                    <div className="h-2 bg-gray-200 rounded w-1/2 mx-auto"></div>
                                </div>
                                
                                {/* Swipe Arrows */}
                                <div className="absolute inset-0 flex items-center justify-between px-4">
                                    <div className="flex items-center text-red-500 animate-pulse">
                                        <ArrowLeft className="w-6 h-6 mr-2" />
                                        <span className="text-sm font-medium">Pass</span>
                                    </div>
                                    <div className="flex items-center text-green-500 animate-pulse">
                                        <span className="text-sm font-medium">Like</span>
                                        <ArrowRight className="w-6 h-6 ml-2" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowTutorial(false);
                                        localStorage.setItem('flatly_tutorial_shown', 'true');
                                    }}
                                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={() => {
                                        setShowTutorial(false);
                                        localStorage.setItem('flatly_tutorial_shown', 'true');
                                    }}
                                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Got it!
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile Layout: Card on top, sidebar content below */}
                <div className="block lg:hidden">
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

                    {/* Tinder-like Card */}
                    <div className="max-w-sm mx-auto mb-8">
                        <div 
                            ref={cardRef}
                            className="relative bg-white rounded-2xl shadow-lg overflow-hidden cursor-grab active:cursor-grabbing"
                            style={{
                                transform: tutorialAnimating
                                    ? tutorialStep === 'right'
                                        ? 'translateX(80px) rotate(8deg)'
                                        : tutorialStep === 'left'
                                            ? 'translateX(-80px) rotate(-8deg)'
                                            : 'translateX(0px) rotate(0deg)'
                                    : `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)`,
                                transition: tutorialAnimating ? 'transform 0.7s cubic-bezier(.4,2,.6,1)' : (isDragging ? 'none' : 'transform 0.3s ease-out')
                            }}
                            onMouseDown={tutorialAnimating ? undefined : handleDragStart}
                            onMouseMove={tutorialAnimating ? undefined : handleDragMove}
                            onMouseUp={tutorialAnimating ? undefined : handleDragEnd}
                            onMouseLeave={tutorialAnimating ? undefined : handleDragEnd}
                            onTouchStart={tutorialAnimating ? undefined : handleDragStart}
                            onTouchMove={tutorialAnimating ? undefined : handleDragMove}
                            onTouchEnd={tutorialAnimating ? undefined : handleDragEnd}
                        >
                            {/* Profile Image */}
                            <div className="relative h-80 bg-gradient-to-b from-gray-200 to-gray-300">
                                {currentMatch.hasProfilePicture ? (
                                    <img 
                                        src={`${getProfilePictureUrl(currentMatch._id)}?t=${Date.now()}`}
                                        alt={currentMatch.name}
                                        className="w-full h-full object-cover"
                                        key={`swipe-${currentMatch._id}-${Date.now()}`}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <img 
                                            src="/default-avatar.svg" 
                                            alt="Default avatar" 
                                            className="w-16 h-16 text-gray-400"
                                        />
                                    </div>
                                )}
                                
                                {/* Tutorial Animation Overlay */}
                                {tutorialAnimating && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                        {tutorialStep === 'right' && (
                                            <div className="flex items-center bg-green-500 bg-opacity-90 text-white px-6 py-2 rounded-full text-lg font-bold shadow-lg animate-pulse">
                                                <Heart className="w-6 h-6 mr-2" /> Like
                                            </div>
                                        )}
                                        {tutorialStep === 'left' && (
                                            <div className="flex items-center bg-red-500 bg-opacity-90 text-white px-6 py-2 rounded-full text-lg font-bold shadow-lg animate-pulse">
                                                <X className="w-6 h-6 mr-2" /> Pass
                                            </div>
                                        )}
                                        {tutorialStep === 'center' && (
                                            <div className="flex items-center bg-blue-600 bg-opacity-90 text-white px-4 py-1 rounded-full text-base font-semibold shadow">
                                                Swipe right to like, left to pass
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Match Score Overlay */}
                                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-md text-sm font-semibold shadow-lg">
                                    {(currentMatch.matchScore * 100).toFixed(0)}% Match
                                </div>

                                {/* Gradient Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>
                                
                                {/* Name and Age */}
                                <div className="absolute bottom-4 left-4 text-white">
                                    <h2 className="text-xl font-bold">
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
                            <div className="p-4">
                                {/* Compatibility Tags */}
                                <div className="mb-3">
                                    <div className="flex flex-wrap gap-2">
                                        {getCompatibilityTags(currentMatch).map((tag, index) => (
                                            <span 
                                                key={index}
                                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Bio */}
                                {currentMatch.bio && (
                                    <div className="mb-3">
                                        <p className="text-gray-600 leading-relaxed text-sm">
                                            {currentMatch.bio}
                                        </p>
                                    </div>
                                )}

                                {/* Instagram */}
                                {currentMatch.instagramHandle && (
                                    <div className="flex items-center text-gray-500 text-xs mb-3">
                                        <Instagram className="w-3 h-3 mr-1" />
                                        <span>@{currentMatch.instagramHandle}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center space-x-6 mt-6">
                            <button
                                onClick={() => handleSwipe('dislike')}
                                disabled={swiping}
                                className="w-14 h-14 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 shadow-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            
                            <button
                                onClick={() => handleSwipe('like')}
                                disabled={swiping}
                                className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 shadow-lg"
                            >
                                <Heart className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Swipe Hint */}
                        <div className="text-center mt-3">
                            <p className="text-xs text-gray-500">
                                Swipe left to pass, right to like
                            </p>
                        </div>
                    </div>

                    {/* Mobile Sidebar Content */}
                    <div className="space-y-4">
                        {/* Quick Stats */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Stats</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        <TrendingUp className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <span className="text-sm text-gray-600">Reviewed</span>
                                    <p className="font-semibold text-gray-900">{stats.totalSwiped}</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        <Heart className="w-4 h-4 text-red-500" />
                                    </div>
                                    <span className="text-sm text-gray-600">Liked</span>
                                    <p className="font-semibold text-gray-900">{stats.totalLiked}</p>
                                </div>
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        <Users className="w-4 h-4 text-green-600" />
                                    </div>
                                    <span className="text-sm text-gray-600">Matches</span>
                                    <p className="font-semibold text-gray-900">{stats.totalMatches}</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => navigate('/matches')}
                                    className="flex items-center justify-center px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                                >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    View Matches
                                </button>
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="flex items-center justify-center px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Edit Profile
                                </button>
                            </div>
                        </div>

                        {/* Next Profiles Preview */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Coming Up</h3>
                            <div className="space-y-3">
                                {matches.slice(currentIndex + 1, currentIndex + 4).map((match, index) => (
                                    <div key={match._id} className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                            {match.hasProfilePicture ? (
                                                <img 
                                                    src={`${getProfilePictureUrl(match._id)}?t=${Date.now()}`}
                                                    alt={match.name}
                                                    className="w-full h-full object-cover"
                                                    key={`preview-${match._id}-${Date.now()}`}
                                                />
                                            ) : (
                                                <img 
                                                    src="/default-avatar.svg" 
                                                    alt="Default avatar" 
                                                    className="w-5 h-5 text-gray-400"
                                                />
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

                {/* Desktop Layout: Sidebar and card side by side */}
                <div className="hidden lg:grid lg:grid-cols-4 gap-8">
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
                                                {match.hasProfilePicture ? (
                                                    <img 
                                                        src={getProfilePictureUrl(match._id)}
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

                    {/* Main Content Area - Tinder-like Card */}
                    <div className="lg:col-span-3">
                        <div className="max-w-sm mx-auto">
                            {/* Tinder-like Card */}
                            <div 
                                ref={cardRef}
                                className="relative bg-white rounded-2xl shadow-lg overflow-hidden cursor-grab active:cursor-grabbing"
                                style={{
                                    transform: tutorialAnimating
                                        ? tutorialStep === 'right'
                                            ? 'translateX(80px) rotate(8deg)'
                                            : tutorialStep === 'left'
                                                ? 'translateX(-80px) rotate(-8deg)'
                                                : 'translateX(0px) rotate(0deg)'
                                        : `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)`,
                                    transition: tutorialAnimating ? 'transform 0.7s cubic-bezier(.4,2,.6,1)' : (isDragging ? 'none' : 'transform 0.3s ease-out')
                                }}
                                onMouseDown={tutorialAnimating ? undefined : handleDragStart}
                                onMouseMove={tutorialAnimating ? undefined : handleDragMove}
                                onMouseUp={tutorialAnimating ? undefined : handleDragEnd}
                                onMouseLeave={tutorialAnimating ? undefined : handleDragEnd}
                                onTouchStart={tutorialAnimating ? undefined : handleDragStart}
                                onTouchMove={tutorialAnimating ? undefined : handleDragMove}
                                onTouchEnd={tutorialAnimating ? undefined : handleDragEnd}
                            >
                                {/* Profile Image */}
                                <div className="relative h-80 bg-gradient-to-b from-gray-200 to-gray-300">
                                    {currentMatch.hasProfilePicture ? (
                                        <img 
                                            src={getProfilePictureUrl(currentMatch._id)}
                                            alt={currentMatch.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-16 h-16 text-gray-400" />
                                        </div>
                                    )}
                                    
                                    {/* Tutorial Animation Overlay */}
                                    {tutorialAnimating && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                            {tutorialStep === 'right' && (
                                                <div className="flex items-center bg-green-500 bg-opacity-90 text-white px-6 py-2 rounded-full text-lg font-bold shadow-lg animate-pulse">
                                                    <Heart className="w-6 h-6 mr-2" /> Like
                                                </div>
                                            )}
                                            {tutorialStep === 'left' && (
                                                <div className="flex items-center bg-red-500 bg-opacity-90 text-white px-6 py-2 rounded-full text-lg font-bold shadow-lg animate-pulse">
                                                    <X className="w-6 h-6 mr-2" /> Pass
                                                </div>
                                            )}
                                            {tutorialStep === 'center' && (
                                                <div className="flex items-center bg-blue-600 bg-opacity-90 text-white px-4 py-1 rounded-full text-base font-semibold shadow">
                                                    Swipe right to like, left to pass
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Match Score Overlay */}
                                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-md text-sm font-semibold shadow-lg">
                                        {(currentMatch.matchScore * 100).toFixed(0)}% Match
                                    </div>

                                    {/* Gradient Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>
                                    
                                    {/* Name and Age */}
                                    <div className="absolute bottom-4 left-4 text-white">
                                        <h2 className="text-xl font-bold">
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
                                <div className="p-4">
                                    {/* Compatibility Tags */}
                                    <div className="mb-3">
                                        <div className="flex flex-wrap gap-2">
                                            {getCompatibilityTags(currentMatch).map((tag, index) => (
                                                <span 
                                                    key={index}
                                                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    {currentMatch.bio && (
                                        <div className="mb-3">
                                            <p className="text-gray-600 leading-relaxed text-sm">
                                                {currentMatch.bio}
                                            </p>
                                        </div>
                                    )}

                                    {/* Instagram */}
                                    {currentMatch.instagramHandle && (
                                        <div className="flex items-center text-gray-500 text-xs mb-3">
                                            <Instagram className="w-3 h-3 mr-1" />
                                            <span>@{currentMatch.instagramHandle}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                                    {/* Action Buttons */}
                            <div className="flex justify-center space-x-6 mt-6">
                                        <button
                                            onClick={() => handleSwipe('dislike')}
                                            disabled={swiping}
                                    className="w-14 h-14 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 shadow-lg"
                                        >
                                    <X className="w-5 h-5" />
                                        </button>
                                        
                                        <button
                                            onClick={() => handleSwipe('like')}
                                            disabled={swiping}
                                    className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 shadow-lg"
                                        >
                                    <Heart className="w-5 h-5" />
                                        </button>
                                    </div>

                            {/* Swipe Hint */}
                            <div className="text-center mt-3">
                                        <p className="text-xs text-gray-500">
                                    Swipe left to pass, right to like • Use arrow keys
                                        </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SwipeFeed; 