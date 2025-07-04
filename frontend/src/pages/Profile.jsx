import React from 'react';

const Profile = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                        Your Profile
                    </h1>
                    <p className="text-gray-600 mb-8">
                        This will show your profile information and allow you to edit your details.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Profile; 