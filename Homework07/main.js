import { Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';
import { SquarePyramid } from './squarePyramid.js';
import { loadTexture } from '../util/texture.js';
import { Arcball } from '../util/arcball.js';

const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let startTime;
let lastFrameTime;
let isInitialized = false;
let viewMatrix = mat4.create();
let projMatrix = mat4.create();
let modelMatrix = mat4.create();
const cameraCircleRadius = 3.0;
const cameraCircleHeight = 5.0; // 바닥에서 띄워서 위에서 내려다보게 함
const cameraCircleSpeed = 90.0; // 1초에 90도 회전
const texture = loadTexture(gl, true, '../images/textures/sunrise.jpg');
const squarePyramid = new SquarePyramid(gl);
const axes = new Axes(gl, 1.8);

const arcball = new Arcball(canvas, 5.0, { rotation: 2.0, zoom: 0.0005 });

document.addEventListener('DOMContentLoaded', () => {
  if (isInitialized) {
    console.log('Already initialized');
    return;
  }

  main()
    .then((success) => {
      if (!success) {
        console.log('program terminated');
        return;
      }
      isInitialized = true;
    })
    .catch((error) => {
      console.error('program terminated with error:', error);
    });
});

function initWebGL() {
  if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
    return false;
  }

  canvas.width = 700;
  canvas.height = 700;
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.1, 0.2, 0.3, 1.0);

  return true;
}

async function initShader() {
  const vertexShaderSource = await readShaderFile('shVert.glsl');
  const fragmentShaderSource = await readShaderFile('shFrag.glsl');
  shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function render() {
  const currentTime = Date.now();
  const elapsedTime = (currentTime - startTime) / 1000.0;
  lastFrameTime = currentTime;

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  viewMatrix = arcball.getViewMatrix();

  shader.use();
  shader.setMat4('u_model', modelMatrix);
  shader.setMat4('u_view', viewMatrix);
  shader.setMat4('u_projection', projMatrix);
  squarePyramid.draw(shader);

  axes.draw(viewMatrix, projMatrix);

  requestAnimationFrame(render);
}

async function main() {
  try {
    if (!initWebGL()) {
      throw new Error('WebGL initialization failed');
    }

    await initShader();

    mat4.translate(viewMatrix, viewMatrix, vec3.fromValues(0, 0, -3));

    // Projection transformation matrix
    mat4.perspective(
      projMatrix,
      glMatrix.toRadian(60), // field of view (fov, degree)
      canvas.width / canvas.height, // aspect ratio
      0.1, // near
      100.0, // far
    );

    // starting time (global variable) for animation
    startTime = lastFrameTime = Date.now();

    shader.use();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    shader.setInt('u_texture', 0);

    // call the render function the first time for animation
    requestAnimationFrame(render);

    return true;
  } catch (error) {
    console.error('Failed to initialize program:', error);
    alert('Failed to initialize program');
    return false;
  }
}
