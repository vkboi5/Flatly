import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../services/profile';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SelfQuestionnaire = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);

    const questions = [
        {
            id: 'cleanliness',
            question: 'How would you describe your cleanliness habits?',
            options: [
                { value: 'very-clean', label: 'Very Clean - I clean daily and everything has its place' },
                { value: 'clean', label: 'Clean - I keep things tidy and clean weekly' },
                { value: 'moderate', label: 'Moderate - I clean when needed, not too strict' },
                { value: 'relaxed', label: 'Relaxed - I\'m comfortable with some messiness' }
            ]
        },
        {
            id: 'sleepPattern',
            question: 'What\'s your typical sleep schedule?',
            options: [
                { value: 'early-bird', label: 'Early Bird - Sleep by 10 PM, wake up by 6 AM' },
                { value: 'normal', label: 'Normal - Sleep by 11 PM, wake up by 7-8 AM' },
                { value: 'night-owl', label: 'Night Owl - Sleep after midnight, wake up late' }
            ]
        },
        {
            id: 'workStyle',
            question: 'What\'s your work arrangement?',
            options: [
                { value: 'wfh', label: 'Work From Home - I\'m home most of the time' },
                { value: 'office', label: 'Office Work - I\'m out most of the day' },
                { value: 'hybrid', label: 'Hybrid - Mix of home and office work' }
            ]
        },
        {
            id: 'foodHabits',
            question: 'How often do you cook at home?',
            options: [
                { value: 'cook-often', label: 'Often - I cook most meals at home' },
                { value: 'sometimes', label: 'Sometimes - I cook a few times a week' },
                { value: 'rarely', label: 'Rarely - I prefer simple meals or meal prep' },
                { value: 'order-out', label: 'Order Out - I mostly order food or eat out' }
            ]
        },
        {
            id: 'partyStyle',
            question: 'How do you feel about parties and gatherings?',
            options: [
                { value: 'party-lover', label: 'Party Lover - I love hosting and attending parties' },
                { value: 'occasional', label: 'Occasional - I enjoy parties sometimes' },
                { value: 'quiet', label: 'Quiet - I prefer calm, small gatherings' }
            ]
        },
        {
            id: 'guests',
            question: 'How often do you have guests over?',
            options: [
                { value: 'frequently', label: 'Frequently - I have friends/family over often' },
                { value: 'sometimes', label: 'Sometimes - Occasional guests on weekends' },
                { value: 'rarely', label: 'Rarely - I prefer to keep home space private' }
            ]
        },
        {
            id: 'socialEnergy',
            question: 'How would you describe your social energy?',
            options: [
                { value: 'very-social', label: 'Very Social - I love chatting and hanging out' },
                { value: 'social', label: 'Social - I enjoy conversations and company' },
                { value: 'moderate', label: 'Moderate - I like some social time, some alone time' },
                { value: 'introvert', label: 'Introvert - I prefer quiet time and personal space' }
            ]
        },
        {
            id: 'petTolerance',
            question: 'How do you feel about pets?',
            options: [
                { value: 'love-pets', label: 'Love Pets - I have pets or would love to have them' },
                { value: 'okay-with-pets', label: 'Okay with Pets - I don\'t mind living with pets' },
                { value: 'no-pets', label: 'No Pets - I prefer a pet-free living space' }
            ]
        },
        {
            id: 'musicVolume',
            question: 'What\'s your preference for music and noise levels?',
            options: [
                { value: 'loud', label: 'Loud - I enjoy music and don\'t mind noise' },
                { value: 'moderate', label: 'Moderate - I like music but respect quiet hours' },
                { value: 'quiet', label: 'Quiet - I prefer low noise and quiet environment' }
            ]
        },
        {
            id: 'weekendPref',
            question: 'How do you typically spend your weekends?',
            options: [
                { value: 'go-out', label: 'Go Out - I love exploring, bars, restaurants, events' },
                { value: 'home-activities', label: 'Home Activities - I enjoy hobbies, movies, friends over' },
                { value: 'rest', label: 'Rest - I prefer quiet weekends to recharge' }
            ]
        }
    ];

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length !== questions.length) {
            toast.error('Please answer all questions');
            return;
        }

        setLoading(true);
        try {
            await profileService.submitSelfQuestionnaire(answers);
            toast.success('Self questionnaire completed!');
            navigate('/questionnaire/desired');
        } catch (error) {
            toast.error('Failed to submit questionnaire');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const progress = ((currentQuestion + 1) / questions.length) * 100;
    const currentQ = questions[currentQuestion];
    const isLastQuestion = currentQuestion === questions.length - 1;
    const isAnswered = answers[currentQ.id];

    return (
        <div className="min-h-screen w-full bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="w-full max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                            Tell Us About Yourself
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Question {currentQuestion + 1} of {questions.length}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Question Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6">
                            {currentQ.question}
                        </h2>

                        <div className="space-y-4">
                            {currentQ.options.map((option) => (
                                <label 
                                    key={option.value}
                                    className={`block p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                                        answers[currentQ.id] === option.value 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            name={currentQ.id}
                                            value={option.value}
                                            checked={answers[currentQ.id] === option.value}
                                            onChange={() => handleAnswerChange(currentQ.id, option.value)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        />
                                        <span className="ml-3 text-sm md:text-base text-gray-900">
                                            {option.label}
                                        </span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={handlePrevious}
                            disabled={currentQuestion === 0}
                            className="flex items-center px-6 py-3 text-gray-600 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5 mr-2" />
                            Previous
                        </button>

                        <div className="flex space-x-2">
                            {questions.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-3 h-3 rounded-full ${
                                        index === currentQuestion 
                                            ? 'bg-blue-600' 
                                            : answers[questions[index].id] 
                                                ? 'bg-green-500' 
                                                : 'bg-gray-300'
                                    }`}
                                />
                            ))}
                        </div>

                        {isLastQuestion ? (
                            <button
                                onClick={handleSubmit}
                                disabled={!isAnswered || loading}
                                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Submitting...' : 'Complete'}
                                <ChevronRight className="h-5 w-5 ml-2" />
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                disabled={!isAnswered}
                                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                                <ChevronRight className="h-5 w-5 ml-2" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelfQuestionnaire; 