import { setupShaderCanvas } from './lavaShader.js'; // We'll create this next

const canvas = document.getElementById('ar-canvas');
const gl = canvas.getContext('webgl');

if (!gl) {
    alert("WebGL not supported, your browser is too old for this AR tech!");
}

// Ensure the canvas matches the display size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// This function (defined below) will handle the complex rendering
setupShaderCanvas(gl, canvas);
