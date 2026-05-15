export function setupShaderCanvas(gl, canvas) {
    const vertexShaderSource = `
        attribute vec4 a_position;
        void main() {
            gl_Position = a_position;
        }
    `;

    // The actual Lava Shader Code (GLSL)
    // This defines the visual quality for the masses.
    const fragmentShaderSource = `
        precision mediump float;
        uniform float u_time;
        uniform vec2 u_resolution;

        // Optimized pseudo-random noise function
        float hash(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        // 2D Noise function for organic textures
        float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f*f*(3.0-2.0*f);
            return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), f.x),
                       mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), f.x), f.y);
        }

        // Fractal Brownian Motion - layers noise for complexity
        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            vec2 shift = vec2(100.0);
            for (int i = 0; i < 6; ++i) { // 6 octaves of noise
                v += a * noise(p);
                p = p * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }

        void main() {
            // Normalize coordinates
            vec2 uv = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
            
            // Generate flow pattern
            float speed = 0.25;
            float strength = 3.0;
            vec2 flow = vec2(
                fbm(uv + speed * u_time),
                fbm(uv + speed * u_time + 10.0)
            );
            
            // Create texture coordinates based on flow
            vec2 p = uv + strength * flow;
            float lavaPattern = fbm(p);
            
            // Color Gradient: Black -> Deep Red -> Orange -> Yellow-White
            vec3 deepRed = vec3(0.3, 0.0, 0.0);
            vec3 orange = vec3(1.0, 0.5, 0.0);
            vec3 hotYellow = vec3(1.0, 0.9, 0.6);
            
            // Smoothly mix colors based on the lavaPattern value (0.0 - 1.0)
            vec3 color = mix(deepRed, orange, smoothstep(0.0, 0.6, lavaPattern));
            color = mix(color, hotYellow, smoothstep(0.5, 0.9, lavaPattern));
            
            // Add slight brightness variation for 'heat'
            color *= 0.8 + 0.2 * noise(p + u_time);

            gl_FragColor = vec4(color, 1.0);
        }
    `;

    // --- (Standard WebGL setup boilerplate below, keep this intact) ---
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    const timeUniformLocation = gl.getUniformLocation(program, "u_time");

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Render loop
    function render(time) {
        time *= 0.001; // convert to seconds
        
        // ADD THIS LINE: Tells WebGL to fill the whole canvas drawing buffer
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
        gl.uniform1f(timeUniformLocation, time);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    // Helper functions
    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }
    function createProgram(gl, vertexShader, fragmentShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        return program;
    }
}
