import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/profile';
import { Home, UserPlus, MapPin, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Onboarding = () => {
    const [selectedCity, setSelectedCity] = useState('');
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();

    const handleCTAClick = async (userType) => {
        try {
            // Save the userType to the backend
            await profileService.updateProfile({ userType });
            
            // Update the user context
            const updatedUser = { ...user, userType };
            updateUser(updatedUser);
            
            // Navigate to self questionnaire
            navigate('/questionnaire/self');
        } catch (error) {
            console.error('Error saving userType:', error);
            toast.error('Failed to save your preference. Please try again.');
        }
    };

    const popularCities = [
        'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
        'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
        'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte',
        'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Boston'
    ];

    return (
        <div className="min-h-screen w-full bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-lg bg-blue-600 mb-6">
                        <span className="text-white font-bold text-2xl">F</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Welcome to Flatly, {user?.name}!
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Let's find you the perfect roommate match
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 lg:p-12">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            What are you looking for?
                        </h2>
                        <p className="text-gray-600">
                            Choose your primary goal to get personalized matches
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6 mb-8">
                        <div 
                            onClick={() => handleCTAClick('find-room')}
                            className="group cursor-pointer p-6 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition-colors">
                                <Home className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Find a Room
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Looking for a place to live? Browse available rooms and find compatible roommates.
                            </p>
                            <div className="flex items-center text-blue-600 group-hover:text-blue-700">
                                <span className="font-medium">Get Started</span>
                                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>

                        <div 
                            onClick={() => handleCTAClick('find-roommate')}
                            className="group cursor-pointer p-6 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4 group-hover:bg-green-200 transition-colors">
                                <UserPlus className="h-6 w-6 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Find a Roommate
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Have a place but need a roommate? Find someone who matches your lifestyle.
                            </p>
                            <div className="flex items-center text-green-600 group-hover:text-green-700">
                                <span className="font-medium">Get Started</span>
                                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-8">
                        <div className="text-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Refine Your Search (Optional)
                            </h3>
                            <p className="text-gray-600">
                                Select your preferred city to see more relevant matches
                            </p>
                        </div>

                        <div className="max-w-lg mx-auto">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MapPin className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    list="cities"
                                    placeholder="Enter your city"
                                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={selectedCity}
                                    onChange={(e) => setSelectedCity(e.target.value)}
                                />
                                <datalist id="cities">
                                    {popularCities.map((city) => (
                                        <option key={city} value={city} />
                                    ))}
                                </datalist>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-8">
                    <p className="text-sm text-gray-500">
                        Don't worry, you can always change your preferences later
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Onboarding; 