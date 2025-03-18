import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.callbacks = {
            onConnect: () => { },
            onDisconnect: () => { },
            onError: () => { },
            onPixelUpdate: () => { },
            onActiveUsers: () => { },
            onJoinedCanvas: () => { },
        };
    }

    connect(url = 'http://localhost:8080') {
        if (this.socket) {
            this.socket.disconnect();
        }

        // Try polling only for now since websocket is having issues
        this.socket = io(url, {
            path: '/socket.io',
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 10000,
            autoConnect: true,
            forceNew: true
        });

        this.setupListeners();
        return this;
    }

    setupListeners() {
        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket.id);
            this.connected = true;
            this.callbacks.onConnect();
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            this.connected = false;
            this.callbacks.onDisconnect(reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.callbacks.onError(`Connection error: ${error.message}`);
        });

        this.socket.on('connect_timeout', (timeout) => {
            console.error('Socket connection timeout:', timeout);
            this.callbacks.onError(`Connection timeout: ${timeout}`);
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.callbacks.onError(error);
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            console.log(`Socket reconnection attempt ${attemptNumber}`);
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log(`Socket reconnected after ${attemptNumber} attempts`);
            this.connected = true;
        });

        this.socket.on('reconnect_error', (error) => {
            console.error('Socket reconnection error:', error);
        });

        this.socket.on('pixel_update', (data) => {
            this.callbacks.onPixelUpdate(data);
        });

        this.socket.on('active_users', (count) => {
            this.callbacks.onActiveUsers(count);
        });

        this.socket.on('joined_canvas', (data) => {
            this.callbacks.onJoinedCanvas(data);
        });

        // Start ping interval to keep connection alive
        setInterval(() => {
            if (this.connected) {
                this.socket.emit('ping');
            }
        }, 30000);
    }

    authenticate(token) {
        if (!this.connected) {
            return Promise.reject(new Error('Socket not connected'));
        }

        return new Promise((resolve, reject) => {
            this.socket.emit('authenticate', token);

            const timeout = setTimeout(() => {
                reject(new Error('Authentication timeout'));
            }, 5000);

            this.socket.once('authenticated', (response) => {
                clearTimeout(timeout);
                if (response.status === 'success') {
                    resolve(response);
                } else {
                    reject(new Error(response.error || 'Authentication failed'));
                }
            });
        });
    }

    joinCanvas(canvasId) {
        if (!this.connected) {
            console.warn('Socket not connected, will try to join canvas when connected');
            // Return a promise that resolves when the socket connects and joins the canvas
            return new Promise((resolve, reject) => {
                const connectHandler = () => {
                    this.socket.off('connect', connectHandler);
                    this._joinCanvasInternal(canvasId).then(resolve).catch(reject);
                };

                this.socket.once('connect', connectHandler);

                // Set a timeout in case the socket never connects
                setTimeout(() => {
                    this.socket.off('connect', connectHandler);
                    reject(new Error('Socket connection timeout'));
                }, 10000);
            });
        }

        return this._joinCanvasInternal(canvasId);
    }

    // Internal method to join a canvas
    _joinCanvasInternal(canvasId) {
        return new Promise((resolve, reject) => {
            console.log(`Joining canvas ${canvasId}...`);
            this.socket.emit('join_canvas', canvasId);

            const timeout = setTimeout(() => {
                console.warn(`Join canvas timeout for ${canvasId}`);
                reject(new Error('Join canvas timeout'));
            }, 5000);

            const joinedHandler = (response) => {
                clearTimeout(timeout);
                console.log(`Joined canvas ${canvasId}:`, response);
                resolve(response);
            };

            const errorHandler = (error) => {
                clearTimeout(timeout);
                console.error(`Error joining canvas ${canvasId}:`, error);
                reject(new Error(typeof error === 'string' ? error : 'Failed to join canvas'));
            };

            this.socket.once('joined_canvas', joinedHandler);
            this.socket.once('error', errorHandler);

            // Clean up event listeners if the promise is rejected
            return () => {
                this.socket.off('joined_canvas', joinedHandler);
                this.socket.off('error', errorHandler);
            };
        });
    }

    leaveCanvas() {
        if (!this.connected) {
            return;
        }

        this.socket.emit('leave_canvas');
    }

    placePixel(x, y, color) {
        if (!this.connected) {
            console.warn('Socket not connected, cannot place pixel');
            return Promise.reject(new Error('Socket not connected'));
        }

        return new Promise((resolve) => {
            console.log(`Placing pixel at (${x}, ${y}) with color ${color}`);
            this.socket.emit('place_pixel', x, y, color);

            // Since we don't get a direct response for pixel placement,
            // we'll resolve immediately and rely on the pixel_update event
            // that will be handled by the global pixel_update handler
            setTimeout(() => resolve(), 100);
        });
    }

    onConnect(callback) {
        this.callbacks.onConnect = callback;
        return this;
    }

    onDisconnect(callback) {
        this.callbacks.onDisconnect = callback;
        return this;
    }

    onError(callback) {
        this.callbacks.onError = callback;
        return this;
    }

    onPixelUpdate(callback) {
        this.callbacks.onPixelUpdate = callback;
        return this;
    }

    onActiveUsers(callback) {
        this.callbacks.onActiveUsers = callback;
        return this;
    }

    onJoinedCanvas(callback) {
        this.callbacks.onJoinedCanvas = callback;
        return this;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;