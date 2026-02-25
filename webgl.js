(() => {
  const canvas = document.getElementById('threat-grid');
  const gl = canvas.getContext('webgl', { antialias: true, alpha: true });

  if (!gl) {
    return;
  }

  const vertexSource = `
    attribute vec2 position;
    attribute float size;
    uniform float time;
    uniform vec2 resolution;
    varying float pulse;

    void main() {
      float drift = sin(time * 0.8 + position.x * 10.0 + position.y * 8.0) * 0.015;
      vec2 pos = position + vec2(drift, -drift * 0.5);
      pulse = 0.5 + 0.5 * sin(time * 1.8 + position.x * 12.0);
      gl_Position = vec4(pos, 0.0, 1.0);
      gl_PointSize = size * (1.2 + pulse * 0.8);
    }
  `;

  const fragmentSource = `
    precision mediump float;
    varying float pulse;

    void main() {
      float dist = distance(gl_PointCoord, vec2(0.5));
      float soft = smoothstep(0.5, 0.08, dist);
      vec3 base = mix(vec3(0.15, 0.45, 1.0), vec3(0.5, 0.9, 1.0), pulse);
      gl_FragColor = vec4(base, soft * 0.85);
    }
  `;

  function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) {
    return;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  const positions = [];
  const sizes = [];
  const points = 180;

  for (let i = 0; i < points; i += 1) {
    positions.push(Math.random() * 2 - 1, Math.random() * 2 - 1);
    sizes.push(Math.random() * 2.4 + 1.2);
  }

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const sizeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW);

  const positionLocation = gl.getAttribLocation(program, 'position');
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const sizeLocation = gl.getAttribLocation(program, 'size');
  gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
  gl.enableVertexAttribArray(sizeLocation);
  gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, 0, 0);

  const timeLocation = gl.getUniformLocation(program, 'time');

  function resize() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  resize();
  window.addEventListener('resize', resize);

  const lines = [];
  for (let i = 0; i < points; i += 1) {
    for (let j = i + 1; j < points; j += 1) {
      const ax = positions[i * 2];
      const ay = positions[i * 2 + 1];
      const bx = positions[j * 2];
      const by = positions[j * 2 + 1];
      const d = Math.hypot(ax - bx, ay - by);
      if (d < 0.3) {
        lines.push(ax, ay, bx, by);
      }
    }
  }

  const lineBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.STATIC_DRAW);

  function render(ms) {
    const time = ms * 0.001;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.uniform1f(timeLocation, time);

    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.disableVertexAttribArray(sizeLocation);
    gl.vertexAttrib1f(sizeLocation, 1.1);
    gl.drawArrays(gl.LINES, 0, lines.length / 2);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.enableVertexAttribArray(sizeLocation);
    gl.vertexAttribPointer(sizeLocation, 1, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, points);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
})();
