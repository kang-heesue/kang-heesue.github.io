/*
        y
        |
        v0   

     v4------v3
     /   .   /----> x
    v1------v2
        |
        z

    front, right, back, left: 3 vertices -> 12
    bottom: 4 vertices -> 4
    total: 16 vertices -> 48 floats
*/

export class SquarePyramid {
  constructor(gl, options = {}) {
    this.gl = gl;

    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();
    this.ebo = gl.createBuffer();

    this.vertices = new Float32Array([
      // front face  (v0, v1, v2)
      0, 1, 0, -0.5, 0, 0.5, 0.5, 0, 0.5,
      // right face  (v0, v2, v3)
      0, 1, 0, 0.5, 0, 0.5, 0.5, 0, -0.5,
      // back face   (v0, v3, v4)
      0, 1, 0, 0.5, 0, -0.5, -0.5, 0, -0.5,
      // left face   (v0, v4, v1)
      0, 1, 0, -0.5, 0, -0.5, -0.5, 0, 0.5,
      // bottom face (v4, v3, v2, v1)
      -0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5,
    ]);

    // 법선 벡터
    const ny = 1.0 / Math.sqrt(5.0);
    const nxz = 2.0 / Math.sqrt(5.0);

    // prettier-ignore
    this.normals = new Float32Array([
      // front face  (v0, v1, v2)
      0, ny, nxz, 0, ny, nxz, 0, ny, nxz,
      // right face  (v0, v2, v3)
      nxz, ny, 0, nxz, ny, 0, nxz, ny, 0,
      // back face   (v0, v3, v4)
      0, ny, -nxz, 0, ny, -nxz, 0, ny, -nxz,
      // left face   (v0, v4, v1)
      -nxz, ny, 0, -nxz, ny, 0, -nxz, ny, 0,
      // bottom face (v4, v3, v2, v1)
      0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0
    ]);

    // if color is provided, set all vertices' color to the given color
    if (options.color) {
      this.colors = new Float32Array(16 * 4);
      for (let i = 0; i < 16 * 4; i += 4) {
        this.colors[i] = options.color[0];
        this.colors[i + 1] = options.color[1];
        this.colors[i + 2] = options.color[2];
        this.colors[i + 3] = options.color[3];
      }
    } else {
      this.colors = new Float32Array([
        // front face (v0, v1, v2) - red
        1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1,
        // right face (v0, v2, v3) - yellow
        1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1,
        // back face (v0, v3, v4) - magenta
        1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1,
        // left face (v0, v4, v1) - cyan
        0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1,
        // bottom face (v4, v3, v2, v1) - blue
        0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1,
      ]);
    }

    this.texCoords = new Float32Array([
      // front face  (v0, v1, v2)
      0.5, 1, 0, 0, 1, 0,
      // right face  (v0, v2, v3)
      0.5, 1, 0, 0, 1, 0,
      // back face   (v0, v3, v4)
      0.5, 1, 0, 0, 1, 0,
      // left face   (v0, v4, v1)
      0.5, 1, 0, 0, 1, 0,
      // bottom face (v4, v3, v2, v1)
      0, 0, 1, 0, 1, 1, 0, 1,
    ]);

    // prettier-ignore
    this.indices = new Uint16Array([
      // front face
      0, 1, 2, // v0-v1-v2
      // right face
      3, 4, 5, // v0-v2-v3
      // back face
      6, 7, 8, // v0-v3-v4
      // left face
      9, 10, 11, // v0-v4-v1
      // bottom face
      12, 13, 14, 14, 15, 12, // v4-v3-v2, v2-v1-v4
    ]);

    this.initBuffers();
  }

  initBuffers() {
    const gl = this.gl;

    // 버퍼 크기 계산
    const vSize = this.vertices.byteLength;
    const nSize = this.normals.byteLength;
    const cSize = this.colors.byteLength;
    const tSize = this.texCoords.byteLength;
    const totalSize = vSize + nSize + cSize + tSize;

    gl.bindVertexArray(this.vao);

    // VBO에 데이터 복사
    // gl.bufferSubData(target, offset, data): target buffer의
    //     offset 위치부터 data를 copy (즉, data를 buffer의 일부에만 copy)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, totalSize, gl.STATIC_DRAW);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.vertices);
    gl.bufferSubData(gl.ARRAY_BUFFER, vSize, this.normals);
    gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize, this.colors);
    gl.bufferSubData(gl.ARRAY_BUFFER, vSize + nSize + cSize, this.texCoords);

    // EBO에 인덱스 데이터 복사
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    // vertex attributes 설정
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); // position
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, vSize); // normal
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, vSize + nSize); // color
    gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 0, vSize + nSize + cSize); // texCoord

    // vertex attributes 활성화
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.enableVertexAttribArray(3);

    // 버퍼 바인딩 해제
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);
  }

  draw(shader) {
    const gl = this.gl;
    shader.use();
    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, 18, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }

  delete() {
    const gl = this.gl;
    gl.deleteBuffer(this.vbo);
    gl.deleteBuffer(this.ebo);
    gl.deleteVertexArray(this.vao);
  }
}
