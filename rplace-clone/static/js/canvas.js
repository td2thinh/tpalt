//// filepath: /C:/Users/Freecs/Desktop/M2/GPSTL/tpalt/rplace-clone/static/js/canvas.js
const canvas = document.getElementById("collabCanvas");
const ctx = canvas.getContext("2d");
const pixelSize = 10;

// Draw grid for visual guidance
function drawGrid() {
  ctx.beginPath();
  for (let x = 0; x <= canvas.width; x += pixelSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  for (let y = 0; y <= canvas.height; y += pixelSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.strokeStyle = "#ddd";
  ctx.stroke();
}
drawGrid();

// Maintain a current selected color from the color picker
let currentColor = document.getElementById("colorPicker").value;
document.getElementById("colorPicker").addEventListener("change", (e) => {
  currentColor = e.target.value;
});

// WebSocket connection (use ws:// or wss:// as appropriate)
const ws = new WebSocket(
  "ws://" +
    window.location.host +
    "/ws/canvas/" +
    document.getElementById("canvasId").innerText
);

ws.onopen = function () {
  console.log("WebSocket connection established");
};

ws.onmessage = function (event) {
  const msg = JSON.parse(event.data);
  // Expect msg to contain { x, y, color }
  ctx.fillStyle = msg.color;
  ctx.fillRect(msg.x * pixelSize, msg.y * pixelSize, pixelSize, pixelSize);
};

ws.onclose = function () {
  console.log("WebSocket connection closed");
};

// Place pixel when the "Placer Pixel" button is clicked
document.getElementById("placePixel").addEventListener("click", () => {
  // For this demo, we use the center of the canvas; you can modify this
  const gridX = Math.floor(canvas.width / (2 * pixelSize));
  const gridY = Math.floor(canvas.height / (2 * pixelSize));

  // Draw locally
  ctx.fillStyle = currentColor;
  ctx.fillRect(gridX * pixelSize, gridY * pixelSize, pixelSize, pixelSize);

  // Send pixel data to server via WebSocket
  const message = { x: gridX, y: gridY, color: currentColor };
  ws.send(JSON.stringify(message));
});

// Also allow placing pixel with a canvas click (optional)
canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const gridX = Math.floor(x / pixelSize);
  const gridY = Math.floor(y / pixelSize);

  // Draw on canvas
  ctx.fillStyle = currentColor;
  ctx.fillRect(gridX * pixelSize, gridY * pixelSize, pixelSize, pixelSize);

  // Send update via WebSocket
  const message = { x: gridX, y: gridY, color: currentColor };
  ws.send(JSON.stringify(message));
});

// Clear the canvas and redraw grid
document.getElementById("clearCanvas").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
});
