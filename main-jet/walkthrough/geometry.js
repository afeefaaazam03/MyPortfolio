/* Public Rotor37 saved-result renderer. Geometry/data attribution: ATTRIBUTION.md.
 * No inference, coordinate magnification, clipping, repair or mesh interpolation.
 * One reusable offscreen WebGL context; drawImage() may copy each returned frame.
 */
(() => {
  'use strict';
  const ROLES = ['healthy', 'reference', 'prediction'];
  const SCOPES = ['whole', 'patch'];
  const require = (condition, message) => { if (!condition) throw new Error(message); };

  function unpack(record, kind, columns) {
    require(record && record.dtype === kind && record.shape.length === 2 &&
      record.shape[1] === columns, 'Unexpected saved geometry schema');
    const raw = atob(record.data), size = kind === '<f8' ? 8 : 4;
    const count = record.shape[0] * columns;
    require(raw.length === count * size, 'Saved geometry byte count differs');
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    const view = new DataView(bytes.buffer);
    const result = kind === '<f8' ? new Float64Array(count) : new Uint32Array(count);
    for (let i = 0; i < count; i++) {
      result[i] = kind === '<f8' ? view.getFloat64(i * size, true) : view.getUint32(i * size, true);
      require(Number.isFinite(result[i]), 'Nonfinite saved geometry');
    }
    return result;
  }

  function rotation(yaw, pitch) {
    const a = Math.cos(yaw), b = Math.sin(yaw), c = Math.cos(pitch), d = Math.sin(pitch);
    return new Float32Array([a, d * b, -c * b, 0, c, d, b, -d * a, c * a]);
  }

  class MJGeometry {
    constructor() {
      const data = window.MJ_DATA;
      require(data && data.schema === 'main_jet_source7_walkthrough_v1', 'Load data.js before geometry.js');
      require(data.coordinate_magnification === 1 && data.threshold === 1e-5, 'Display convention changed');
      this.data = data;
      this.canvas = document.createElement('canvas');
      const gl = this.canvas.getContext('webgl', {
        antialias: true, alpha: false, preserveDrawingBuffer: true,
        premultipliedAlpha: false, depth: true
      });
      require(gl, 'This browser cannot display the saved 3D geometry with WebGL');
      this.gl = gl;
      this.vertices = Object.fromEntries(ROLES.map(role => [role, unpack(data.geometry[role], '<f8', 3)]));
      this.faces = unpack(data.geometry.triangles, '<u4', 3);
      const vertexCount = this.vertices.healthy.length / 3;
      require(ROLES.every(role => this.vertices[role].length === vertexCount * 3), 'Mesh vertex populations differ');
      require(this.faces.every(index => index < vertexCount), 'Canonical face index is outside the mesh');
      const patchIds = data.geometry.patch_face_ids;
      require(Array.isArray(patchIds) && patchIds.length && new Set(patchIds).size === patchIds.length,
        'Invalid evaluation-patch face population');
      this.patchFaces = new Uint32Array(patchIds.length * 3);
      patchIds.forEach((index, i) => {
        require(Number.isInteger(index) && index >= 0 && index < this.faces.length / 3, 'Invalid patch face');
        this.patchFaces.set(this.faces.subarray(index * 3, index * 3 + 3), i * 3);
      });
      const compile = (type, source) => {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source); gl.compileShader(shader);
        require(gl.getShaderParameter(shader, gl.COMPILE_STATUS), gl.getShaderInfoLog(shader));
        return shader;
      };
      const vertex = compile(gl.VERTEX_SHADER, `
        attribute vec3 p, n, col;
        uniform mat3 r, b;
        uniform vec3 c;
        uniform float radius, aspect, heat;
        varying vec3 color;
        void main() {
          vec3 q = r * b * (p - c) / radius;
          gl_Position = vec4(q.x / aspect, q.y, -q.z * .25, 1.);
          float len = length(n);
          vec3 nn = len > 0. ? n / len : vec3(0., 0., 1.);
          color = col * mix(.45 + .55 * abs(dot(r * b * nn, normalize(vec3(.3, .6, 1.)))), 1., heat);
        }`);
      const fragment = compile(gl.FRAGMENT_SHADER, `
        precision mediump float;
        varying vec3 color;
        void main() { gl_FragColor = vec4(color, 1.); }`);
      this.program = gl.createProgram();
      gl.attachShader(this.program, vertex); gl.attachShader(this.program, fragment);
      gl.linkProgram(this.program);
      require(gl.getProgramParameter(this.program, gl.LINK_STATUS), gl.getProgramInfoLog(this.program));
      gl.deleteShader(vertex); gl.deleteShader(fragment); gl.useProgram(this.program);
      this.attributes = ['p', 'n', 'col'].map(key => gl.getAttribLocation(this.program, key));
      this.uniforms = Object.fromEntries(['r', 'b', 'c', 'radius', 'aspect', 'heat'].map(key =>
        [key, gl.getUniformLocation(this.program, key)]));
      gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      this.buffers = {};
      for (const scope of SCOPES) {
        this.buffers[scope] = {};
        for (const role of ROLES) this.buffers[scope][role] = {
          solid: this.makeBuffer(role, scope, false), wire: this.makeBuffer(role, scope, true)
        };
      }
      this.lastDraw = null;
    }

    makeBuffer(role, scope, wire) {
      const gl = this.gl, vertices = this.vertices[role], healthy = this.vertices.healthy;
      const faces = scope === 'patch' ? this.patchFaces : this.faces;
      const array = new Float32Array(faces.length * 9 * (wire ? 2 : 1));
      let offset = 0;
      for (let i = 0; i < faces.length; i += 3) {
        const ia = faces[i] * 3, ib = faces[i + 1] * 3, ic = faces[i + 2] * 3;
        const u = [0, 1, 2].map(k => vertices[ib + k] - vertices[ia + k]);
        const v = [0, 1, 2].map(k => vertices[ic + k] - vertices[ia + k]);
        const normal = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
        for (const j of (wire ? [0, 1, 1, 2, 2, 0] : [0, 1, 2])) {
          const position = faces[i + j] * 3;
          const movement = Math.hypot(vertices[position] - healthy[position],
            vertices[position + 1] - healthy[position + 1], vertices[position + 2] - healthy[position + 2]);
          const color = wire ? [.22, .31, .34] : role === 'healthy' || movement <= this.data.threshold ?
            [.64, .73, .76] : role === 'reference' ? [.91, .52, .24] : [.19, .55, .76];
          array.set(vertices.subarray(position, position + 3), offset);
          array.set(normal, offset + 3); array.set(color, offset + 6); offset += 9;
        }
      }
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);
      return {buffer, count: faces.length * (wire ? 2 : 1)};
    }

    bind(record) {
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, record.buffer);
      this.attributes.forEach((attribute, i) => {
        gl.enableVertexAttribArray(attribute);
        gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 36, i * 12);
      });
    }

    draw({role = 'prediction', scope = 'whole', state = 'dent', yaw = .35, pitch = -.35,
      width = 640, height = 480, wire = false} = {}) {
      require(ROLES.includes(role) && SCOPES.includes(scope) && ['dent', 'healthy'].includes(state), 'Unknown display state');
      require([yaw, pitch, width, height].every(Number.isFinite) && width > 0 && height > 0 && width <= 8192 && height <= 8192,
        'Invalid camera or drawing size');
      width = Math.max(1, Math.round(width)); height = Math.max(1, Math.round(height));
      const gl = this.gl, canvas = this.canvas;
      require(gl && !gl.isContextLost(), '3D drawing context is unavailable');
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      gl.useProgram(this.program); gl.viewport(0, 0, width, height);
      gl.clearColor(237 / 255, 245 / 255, 246 / 255, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const camera = this.data.camera[scope], basis = camera.basis, u = this.uniforms;
      gl.uniformMatrix3fv(u.r, false, rotation(yaw, pitch));
      gl.uniformMatrix3fv(u.b, false, new Float32Array([
        basis[0][0], basis[1][0], basis[2][0], basis[0][1], basis[1][1], basis[2][1],
        basis[0][2], basis[1][2], basis[2][2]
      ]));
      gl.uniform3fv(u.c, new Float32Array(camera.center));
      gl.uniform1f(u.radius, camera.radius * 1.12 / Math.min(1, width / height));
      gl.uniform1f(u.aspect, width / height); gl.uniform1f(u.heat, 0);
      // Source7 healthy-control reference and prediction are byte-identical to healthy CAD.
      const actualRole = state === 'healthy' ? 'healthy' : role, set = this.buffers[scope][actualRole];
      this.bind(set.solid); gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 1);
      gl.drawArrays(gl.TRIANGLES, 0, set.solid.count); gl.disable(gl.POLYGON_OFFSET_FILL);
      if (wire) {
        gl.uniform1f(u.heat, 1); this.bind(set.wire); gl.drawArrays(gl.LINES, 0, set.wire.count);
      }
      gl.flush();
      this.lastDraw = {role, actualRole, scope, state, yaw, pitch, width, height, wire: Boolean(wire),
        vertex_count: this.vertices.healthy.length / 3, triangle_count: this.faces.length / 3,
        displayed_triangle_count: set.solid.count / 3, coordinate_magnification: 1,
        threshold: this.data.threshold, shared_camera: true, evaluation_only_crop: scope === 'patch'};
      return canvas;
    }

    dispose() {
      if (!this.gl) return;
      for (const scope of SCOPES) for (const role of ROLES) {
        this.gl.deleteBuffer(this.buffers[scope][role].solid.buffer);
        this.gl.deleteBuffer(this.buffers[scope][role].wire.buffer);
      }
      this.gl.deleteProgram(this.program); this.gl = null;
    }
  }
  window.MJGeometry = MJGeometry;
})();
