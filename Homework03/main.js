// 중심점을 찍고 원을 그리면 됨(반지름만 변하게)

import {
  resizeAspectRatio,
  setupText,
  updateText,
  Axes,
} from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

// Global variables
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let isInitialized = false; // main이 실행되는 순간 true로 change
let shader;
let vao;
let positionBuffer; // 2D position을 위한 VBO (Vertex Buffer Object)
let isDrawing = false; // mouse button을 누르고 있는 동안 true로 change
let startPoint = null; // mouse button을 누른 위치
let tempEndPoint = null; // mouse를 움직이는 동안의 위치
let lines = []; // 그려진 선분들을 저장하는 array
let intersectionPoints = [];
let textOverlay; // 1st line segment 정보 표시
let textOverlay2; // 2nd line segment 정보 표시
let textOverlay3; // 3rd line segment 정보 표시
let axes = new Axes(gl, 0.85); // x, y axes 그려주는 object (see util.js)

document.addEventListener('DOMContentLoaded', () => {
  if (isInitialized) {
    // true인 경우는 main이 이미 실행되었다는 뜻이므로 다시 실행하지 않음
    console.log('Already initialized');
    return;
  }

  main()
    .then((success) => {
      // call main function
      if (!success) {
        console.log('프로그램을 종료합니다.');
        return;
      }
      isInitialized = true;
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
  gl.clearColor(0.1, 0.2, 0.3, 1.0);

  return true;
}

function setupBuffers() {
  vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  shader.setAttribPointer('a_position', 2, gl.FLOAT, false, 0, 0); // x, y 2D 좌표

  gl.bindVertexArray(null);
}

// 좌표 변환 함수: 캔버스 좌표를 WebGL 좌표로 변환
// 캔버스 좌표: 캔버스 좌측 상단이 (0, 0), 우측 하단이 (canvas.width, canvas.height)
// WebGL 좌표 (NDC): 캔버스 좌측 하단이 (-1, -1), 우측 상단이 (1, 1)
function convertToWebGLCoordinates(x, y) {
  return [
    (x / canvas.width) * 2 - 1, // x/canvas.width 는 0 ~ 1 사이의 값, 이것을 * 2 - 1 하면 -1 ~ 1 사이의 값
    -((y / canvas.height) * 2 - 1), // y canvas 좌표는 상하를 뒤집어 주어야 하므로 -1을 곱함
  ];
}

/* 
    browser window
    +----------------------------------------+
    | toolbar, address bar, etc.             |
    +----------------------------------------+
    | browser viewport (컨텐츠 표시 영역)       | 
    | +------------------------------------+ |
    | |                                    | |
    | |    canvas                          | |
    | |    +----------------+              | |
    | |    |                |              | |
    | |    |      *         |              | |
    | |    |                |              | |
    | |    +----------------+              | |
    | |                                    | |
    | +------------------------------------+ |
    +----------------------------------------+

    *: mouse click position

    event.clientX = browser viewport 왼쪽 경계에서 마우스 클릭 위치까지의 거리
    event.clientY = browser viewport 상단 경계에서 마우스 클릭 위치까지의 거리
    rect.left = browser viewport 왼쪽 경계에서 canvas 왼쪽 경계까지의 거리
    rect.top = browser viewport 상단 경계에서 canvas 상단 경계까지의 거리

    x = event.clientX - rect.left  // canvas 내에서의 클릭 x 좌표
    y = event.clientY - rect.top   // canvas 내에서의 클릭 y 좌표
*/

function setupMouseEvents() {
  function handleMouseDown(event) {
    event.preventDefault(); // 이미 존재할 수 있는 기본 동작을 방지
    event.stopPropagation(); // event가 상위 요소 (div, body, html 등)으로 전파되지 않도록 방지

    const rect = canvas.getBoundingClientRect(); // canvas를 나타내는 rect 객체를 반환
    const x = event.clientX - rect.left; // canvas 내 x 좌표
    const y = event.clientY - rect.top; // canvas 내 y 좌표

    if (!isDrawing && lines.length < 2) {
      // 1번 또는 2번 선분을 그리고 있는 도중이 아닌 경우 (즉, mouse down 상태가 아닌 경우)
      // 캔버스 좌표를 WebGL 좌표로 변환하여 선분의 시작점을 설정
      let [glX, glY] = convertToWebGLCoordinates(x, y);
      startPoint = [glX, glY];
      isDrawing = true; // 이제 mouse button을 놓을 때까지 계속 true로 둠. 즉, mouse down 상태가 됨
    }
  }

  function handleMouseMove(event) {
    if (isDrawing) {
      // 1번 또는 2번 선분을 그리고 있는 도중인 경우
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      let [glX, glY] = convertToWebGLCoordinates(x, y);
      tempEndPoint = [glX, glY]; // 임시 선분의 끝 point
      render();
    }
  }

  function handleMouseUp() {
    if (isDrawing && tempEndPoint) {
      lines.push([...startPoint, ...tempEndPoint]);

      // 원
      if (lines.length == 1) {
        const cx = lines[0][0];
        const cy = lines[0][1];
        const ex = lines[0][2];
        const ey = lines[0][3];
        const r = Math.sqrt((ex - cx) ** 2 + (ey - cy) ** 2);

        updateText(
          textOverlay,
          'Circle: center (' +
            cx.toFixed(2) +
            ', ' +
            cy.toFixed(2) +
            ') radius = ' +
            r.toFixed(2),
        );
      }
      // line + intersection
      else if (lines.length == 2) {
        const circle = lines[0];
        const line = lines[1];

        const cx = circle[0];
        const cy = circle[1];
        const ex = circle[2];
        const ey = circle[3];
        const r = Math.sqrt((ex - cx) ** 2 + (ey - cy) ** 2);

        const x1 = line[0];
        const y1 = line[1];
        const x2 = line[2];
        const y2 = line[3];
        const dx = x2 - x1;
        const dy = y2 - y1;

        const a = dx * dx + dy * dy;
        const b = 2 * (dx * (x1 - cx) + dy * (y1 - cy));
        const c = (x1 - cx) ** 2 + (y1 - cy) ** 2 - r * r;

        const D = b * b - 4 * a * c;

        let points = [];

        if (D < 0) {
          updateText(textOverlay3, 'No intersection');
        } else if (D === 0) {
          const t = -b / (2 * a);

          if (t >= 0 && t <= 1) {
            const x = x1 + t * dx;
            const y = y1 + t * dy;
            points.push([x, y]);
          }
        } else {
          const t1 = (-b - Math.sqrt(D)) / (2 * a);
          const t2 = (-b + Math.sqrt(D)) / (2 * a);

          if (t1 >= 0 && t1 <= 1) {
            points.push([x1 + t1 * dx, y1 + t1 * dy]);
          }
          if (t2 >= 0 && t2 <= 1) {
            points.push([x1 + t2 * dx, y1 + t2 * dy]);
          }
        }

        updateText(
          textOverlay2,
          'Line segment: (' +
            x1.toFixed(2) +
            ', ' +
            y1.toFixed(2) +
            ') ~ (' +
            x2.toFixed(2) +
            ', ' +
            y2.toFixed(2) +
            ')',
        );

        if (points.length == 0) {
          updateText(textOverlay3, 'No intersection');
        } else if (points.length == 1) {
          updateText(
            textOverlay3,
            'Intersection Points: 1 Point 1: (' +
              points[0][0].toFixed(2) +
              ', ' +
              points[0][1].toFixed(2) +
              ')',
          );
        } else {
          updateText(
            textOverlay3,
            'Intersection Points: 2 Point 1: (' +
              points[0][0].toFixed(2) +
              ', ' +
              points[0][1].toFixed(2) +
              ') Point 2: (' +
              points[1][0].toFixed(2) +
              ', ' +
              points[1][1].toFixed(2) +
              ')',
          );
        }
        intersectionPoints = points;
      }

      isDrawing = false;
      startPoint = null;
      tempEndPoint = null;
      render();
    }
  }

  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  shader.use();

  // 저장된 선들 그리기
  let num = 0;
  for (let line of lines) {
    if (num == 0) {
      // 원
      shader.setVec4('u_color', [1.0, 0.0, 1.0, 1.0]);

      const cx = line[0]; // 중심점 x
      const cy = line[1]; // 중심점 y
      const ex = line[2];
      const ey = line[3];

      const r = Math.sqrt((ex - cx) ** 2 + (ey - cy) ** 2);

      const vertices = [];
      const N = 100;

      for (let i = 0; i < N; i++) {
        const theta = (2 * Math.PI * i) / N;
        const x = cx + r * Math.cos(theta);
        const y = cy + r * Math.sin(theta);
        vertices.push(x, y);
      }
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertices),
        gl.STATIC_DRAW,
      );
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.LINE_LOOP, 0, N);
    } else {
      // 선분
      shader.setVec4('u_color', [0.7, 0.8, 1.0, 1.0]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(line), gl.STATIC_DRAW);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.LINES, 0, 2);
    }
    num++;
  }

  // 임시 선 그리기
  if (isDrawing && startPoint && tempEndPoint) {
    shader.setVec4('u_color', [0.5, 0.5, 0.5, 1.0]);

    if (lines.length == 0) {
      const cx = startPoint[0];
      const cy = startPoint[1];
      const ex = tempEndPoint[0];
      const ey = tempEndPoint[1];

      const r = Math.sqrt((ex - cx) ** 2 + (ey - cy) ** 2);

      const vertices = [];
      const N = 200;

      for (let i = 0; i < N; i++) {
        const theta = (2 * Math.PI * i) / N;
        const x = cx + r * Math.cos(theta);
        const y = cy + r * Math.sin(theta);
        vertices.push(x, y);
      }
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertices),
        gl.STATIC_DRAW,
      );
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.LINE_LOOP, 0, N);
    } else {
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([...startPoint, ...tempEndPoint]),
        gl.STATIC_DRAW,
      );
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.LINES, 0, 2);
    }
  }

  // axes 그리기
  axes.draw(mat4.create(), mat4.create());

  // intersection 그리기
  if (intersectionPoints && intersectionPoints.length > 0) {
    shader.use();
    const flat = intersectionPoints.flat();

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flat), gl.STATIC_DRAW);
    gl.bindVertexArray(vao);

    shader.setVec4('u_color', [1.0, 1.0, 0.0, 1.0]);

    gl.drawArrays(gl.POINTS, 0, intersectionPoints.length);
  }
}

async function initShader() {
  const vertexShaderSource = await readShaderFile('shVert.glsl');
  const fragmentShaderSource = await readShaderFile('shFrag.glsl');
  shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
  try {
    if (!initWebGL()) {
      throw new Error('WebGL 초기화 실패');
      return false;
    }

    // 셰이더 초기화
    await initShader();

    // 나머지 초기화
    setupBuffers();
    shader.use();

    // 텍스트 초기화
    textOverlay = setupText(canvas, '', 1);
    textOverlay2 = setupText(canvas, '', 2);
    textOverlay3 = setupText(canvas, '', 3);

    // 마우스 이벤트 설정
    setupMouseEvents();

    // 초기 렌더링
    render();

    return true;
  } catch (error) {
    console.error('Failed to initialize program:', error);
    alert('프로그램 초기화에 실패했습니다.');
    return false;
  }
}
