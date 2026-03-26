// Global constants
const canvas = document.getElementById('glCanvas'); // Get the canvas element
const gl = canvas.getContext('webgl2'); // Get the WebGL2 context

if (!gl) {
  console.error('WebGL 2 is not supported by your browser.');
}

// Set canvas size: 500 x 500
canvas.width = 500;
canvas.height = 500;

// Initialize WebGL settings: viewport and clear color
gl.clearColor(0.1, 0.2, 0.3, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

gl.enable(gl.SCISSOR_TEST);

// Start rendering
render();

// Render loop
function render() {
  gl.viewport(0, 0, canvas.width / 2, canvas.height / 2);
  gl.scissor(0, 0, canvas.width / 2, canvas.height / 2);
  gl.clearColor(0, 0, 1, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.viewport(canvas.width / 2, 0, canvas.width / 2, canvas.height / 2);
  gl.scissor(canvas.width / 2, 0, canvas.width / 2, canvas.height / 2);
  gl.clearColor(1, 1, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.viewport(
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2,
    canvas.height / 2,
  );
  gl.scissor(
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2,
    canvas.height / 2,
  );
  gl.clearColor(1, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.viewport(0, canvas.height / 2, canvas.width / 2, canvas.height / 2);
  gl.scissor(0, canvas.height / 2, canvas.width / 2, canvas.height / 2);
  gl.clearColor(0, 1, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

// Resize: canvas의 가로 세로 비율 1:1 유지
window.addEventListener('resize', () => {
  canvas.width = Math.min(window.innerWidth, window.innerHeight);
  canvas.height = Math.min(window.innerWidth, window.innerHeight);
  gl.viewport(0, 0, canvas.width, canvas.height);
  render();
});
