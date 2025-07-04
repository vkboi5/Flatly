import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../services/profile';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DesiredQuestionnaire = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);

    const questions = [
        {
            id: 'cleanlinessExpectation',
            question: 'How important is cleanliness in your ideal roommate?',
            options: [
                { value: 'very-important', label: 'Very Important - Must be very clean and organized' },
                { value: 'important', label: 'Important - Should maintain good cleanliness' },
                { value: 'somewhat', label: 'Somewhat Important - Basic cleanliness is fine' },
                { value: 'not-important', label: 'Not Important - I\'m flexible about cleanliness' }
            ]
        },
        {
            id: 'noiseTolerance',
            question: 'How tolerant are you of noise from your roommate?',
            options: [
                { value: 'very-tolerant', label: 'Very Tolerant - Music, calls, activities are fine' },
                { value: 'tolerant', label: 'Tolerant - Some noise during day hours is okay' },
                { value: 'moderate', label: 'Moderate - Quiet hours should be respected' },
                { value: 'low-tolerance', label: 'Low Tolerance - I need a quiet environment' }
            ]
        },
        {
            id: 'foodPreference',
            question: 'What food arrangement would you prefer?',
            options: [
                { value: 'similar', label: 'Similar Habits - We should have similar cooking styles' },
                { value: 'complementary', label: 'Complementary - We can share meals sometimes' },
                { value: 'no-preference', label: 'No Preference - Everyone handles their own food' }
            ]
        },
        {
            id: 'guestsPolicy',
            question: 'How do you feel about your roommate having guests?',
            options: [
                { value: 'frequent-ok', label: 'Frequent Guests OK - I\'m social and don\'t mind' },
                { value: 'occasional-ok', label: 'Occasional Guests OK - With advance notice' },
                { value: 'prefer-none', label: 'Prefer Few Guests - I like a quiet home' }
            ]
        },
        {
            id: 'choreExpectations',
            question: 'How should household chores be handled?',
            options: [
                { value: 'shared-equally', label: 'Shared Equally - We split all chores 50/50' },
                { value: 'flexible', label: 'Flexible System - We figure out what works' },
                { value: 'individual', label: 'Individual Responsibility - Everyone cleans their own areas' }
            ]
        },
        {
            id: 'sleepSync',
            question: 'How important is it that your roommate has a similar sleep schedule?',
            options: [
                { value: 'similar-schedule', label: 'Similar Schedule - We should have similar sleep times' },
                { value: 'flexible', label: 'Flexible - Different schedules are fine if respectful' },
                { value: 'no-preference', label: 'No Preference - Sleep schedule doesn\'t matter' }
            ]
        },
        {
            id: 'redFlags',
            question: 'Which of these would be deal-breakers for you?',
            options: [
                { value: 'none', label: 'None - I\'m very flexible and adaptable' },
                { value: 'minor-issues', label: 'Minor Issues - Small habits that might bother me' },
                { value: 'major-concerns', label: 'Major Concerns - Significant lifestyle differences' }
            ]
        },
        {
            id: 'colivingVibe',
            question: 'What kind of co-living relationship do you want?',
            options: [
                { value: 'friends', label: 'Friends - I want to be close friends with my roommate' },
                { value: 'friendly', label: 'Friendly - Friendly but maintain separate social lives' },
                { value: 'respectful', label: 'Respectful - Polite interactions, mutual respect' },
                { value: 'minimal', label: 'Minimal - We mostly keep to ourselves' }
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
            await profileService.submitDesiredQuestionnaire(answers);
            toast.success('Questionnaire completed!');
            navigate('/profile-creation');
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
                            Who's Your Ideal Roommate?
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Question {currentQuestion + 1} of {questions.length}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
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
                                            ? 'border-green-500 bg-green-50' 
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
                                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
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
                                            ? 'bg-green-600' 
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
                                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Submitting...' : 'Complete'}
                                <ChevronRight className="h-5 w-5 ml-2" />
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                disabled={!isAnswered}
                                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default DesiredQuestionnaire; 