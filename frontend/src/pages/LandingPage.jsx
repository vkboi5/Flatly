import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Users, Home, MessageCircle, Shield, Star, ArrowRight, Check } from 'lucide-react';
import Navbar from '../components/Navbar';

const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const handleGetStarted = () => {
        if (isAuthenticated) {
            navigate('/app');
        } else {
            navigate('/register');
        }
    };

    const features = [
        {
            icon: <Heart className="w-6 h-6" />,
            title: "Smart Matching",
            description: "Our AI-powered algorithm matches you with compatible roommates based on lifestyle preferences and habits."
        },
        {
            icon: <Users className="w-6 h-6" />,
            title: "Lifestyle Compatibility",
            description: "Answer questions about your daily routine, cleanliness, social preferences, and find your perfect match."
        },
        {
            icon: <Home className="w-6 h-6" />,
            title: "Find Your Space",
            description: "Whether you're looking for a room or need a roommate, we connect you with the right people."
        },
        {
            icon: <MessageCircle className="w-6 h-6" />,
            title: "Safe Communication",
            description: "Chat with matches in a secure environment before sharing personal contact information."
        },
        {
            icon: <Shield className="w-6 h-6" />,
            title: "Verified Profiles",
            description: "All profiles are verified to ensure authentic connections and safer living arrangements."
        },
        {
            icon: <Star className="w-6 h-6" />,
            title: "Success Stories",
            description: "Join thousands of users who found their perfect roommate through our platform."
        }
    ];

    const howItWorks = [
        {
            step: "1",
            title: "Create Your Profile",
            description: "Sign up and tell us about yourself, your lifestyle, and what you're looking for."
        },
        {
            step: "2",
            title: "Answer Questions",
            description: "Complete our compatibility questionnaire to help us understand your preferences."
        },
        {
            step: "3",
            title: "Swipe & Match",
            description: "Browse potential roommates and swipe right on those you'd like to live with."
        },
        {
            step: "4",
            title: "Connect & Chat",
            description: "When you both swipe right, start chatting and plan your perfect living situation."
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            {/* Use the same Navbar component */}
            {isAuthenticated && <Navbar />}
            
            {/* Landing Page Header for non-authenticated users */}
            {!isAuthenticated && (
                <header className="bg-white shadow-sm border-b">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center">
                                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                                    <span className="text-white font-bold text-lg">F</span>
                                </div>
                                <h1 className="text-xl font-bold text-gray-900">Flatly</h1>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="text-gray-600 hover:text-gray-900 px-4 py-2"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => navigate('/register')}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Sign Up
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
            )}

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-4xl mx-auto">
                        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                            Find Your Perfect
                            <span className="text-blue-600 block">Roommate Match</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                            Stop settling for incompatible roommates. Our smart matching algorithm connects you with people who share your lifestyle and values.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={handleGetStarted}
                                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                            >
                                Get Started Free
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </button>
                            <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors">
                                Learn More
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Why Choose Flatly?
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            We've revolutionized roommate matching with cutting-edge technology and deep lifestyle compatibility analysis.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            How It Works
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Finding your perfect roommate is just four simple steps away.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {howItWorks.map((step, index) => (
                            <div key={index} className="text-center">
                                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
                                    {step.step}
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                                <p className="text-gray-600">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-blue-600">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-3 gap-8 text-center text-white">
                        <div>
                            <div className="text-4xl font-bold mb-2">50,000+</div>
                            <div className="text-blue-100">Happy Users</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">25,000+</div>
                            <div className="text-blue-100">Successful Matches</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold mb-2">95%</div>
                            <div className="text-blue-100">Match Success Rate</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            What Our Users Say
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                name: "Sarah M.",
                                text: "Found my perfect roommate in just 2 weeks! The compatibility matching really works.",
                                rating: 5
                            },
                            {
                                name: "Mike R.",
                                text: "Much better than Craigslist. The app helped me find someone who actually shares my lifestyle.",
                                rating: 5
                            },
                            {
                                name: "Emma K.",
                                text: "The questionnaire was so detailed. I knew my roommate would be a great fit before we even met!",
                                rating: 5
                            }
                        ].map((testimonial, index) => (
                            <div key={index} className="bg-gray-50 p-6 rounded-xl">
                                <div className="flex mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                    ))}
                                </div>
                                <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
                                <div className="font-semibold text-gray-900">- {testimonial.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Ready to Find Your Perfect Roommate?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Join thousands of users who've found their ideal living situation through Flatly.
                    </p>
                    <button
                        onClick={handleGetStarted}
                        className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
                    >
                        Start Matching Today
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center mb-4">
                                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-white font-bold">F</span>
                                </div>
                                <h3 className="text-xl font-bold">Flatly</h3>
                            </div>
                            <p className="text-gray-400">
                                The smart way to find compatible roommates and create perfect living situations.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Product</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white">Features</a></li>
                                <li><a href="#" className="hover:text-white">How it Works</a></li>
                                <li><a href="#" className="hover:text-white">Pricing</a></li>
                                <li><a href="#" className="hover:text-white">Success Stories</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Support</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white">Help Center</a></li>
                                <li><a href="#" className="hover:text-white">Safety</a></li>
                                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                                <li><a href="#" className="hover:text-white">FAQ</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Company</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><a href="#" className="hover:text-white">About</a></li>
                                <li><a href="#" className="hover:text-white">Careers</a></li>
                                <li><a href="#" className="hover:text-white">Privacy</a></li>
                                <li><a href="#" className="hover:text-white">Terms</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2024 Flatly. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage; 