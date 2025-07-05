import api from '../utils/api.js';

// Profile Service
export const profileService = {
    // Get user's own profile
    getProfile: async () => {
        const response = await api.get('/profile/me');
        return response.data.user;
    },

    // Update profile
    updateProfile: async (profileData) => {
        const response = await api.put('/profile/update', profileData);
        return response.data;
    },

    // Upload profile picture
    uploadProfilePicture: async (file) => {
        const formData = new FormData();
        formData.append('profilePicture', file);
        
        const response = await api.post('/profile/upload-picture', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Submit self questionnaire
    submitSelfQuestionnaire: async (answers) => {
        const response = await api.post('/profile/questionnaire/self', { answers });
        return response.data;
    },

    // Submit desired roommate questionnaire
    submitDesiredQuestionnaire: async (answers) => {
        const response = await api.post('/profile/questionnaire/desired', { answers });
        return response.data;
    },

    // Get another user's profile
    getUserProfile: async (userId) => {
        const response = await api.get(`/profile/user/${userId}`);
        return response.data.user;
    },

    // Get detailed user profile with listings
    getUserDetailed: async (userId) => {
        const response = await api.get(`/profile/user/${userId}/detailed`);
        return response.data;
    },

    // Delete profile picture
    deleteProfilePicture: async () => {
        const response = await api.delete('/profile/picture');
        return response.data;
    }
}; 