// This file contains the JavaScript code for the application. It manages client-side interactions, including WebSocket connections for real-time updates of canvases.

const canvasId = 'your_canvas_id'; // Replace with the actual canvas ID
const socket = new WebSocket(`ws://localhost:8080/canvas/${canvasId}`);

socket.onopen = function() {
    console.log('WebSocket connection established');
};

socket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    updateCanvas(data);
};

socket.onclose = function() {
    console.log('WebSocket connection closed');
};

function updateCanvas(data) {
    // Logic to update the canvas with new pixel data
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    
    // Assuming data contains x, y coordinates and color
    context.fillStyle = data.color;
    context.fillRect(data.x, data.y, 1, 1); // Draw a single pixel
}

function sendPixel(x, y, color) {
    const pixelData = { x, y, color };
    socket.send(JSON.stringify(pixelData));
}

// Event listener for canvas clicks to place pixels
document.getElementById('canvas').addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);
    const color = '#FF0000'; // Example color, replace with user-selected color

    sendPixel(x, y, color);
});