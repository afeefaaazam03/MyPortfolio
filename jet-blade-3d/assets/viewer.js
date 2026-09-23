/* Jet Blade 3D — dependency-free, actual-coordinate WebGL viewer.
 * Browser global: MeshViewer
 *
 * new MeshViewer(canvas, { background:[r,g,b], color:[r,g,b],
 *   onViewChange(view), onError(message), label })
 * .setMesh({vertices, triangles, displacement?})
 * .setField(denseXYZ | {indices, values}, {color?, threshold?, marker?})
 *   marker is a healthy-mesh vertex ID. It is shown only above threshold.
 * .setMorph(0..1), .setWireframe(boolean), .setMarker(boolean|vertexID)
 * .setView({yaw,pitch,zoom}), .getView(), .reset(), .dispose()
 * .setState({morph?,wireframe?,marker?,color?,threshold?}) is a convenience.
 *
 * Arrays may be flat or nested. Rotations are radians. One healthy-mesh
 * bounding sphere sets the scale for every field; deformation is never
 * multiplied. A morph is interpolation, not another model prediction.
 */
(function (global) {
  'use strict';
  const PI = Math.PI;
  const DEFAULT_VIEW = {yaw:40*PI/180, pitch:15*PI/180, zoom:1};
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function flat(values, Type) {
    if (!values) return new Type(0);
    return new Type(Array.isArray(values[0]) ? values.flat() : values);
  }
  function normals(vertices, faces) {
    const out = new Float32Array(vertices.length);
    for (let i=0; i<faces.length; i+=3) {
      const a=faces[i]*3, b=faces[i+1]*3, c=faces[i+2]*3;
      const ux=vertices[b]-vertices[a], uy=vertices[b+1]-vertices[a+1], uz=vertices[b+2]-vertices[a+2];
      const vx=vertices[c]-vertices[a], vy=vertices[c+1]-vertices[a+1], vz=vertices[c+2]-vertices[a+2];
      const x=uy*vz-uz*vy, y=uz*vx-ux*vz, z=ux*vy-uy*vx;
      for (const j of [a,b,c]) { out[j]+=x; out[j+1]+=y; out[j+2]+=z; }
    }
    for (let i=0; i<out.length; i+=3) {
      const n=Math.hypot(out[i],out[i+1],out[i+2]) || 1;
      out[i]/=n; out[i+1]/=n; out[i+2]/=n;
    }
    return out;
  }
  function rotation(yaw,pitch) {
    const cy=Math.cos(yaw), sy=Math.sin(yaw), cp=Math.cos(pitch), sp=Math.sin(pitch);
    // World Z is blade height. Camera azimuth rotates around that axis.
    return new Float32Array([-sy,-sp*cy,cp*cy, cy,-sp*sy,cp*sy, 0,cp,sp]);
  }
  function program(gl, vertex, fragment) {
    const shaders=[];
    const p=gl.createProgram();
    for (const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]) {
      const s=gl.createShader(type); shaders.push(s); gl.shaderSource(s,source); gl.compileShader(s);
      if (!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      gl.attachShader(p,s);
    }
    gl.linkProgram(p);
    for (const s of shaders) gl.deleteShader(s);
    if (!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  const VERTEX = `
    attribute vec3 p; attribute vec3 d; attribute vec3 n0; attribute vec3 n1;
    attribute float magnitude;
    uniform mat3 rotation; uniform vec3 center; uniform float scale, aspect, morph;
    varying vec3 normal; varying float movement;
    void main() {
      vec3 q=rotation*(p+d*morph-center);
      gl_Position=vec4(q.x/scale/aspect,q.y/scale,-q.z/scale*.15,1.0);
      normal=rotation*normalize(mix(n0,n1,morph));
      movement=magnitude*morph;
    }`;
  const FRAGMENT = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    varying vec3 normal; varying float movement;
    uniform vec3 baseColor, fieldColor; uniform float threshold, wire;
    void main() {
      vec3 n=normalize(normal);
      if(!gl_FrontFacing) n=-n;
      vec3 light=normalize(vec3(.32,.52,1.0));
      float diffuse=.50+.50*abs(dot(n,light));
      float spec=pow(abs(dot(n,normalize(vec3(.12,.23,1.0)))),25.0)*.14;
      float changed=step(threshold,movement);
      vec3 c=mix(baseColor,fieldColor,changed);
      c=c*diffuse+spec;
      c=mix(c,vec3(.12,.22,.28),wire);
      gl_FragColor=vec4(c,1.0);
    }`;
  const MARKER_VERTEX = `
    attribute vec3 p;
    uniform mat3 rotation; uniform vec3 center; uniform float scale,aspect,size;
    void main() {
      vec3 q=rotation*(p-center);
      gl_Position=vec4(q.x/scale/aspect,q.y/scale,-q.z/scale*.15-.000015,1.0);
      gl_PointSize=size;
    }`;
  const MARKER_FRAGMENT = `
    precision mediump float;
    uniform vec3 color;
    void main() {
      float r=length(gl_PointCoord-vec2(.5))*2.0;
      if(r>1.0) discard;
      float edge=smoothstep(.52,.66,r);
      vec3 c=mix(vec3(1.0),color,edge);
      gl_FragColor=vec4(c,1.0-smoothstep(.86,1.0,r));
    }`;

  class MeshViewer {
    constructor(canvas, options={}) {
      if (!canvas || typeof canvas.getContext!=='function') throw new TypeError('MeshViewer needs a canvas.');
      this.canvas=canvas; this.options=options; this.view={...DEFAULT_VIEW};
      this.morph=1; this.wireframe=false; this.threshold=1e-5;
      this.color=options.color || [.04,.75,.65];
      this.baseColor=options.baseColor || [.55,.66,.72];
      this.background=options.background || [.035,.066,.092];
      this.marker=null; this.markerEnabled=true; this.listeners=[]; this.buffers={};
      this.pending=0; this.dead=false; this.pointers=new Map();
      this.canvas.tabIndex=this.canvas.tabIndex<0 ? 0 : this.canvas.tabIndex;
      this.canvas.style.touchAction='none';
      this.canvas.setAttribute('role','img');
      this.canvas.setAttribute('aria-label',options.label || 'Interactive 3D blade. Drag to rotate. Scroll or use plus and minus to zoom. Arrow keys rotate. Home resets. Actual unamplified geometry.');
      this._listen(canvas,'webglcontextlost',e=>{e.preventDefault();this.lost=true;this._error('The 3D display was interrupted. Reload this page to restore it.');});
      try {
        this.gl=canvas.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:false});
        if (!this.gl) throw new Error('WebGL is unavailable in this browser.');
        this._init();
      } catch(e) { this._error('3D preview unavailable. '+e.message+' Saved images and numeric results are still available.'); return; }
      this._listen(canvas,'pointerdown',e=>{
        this.canvas.focus({preventScroll:true}); this.pointers.set(e.pointerId,[e.clientX,e.clientY]);
        try {canvas.setPointerCapture(e.pointerId);} catch(_) {}
      });
      this._listen(canvas,'pointermove',e=>{
        const last=this.pointers.get(e.pointerId); if(!last)return;
        if(this.pointers.size===1) {
          this.view.yaw+=(e.clientX-last[0])*.008;
          this.view.pitch=clamp(this.view.pitch+(e.clientY-last[1])*.008,-PI/2+.01,PI/2-.01);
        } else {
          const other=[...this.pointers.entries()].find(([id])=>id!==e.pointerId)[1];
          const oldDistance=Math.hypot(last[0]-other[0],last[1]-other[1]);
          const newDistance=Math.hypot(e.clientX-other[0],e.clientY-other[1]);
          if(oldDistance>1)this.view.zoom=clamp(this.view.zoom*newDistance/oldDistance,.55,12);
        }
        this.pointers.set(e.pointerId,[e.clientX,e.clientY]); this._changed();
      });
      for(const type of ['pointerup','pointercancel','lostpointercapture'])this._listen(canvas,type,e=>this.pointers.delete(e.pointerId));
      this._listen(canvas,'wheel',e=>{
        e.preventDefault();
        this.view.zoom=clamp(this.view.zoom*Math.exp(-clamp(e.deltaY,-200,200)*.0015),.55,12); this._changed();
      },{passive:false});
      this._listen(canvas,'keydown',e=>{
        if(e.key==='ArrowLeft')this.view.yaw-=.10;
        else if(e.key==='ArrowRight')this.view.yaw+=.10;
        else if(e.key==='ArrowUp')this.view.pitch=clamp(this.view.pitch-.10,-PI/2+.01,PI/2-.01);
        else if(e.key==='ArrowDown')this.view.pitch=clamp(this.view.pitch+.10,-PI/2+.01,PI/2-.01);
        else if(e.key==='+'||e.key==='=')this.view.zoom=clamp(this.view.zoom*1.12,.55,12);
        else if(e.key==='-'||e.key==='_')this.view.zoom=clamp(this.view.zoom/1.12,.55,12);
        else if(e.key==='Home'||e.key==='0')this.view={...DEFAULT_VIEW};
        else return;
        e.preventDefault(); this._changed();
      });
      if(global.ResizeObserver) {this.resizeObserver=new ResizeObserver(()=>this.request());this.resizeObserver.observe(canvas);}
      else this._listen(global,'resize',()=>this.request());
      this.request();
    }
    _listen(target,type,callback,options) {target.addEventListener(type,callback,options);this.listeners.push(()=>target.removeEventListener(type,callback,options));}
    _error(message) {
      this.error=message;this.canvas.dataset.rendered='false';this.canvas.setAttribute('aria-label',message);
      if(!this.errorElement){this.errorElement=document.createElement('p');this.errorElement.className='mesh-viewer-fallback';this.errorElement.setAttribute('role','status');this.canvas.insertAdjacentElement('afterend',this.errorElement);}
      this.errorElement.textContent=message;
      if(this.options.onError)this.options.onError(message);
    }
    _init() {
      const gl=this.gl;
      this.program=program(gl,VERTEX,FRAGMENT);this.markerProgram=program(gl,MARKER_VERTEX,MARKER_FRAGMENT);
      this.attributes={};this.uniforms={};this.markerUniforms={};
      for(const k of ['p','d','n0','n1','magnitude'])this.attributes[k]=gl.getAttribLocation(this.program,k);
      for(const k of ['rotation','center','scale','aspect','morph','baseColor','fieldColor','threshold','wire'])this.uniforms[k]=gl.getUniformLocation(this.program,k);
      this.markerAttribute=gl.getAttribLocation(this.markerProgram,'p');
      for(const k of ['rotation','center','scale','aspect','size','color'])this.markerUniforms[k]=gl.getUniformLocation(this.markerProgram,k);
      this.uint32=gl.getExtension('OES_element_index_uint');
    }
    _upload(name,data,target) {
      const gl=this.gl;if(!gl)return;
      if(!this.buffers[name])this.buffers[name]=gl.createBuffer();
      gl.bindBuffer(target||gl.ARRAY_BUFFER,this.buffers[name]);gl.bufferData(target||gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
    }
    setMesh(mesh) {
      const v=flat(mesh.vertices,Float64Array), f=flat(mesh.triangles,Uint32Array);
      if(!v.length||v.length%3||!f.length||f.length%3)throw new Error('Mesh requires XYZ vertices and triangle indices.');
      if(!v.every(Number.isFinite))throw new Error('Mesh coordinates must be finite.');
      const nv=v.length/3;
      if(!f.every(x=>x<nv))throw new Error('Triangle references an absent vertex.');
      if(nv>65535&&!this.uint32)throw new Error('This browser cannot display meshes with more than 65,535 vertices.');
      this.vertices=v;this.faces=f;this.normals0=normals(v,f);
      const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
      for(let i=0;i<v.length;i++) {const j=i%3;lo[j]=Math.min(lo[j],v[i]);hi[j]=Math.max(hi[j],v[i]);}
      this.center=lo.map((x,j)=>(x+hi[j])/2);let radius=0;
      for(let i=0;i<v.length;i+=3)radius=Math.max(radius,Math.hypot(v[i]-this.center[0],v[i+1]-this.center[1],v[i+2]-this.center[2]));
      this.radius=Math.max(radius,1e-9)*1.1;
      const Type=nv>65535?Uint32Array:Uint16Array;
      this.indices=new Type(f);this.indexType=this.gl?(nv>65535?this.gl.UNSIGNED_INT:this.gl.UNSIGNED_SHORT):null;
      const wire=new Type(f.length*2);
      for(let i=0;i<f.length;i+=3)wire.set([f[i],f[i+1],f[i+1],f[i+2],f[i+2],f[i]],i*2);
      this.wireCount=wire.length;
      this._upload('p',new Float32Array(v));this._upload('n0',this.normals0);
      if(this.gl){this._upload('triangles',this.indices,this.gl.ELEMENT_ARRAY_BUFFER);this._upload('wireIndices',wire,this.gl.ELEMENT_ARRAY_BUFFER);}
      this.setField(mesh.displacement||null);return this;
    }
    setField(field, options={}) {
      if(!this.vertices)throw new Error('Load a healthy mesh before a displacement field.');
      const d=new Float64Array(this.vertices.length);
      if(field&&field.indices&&field.values) {
        const values=flat(field.values,Float64Array),indices=field.indices;
        if(values.length!==indices.length*3)throw new Error('Sparse displacement sizes disagree.');
        const seen=new Set();
        for(let i=0;i<indices.length;i++){
          const idx=indices[i];if(!Number.isInteger(idx)||idx<0||idx>=d.length/3||seen.has(idx))throw new Error('Invalid or duplicate sparse vertex index.');
          seen.add(idx);d.set(values.subarray(i*3,i*3+3),idx*3);
        }
      } else if(field) {
        const values=flat(field,Float64Array);if(values.length!==d.length)throw new Error('Displacement and mesh sizes disagree.');d.set(values);
      }
      if(!d.every(Number.isFinite))throw new Error('Displacements must be finite.');
      this.displacement=d;
      const final=new Float64Array(d.length),mag=new Float32Array(d.length/3);
      let peak=0;
      for(let i=0;i<d.length;i++)final[i]=this.vertices[i]+d[i];
      for(let i=0;i<mag.length;i++){mag[i]=Math.hypot(d[i*3],d[i*3+1],d[i*3+2]);if(mag[i]>mag[peak])peak=i;}
      this.magnitudes=mag;this.peakVertex=peak;
      this._upload('d',new Float32Array(d));this._upload('n1',normals(final,this.faces));this._upload('magnitude',mag);
      if(options.color)this.color=options.color;
      if(options.threshold!==undefined)this.threshold=Number(options.threshold);
      this.marker=options.marker!==undefined?options.marker:null;
      this.request();return this;
    }
    setMorph(value) {this.morph=clamp(Number(value)||0,0,1);this.request();return this;}
    setWireframe(value) {this.wireframe=Boolean(value);this.request();return this;}
    setMarker(value) {if(typeof value==='boolean')this.markerEnabled=value;else this.marker=value;this.request();return this;}
    setView(view) {
      for(const k of ['yaw','pitch','zoom'])if(Number.isFinite(view[k]))this.view[k]=view[k];
      this.view.pitch=clamp(this.view.pitch,-PI/2+.01,PI/2-.01);this.view.zoom=clamp(this.view.zoom,.55,12);
      this.request();return this;
    }
    getView() {return {...this.view};}
    reset() {this.view={...DEFAULT_VIEW};this._changed();return this;}
    setState(state={}) {
      if(state.mode==='healthy')this.setMorph(0);
      else if(state.mode==='prediction'||state.mode==='truth')this.setMorph(1);
      if(state.morph!==undefined)this.setMorph(state.morph);
      if(state.wireframe!==undefined)this.setWireframe(state.wireframe);
      if(state.marker!==undefined)this.setMarker(state.marker);
      if(state.color)this.color=state.color;
      if(state.threshold!==undefined)this.threshold=Number(state.threshold);
      if(state.view)this.setView(state.view);
      this.request();return this;
    }
    _changed() {this.request();if(this.options.onViewChange)this.options.onViewChange(this.getView());}
    request() {if(!this.pending&&!this.dead&&!this.error)this.pending=requestAnimationFrame(()=>{this.pending=0;this.draw();});}
    draw() {
      const gl=this.gl;if(!gl||this.dead||this.lost)return;
      const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(global.devicePixelRatio||1,2);
      const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
      if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
      gl.viewport(0,0,w,h);gl.clearColor(...this.background,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      if(!this.vertices)return;
      const aspect=w/h,scale=this.radius/this.view.zoom/Math.min(1,aspect),rot=rotation(this.view.yaw,this.view.pitch);
      gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);
      gl.useProgram(this.program);
      for(const [name,attribute] of Object.entries(this.attributes)){
        gl.bindBuffer(gl.ARRAY_BUFFER,this.buffers[name]);gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,name==='magnitude'?1:3,gl.FLOAT,false,0,0);
      }
      const u=this.uniforms;
      gl.uniformMatrix3fv(u.rotation,false,rot);gl.uniform3fv(u.center,this.center);gl.uniform1f(u.scale,scale);gl.uniform1f(u.aspect,aspect);
      gl.uniform1f(u.morph,this.morph);gl.uniform3fv(u.baseColor,this.baseColor);gl.uniform3fv(u.fieldColor,this.color);
      gl.uniform1f(u.threshold,Math.max(this.threshold,1e-12));gl.uniform1f(u.wire,0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.buffers.triangles);
      gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1,1);gl.drawElements(gl.TRIANGLES,this.indices.length,this.indexType,0);gl.disable(gl.POLYGON_OFFSET_FILL);
      if(this.wireframe){gl.uniform1f(u.wire,1);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.buffers.wireIndices);gl.drawElements(gl.LINES,this.wireCount,this.indexType,0);}
      const marker=this.marker;
      if(this.markerEnabled&&Number.isInteger(marker)&&marker>=0&&marker<this.magnitudes.length&&this.magnitudes[marker]*this.morph>this.threshold){
        for(const attribute of Object.values(this.attributes))gl.disableVertexAttribArray(attribute);
        const point=new Float32Array(3);
        for(let j=0;j<3;j++)point[j]=this.vertices[marker*3+j]+this.displacement[marker*3+j]*this.morph;
        this._upload('marker',point);gl.useProgram(this.markerProgram);
        gl.enableVertexAttribArray(this.markerAttribute);gl.vertexAttribPointer(this.markerAttribute,3,gl.FLOAT,false,0,0);
        const m=this.markerUniforms;
        gl.uniformMatrix3fv(m.rotation,false,rot);gl.uniform3fv(m.center,this.center);gl.uniform1f(m.scale,scale);gl.uniform1f(m.aspect,aspect);gl.uniform1f(m.size,15*dpr);gl.uniform3fv(m.color,this.color);
        gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.drawArrays(gl.POINTS,0,1);gl.disable(gl.BLEND);gl.disableVertexAttribArray(this.markerAttribute);
      }
      this.canvas.dataset.rendered='true';this.canvas.dataset.vertexCount=String(this.vertices.length/3);this.canvas.dataset.faceCount=String(this.faces.length/3);this.canvas.dataset.morph=String(this.morph);
    }
    dispose() {
      this.dead=true;if(this.pending)cancelAnimationFrame(this.pending);
      this.listeners.forEach(remove=>remove());if(this.resizeObserver)this.resizeObserver.disconnect();
      if(this.gl){for(const b of Object.values(this.buffers))this.gl.deleteBuffer(b);if(this.program)this.gl.deleteProgram(this.program);if(this.markerProgram)this.gl.deleteProgram(this.markerProgram);}
      if(this.errorElement)this.errorElement.remove();
    }
  }
  global.MeshViewer=MeshViewer;
})(window);
