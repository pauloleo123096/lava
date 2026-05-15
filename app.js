import { setupShaderCanvas } from './lavaShader.js';

const arCanvas = document.getElementById('ar-canvas');
const uiCanvas = document.getElementById('ui-canvas');
const videoElement = document.getElementById('webcam');
const gl = arCanvas.getContext('webgl');
const ctx = uiCanvas.getContext('2d'); // 2D context for drawing safe zones

// Set both canvases to full screen
arCanvas.width = uiCanvas.width = window.innerWidth;
arCanvas.height = uiCanvas.height = window.innerHeight;

// 1. Keep the Lava Engine running
setupShaderCanvas(gl, arCanvas);

// 2. Define the Game Level (The Safe Zones)
// We use percentages (0.1 to 0.9) so it scales to any massive mall screen
const safeZones = [
    { x: uiCanvas.width * 0.2, y: uiCanvas.height * 0.5, radius: 150 }, // Left Island
    { x: uiCanvas.width * 0.5, y: uiCanvas.height * 0.3, radius: 200 }, // Center Island
    { x: uiCanvas.width * 0.8, y: uiCanvas.height * 0.6, radius: 150 }  // Right Island
];

// 3. Initialize AI Pose Tracking
const pose = new Pose({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
}});

pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

// 4. The Core Game Logic Loop
pose.onResults((results) => {
    ctx.clearRect(0, 0, uiCanvas.width, uiCanvas.height); // Clear previous frame

    // Draw the Safe Zones (Temporary green circles until we add Orchid sprites)
    ctx.fillStyle = 'rgba(0, 255, 100, 0.4)';
    ctx.strokeStyle = '#00FF64';
    ctx.lineWidth = 5;
    
    safeZones.forEach(zone => {
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    });

    if (!results.poseLandmarks) return; // Nobody detected

    // Grab Ankle Coordinates
    const leftAnkle = results.poseLandmarks[27];
    const rightAnkle = results.poseLandmarks[28];
    const leftX = leftAnkle.x * uiCanvas.width;
    const leftY = leftAnkle.y * uiCanvas.height;

    // Draw a visual marker where the AI thinks the player is
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(leftX, leftY, 20, 0, 2 * Math.PI);
    ctx.fill();

    // Check Collision: Is the player in a safe zone?
    let isSafe = false;
    for (let zone of safeZones) {
        // Distance Formula
        const distance = Math.sqrt(Math.pow(leftX - zone.x, 2) + Math.pow(leftY - zone.y, 2));
        if (distance < zone.radius) {
            isSafe = true;
            break; // Stop checking if they are safe in at least one zone
        }
    }

    // Display the Game Status on screen
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    if (isSafe) {
        ctx.fillStyle = '#00FF00';
        ctx.fillText("STATUS: SAFE", uiCanvas.width / 2, 100);
    } else {
        ctx.fillStyle = '#FF0000';
        ctx.fillText("STATUS: IN LAVA!", uiCanvas.width / 2, 100);
        
        // Optional: Flash the screen red if they are burning
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(0, 0, uiCanvas.width, uiCanvas.height);
    }
});

// 5. Boot up the Camera
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await pose.send({image: videoElement});
    },
    width: 1280,
    height: 720
});
camera.start();
