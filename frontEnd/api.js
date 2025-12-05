// API Configuration
const API_CONFIG = {
    BASE_URL: "http://localhost:8000/api", // change it to api
    ENDPOINTS: {
        // Authentication 
        LOGIN: '/auth/login',
        SIGNUP: '/auth/signup',
        LOGOUT: '/auth/logout',

        // News Analysis
        ANALYZE: '/analyze',

        // History
        GET_HISTORY: '/history',
        GET_ITEM: '/history/:id',
        DELETE_ITEM: '/history/:id'
    } 
};

//  Helper Functions 
const api = {
    // Make request function 
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('authToken');

        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && {'Authorization': `Bearer ${token}`}),
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, config);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Something went wrong');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Authentication  
    async login(email, password) {
        const data = await this.request(API_CONFIG.ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify({email, password})
        });

        if (data.token) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        return data;
    },

    async signup(fullName, email, password) {
        const data = await this.request(API_CONFIG.ENDPOINTS.SIGNUP, {
            method: 'POST',
            body: JSON.stringify({fullName, email, password})
        });

        if (data.token) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        return data;
    },

    async logout() {
        try {
            await this.request(API_CONFIG.ENDPOINTS.LOGOUT, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout Error:', error);
        }
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    },

    // Analysis APIs
    async analyzeContent(text, type = 'text') {
        return await this.request(API_CONFIG.ENDPOINTS.ANALYZE, {
            method: 'POST',
            body: JSON.stringify({
                content: text,
                type: type 
            })
        });
    },

    // History 
    async getHistory() {
        return await this.request(API_CONFIG.ENDPOINTS.GET_HISTORY, {
            method: 'GET'
        });
    },

    async getHistoryItem(id) {
        const endpoint = API_CONFIG.ENDPOINTS.GET_ITEM.replace(':id', id);
        return await this.request(endpoint, {
            method: 'GET'
        });
    },

    async deleteHistoryItem(id) {
        const endpoint = API_CONFIG.ENDPOINTS.DELETE_ITEM.replace(':id', id);
        return await this.request(endpoint, {
            method: 'DELETE'
        });
    },

    // Check  authenticated
    isAuthenticated() {
        return !!localStorage.getItem('authToken');
    },

    // Get current user 
    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
};


window.api = api;
window.API_CONFIG = API_CONFIG;