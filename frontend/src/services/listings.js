import api from '../utils/api.js';

// Listings Service
export const listingsService = {
    // Create a new listing
    createListing: async (formData) => {
        const response = await api.post('/listings', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Get all listings with filters
    getListings: async (filters = {}) => {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined && filters[key] !== '') {
                params.append(key, filters[key]);
            }
        });
        
        const response = await api.get(`/listings?${params.toString()}`);
        return response.data;
    },

    // Get a specific listing
    getListing: async (id) => {
        const response = await api.get(`/listings/${id}`);
        return response.data;
    },

    // Get user's own listings
    getMyListings: async () => {
        const response = await api.get('/listings/user/my-listings');
        return response.data;
    },

    // Update a listing
    updateListing: async (id, data) => {
        const response = await api.put(`/listings/${id}`, data);
        return response.data;
    },

    // Delete a listing
    deleteListing: async (id) => {
        const response = await api.delete(`/listings/${id}`);
        return response.data;
    },

    // Express interest in a listing
    expressInterest: async (id) => {
        const response = await api.post(`/listings/${id}/interest`);
        return response.data;
    },

    // Get listing image URL
    getListingImageUrl: (listingId, imageIndex) => {
        return `${api.defaults.baseURL}/listings/${listingId}/images/${imageIndex}`;
    }
}; 