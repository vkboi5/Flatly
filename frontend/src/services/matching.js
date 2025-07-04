import api from '../utils/api.js';

// Matching Service
export const matchingService = {
    // Get potential matches
    getPotentialMatches: async (limit = 10) => {
        const response = await api.get(`/matching/potential?limit=${limit}`);
        return response.data;
    },

    // Handle swipe action
    swipe: async (targetUserId, action) => {
        const response = await api.post('/matching/swipe', {
            targetUserId,
            action
        });
        return response.data;
    },

    // Get user's matches
    getMatches: async () => {
        const response = await api.get('/matching/matches');
        return response.data;
    },

    // Get detailed match information
    getMatchDetails: async (matchId) => {
        const response = await api.get(`/matching/match/${matchId}`);
        return response.data;
    },

    // Remove/unmatch a user
    removeMatch: async (matchId) => {
        const response = await api.delete(`/matching/match/${matchId}`);
        return response.data;
    },

    // Get swipe history
    getSwipeHistory: async () => {
        const response = await api.get('/matching/swipe-history');
        return response.data;
    },

    // Calculate match score
    calculateMatchScore: async (userId) => {
        const response = await api.get(`/matching/score/${userId}`);
        return response.data;
    },

    // Reset swipe history (for development)
    resetSwipes: async () => {
        const response = await api.post('/matching/reset-swipes');
        return response.data;
    }
}; 