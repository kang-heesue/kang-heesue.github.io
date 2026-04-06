import { resizeAspectRatio } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let vao;
let startTime = 0;

document.addEventListener('DOMContentLoaded', () => {
  if (isInitialized) {
    console.log('Already initialized');
    return;
  }

  main()
    .then((success) => {
      if (!success) {
        console.log('프로그램을 종료합니다.');
        return;
      }
      isInitialized = true;
      render();
    })
    .catch((error) => {
      console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
  if (!gl) {
    console.error('WebGL 2 is not supported by your browser.');
    return false;
  }

  canvas.width = 700;
  canvas.height = 700;
  resizeAspectRatio(gl, canvas);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.2, 0.3, 0.4, 1.0);

  return true;
}

function setupBuffers() {
  // prettier-ignore
  const rectVertices = new Float32Array([
    -0.5, 0.5, // 좌상단
    -0.5, -0.5, // 좌하단
    0.5, -0.5, // 우하단
    0.5, 0.5, // 우상단
  ]);

  // prettier-ignore
  const indices = new Uint16Array([
        0, 1, 2,    // 첫 번째 삼각형
        0, 2, 3     // 두 번째 삼각형
    ]);

  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // VBO for position
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, rectVertices, gl.STATIC_DRAW);
  shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0);

  // EBO
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  gl.bindVertexArray(null);
}

async function initShader() {
  const vertexShaderSource = await readShaderFile('shVert.glsl');
  const fragmentShaderSource = await readShaderFile('shFrag.glsl');
  shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

function drawRect(matrix, color) {
  shader.setMat4('u_transform', matrix);
  shader.setVec4('v_color', color);
  gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}

function render() {
  const currentTime = Date.now();
  const elapsedTime = (currentTime - startTime) / 1000.0;

  gl.clear(gl.COLOR_BUFFER_BIT);

  shader.use();
  gl.bindVertexArray(vao);

  const hubX = 0.0;
  const hubY = 0.3;

  const bigAngle = Math.sin(elapsedTime) * Math.PI * 2.0;
  const smallAngle = Math.sin(elapsedTime) * Math.PI * -10.0;

  // 기둥
  const pillarMatrix = mat4.create();
  mat4.translate(pillarMatrix, pillarMatrix, [0.0, -0.25, 0.0]);
  mat4.scale(pillarMatrix, pillarMatrix, [0.18, 1.1, 1.0]);
  drawRect(pillarMatrix, [0.5, 0.3, 0.1, 1.0]);

  // 큰 날개
  const bigBladeMatrix = mat4.create();
  mat4.translate(bigBladeMatrix, bigBladeMatrix, [hubX, hubY, 0.0]);
  mat4.rotate(bigBladeMatrix, bigBladeMatrix, bigAngle, [0, 0, 1]);
  mat4.scale(bigBladeMatrix, bigBladeMatrix, [0.8, 0.15, 1.0]);
  drawRect(bigBladeMatrix, [0.9, 0.9, 0.9, 1.0]);

  // 왼쪽 작은 날개
  const leftSmallMatrix = mat4.create();
  mat4.translate(leftSmallMatrix, leftSmallMatrix, [hubX, hubY, 0.0]);
  mat4.rotate(leftSmallMatrix, leftSmallMatrix, bigAngle, [0, 0, 1]);
  mat4.translate(leftSmallMatrix, leftSmallMatrix, [-0.4, 0.0, 0.0]);
  mat4.rotate(leftSmallMatrix, leftSmallMatrix, 0.45, [0, 0, 1]);
  mat4.rotate(leftSmallMatrix, leftSmallMatrix, smallAngle, [0, 0, 1]);
  mat4.scale(leftSmallMatrix, leftSmallMatrix, [0.05, 0.25, 1.0]);
  drawRect(leftSmallMatrix, [0.6, 0.6, 0.6, 1.0]);

  // 오른쪽 작은 날개
  const rightSmallMatrix = mat4.create();
  mat4.translate(rightSmallMatrix, rightSmallMatrix, [hubX, hubY, 0.0]);
  mat4.rotate(rightSmallMatrix, rightSmallMatrix, bigAngle, [0, 0, 1]);
  mat4.translate(rightSmallMatrix, rightSmallMatrix, [0.4, 0.0, 0.0]);
  mat4.rotate(rightSmallMatrix, rightSmallMatrix, -0.45, [0, 0, 1]);
  mat4.rotate(rightSmallMatrix, rightSmallMatrix, smallAngle, [0, 0, 1]);
  mat4.scale(rightSmallMatrix, rightSmallMatrix, [0.05, 0.25, 1.0]);
  drawRect(rightSmallMatrix, [0.6, 0.6, 0.6, 1.0]);

  gl.bindVertexArray(null);
  requestAnimationFrame(render);
}

async function main() {
  try {
    if (!initWebGL()) {
      throw new Error('WebGL 초기화 실패');
    }

    await initShader();
    setupBuffers();

    return true;
  } catch (error) {
    console.error('Failed to initialize program:', error);
    alert('프로그램 초기화에 실패했습니다.');
    return false;
  }
}
