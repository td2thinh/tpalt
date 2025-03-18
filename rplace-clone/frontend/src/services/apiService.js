import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

class ApiService {
    constructor() {
        this.api = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add a request interceptor to include the auth token
        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );
    }

    // Auth methods
    async register(username, password) {
        try {
            const response = await this.api.post('/auth/register', {
                username,
                password,
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async login(username, password) {
        try {
            const response = await this.api.post('/auth/login', {
                username,
                password,
            });

            // Store the token in localStorage
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }

            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    isAuthenticated() {
        return !!localStorage.getItem('token');
    }

    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    // Canvas methods
    async listCanvases() {
        try {
            const response = await this.api.get('/canvases');
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getCanvas(canvasId) {
        if (!canvasId || canvasId === 'undefined') {
            throw new Error('Invalid canvas ID');
        }

        try {
            const response = await this.api.get(`/canvas/${canvasId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getCanvasPixels(canvasId) {
        if (!canvasId || canvasId === 'undefined') {
            throw new Error('Invalid canvas ID');
        }

        try {
            const response = await this.api.get(`/canvas/${canvasId}/pixels`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async createCanvas(name, description, size) {
        try {
            const response = await this.api.post('/canvas', {
                name,
                description,
                size,
            });

            // Validate that the response contains a valid UUID
            if (!response.data || !response.data.uuid || response.data.uuid === 'undefined') {
                throw new Error('Invalid canvas data returned from server');
            }

            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async updatePixel(canvasId, x, y, color) {
        if (!canvasId || canvasId === 'undefined') {
            throw new Error('Invalid canvas ID');
        }

        try {
            const response = await this.api.post(`/canvas/${canvasId}/pixel`, {
                x,
                y,
                color,
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Snapshot methods
    async getCanvasSnapshot(canvasId) {
        if (!canvasId || canvasId === 'undefined') {
            throw new Error('Invalid canvas ID');
        }

        try {
            const response = await this.api.get(`/canvas/${canvasId}/snapshot`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async createCanvasSnapshot(canvasId) {
        if (!canvasId || canvasId === 'undefined') {
            throw new Error('Invalid canvas ID');
        }

        try {
            const response = await this.api.post(`/canvas/${canvasId}/snapshot`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    getSnapshotUrl(snapshotId) {
        return `${API_URL}/snapshot/${snapshotId}`;
    }

    // Error handling
    handleError(error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            const { status, data } = error.response;

            if (status === 401) {
                // Unauthorized - clear token and redirect to login
                this.logout();
            }

            return new Error(data.error || `Server error: ${status}`);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Network error:', error.request);
            return new Error('Network error: Unable to connect to server');
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Request error:', error.message);
            return new Error(`Request error: ${error.message}`);
        }
    }
}

// Create a singleton instance
const apiService = new ApiService();
export default apiService;