/* Saved scientific outputs only. No model inference is performed by this page. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const cache = new Map();
  const state = {catalog:null, current:null, reference:null, role:'estimate', request:0, tour:-1, timer:null, ready:false};
  const labels = {mixed:'Dent + color change',dent:'Dent only',appearance:'Color change only',healthy:'Healthy control'};
  const colors = {estimate:[.18,.82,.68],truth:[1,.62,.29]};
  let output, healthy;
  async function json(url) {
    if(!cache.has(url)) cache.set(url,fetch(url).then(r=>{if(!r.ok)throw Error(`Cannot load ${url} (${r.status})`);return r.json();}).catch(e=>{cache.delete(url);throw e;}));
    return cache.get(url);
  }
  function notice(message, error=false) { $('load-status').textContent=message; $('load-status').classList.toggle('error',error); }
  function fail(error) {state.ready=false;notice(`The example could not load. ${error.message} Try reloading, or open the results PDF below.`,true);}
  function number(n) {return n==null?'Not applicable':Number(n).toExponential(4);}
  function camera(view) {if(output)output.setView(view);if(healthy)healthy.setView(view);}
  function chosen() {return state.current.methods[$('method').value];}
  function populate(preferred) {
    const cases=state.catalog.cases.filter(c=>$('kind').value==='all'||c.kind===$('kind').value);
    $('case').replaceChildren(...cases.map(c=>new Option(`${c.id} · source ${c.source_id} · ${labels[c.kind]}`,c.id)));
    $('case').value=cases.some(c=>c.id===preferred)?preferred:cases[0].id;
    $('case').disabled=false;
  }
  async function loadCase() {
    const token=++state.request;
    state.ready=false;
    notice('Loading the saved images and mesh…');
    document.querySelector('.demo-layout').classList.add('is-loading');
    const item=state.catalog.cases.find(c=>c.id===$('case').value);
    const ref=state.catalog.references.find(r=>r.id===item.reference_id);
    const fit=item.methods[$('method').value];
    try {
      const [mesh,field] = await Promise.all([json(ref.mesh_url),json(fit.field_url)]);
      if(token!==state.request)return;
      if(state.reference?.id!==ref.id) {
        output.setMesh(mesh);healthy.setMesh(mesh);
        healthy.setMorph(0);state.reference=ref;
      }
      state.current=item;state.mesh=mesh;
      $('input-a').src=item.inputs[0].url;$('input-b').src=item.inputs[1].url;
      $('input-a').alt=`${item.id}: actual synthetic inspection input at 60 degrees`;
      $('input-b').alt=`${item.id}: actual synthetic inspection input at 120 degrees`;
      state.field=field;
      await displayRole(token);
      if(token!==state.request)return;
      describe();state.ready=true;
      notice(`${item.id} · ${labels[item.kind]} · source geometry ${item.source_id} · saved experiment, 23 Sep 2026`);
      document.querySelector('.demo-layout').classList.remove('is-loading');
      $('demo').dataset.ready='true';
    } catch(e) {if(token===state.request)fail(e);}
  }
  async function displayRole(token=state.request) {
    const fit=chosen();
    for(const [id,role] of [['show-estimate','estimate'],['show-healthy','healthy'],['show-truth','truth']])$(id).setAttribute('aria-pressed',String(state.role===role));
    $('morph').disabled=state.role!=='estimate';
    let field=state.field, marker=fit.marker_vertex_id, color=colors.estimate;
    if(state.role==='truth') {
      field=await json(state.current.truth.field_url);
      if(token!==state.request||state.role!=='truth')return;
      marker=null;color=colors.truth;
    }
    output.setField(field,{marker,color,threshold:state.catalog.scope.display_threshold});
    output.setMorph(state.role==='healthy'?0:state.role==='truth'?1:Number($('morph').value)/100);
    const healthyRole=state.role==='healthy',truthRole=state.role==='truth';
    $('output-title').textContent=healthyRole?'Supplied healthy reference mesh':truthRole?'Known simulated shape':'Estimated changed 3D mesh';
    $('output-subtitle').textContent=healthyRole?'Input · this shape is supplied':truthRole?'Comparison only · not used as an input':`Saved ${$('method').value==='joint'?'shape + color':'shape-only'} fit · nonlearned method`;
    $('mesh-tag').textContent=healthyRole?'3D INPUT · HEALTHY REFERENCE':truthRole?'KNOWN ANSWER · EVALUATION ONLY':'3D OUTPUT · ROTATE TO EXPLORE';
    $('role-note').textContent=healthyRole?'This known healthy shape is an input. The method estimates movements of its vertices.':truthRole?'Orange marks the known simulated change, for comparison only. This answer is kept separate from the fit.':'Teal marks estimated surface movement above 0.00001. The point marks the fitted location; color is not confidence.';
    $('output-badge').textContent=healthyRole?'Supplied input':truthRole?'Evaluation reference':fit.marker_vertex_id==null?'No movement above display threshold':'Saved fitted location';
    $('output-badge').style.color=truthRole?'#ffc18b':'';
  }
  function describe() {
    const c=state.current,fit=chosen(),base=c.methods.geometry_only,joint=c.methods.joint;
    $('case-title').textContent=`${labels[c.kind]} · ${c.id}`;
    const description={
      dent:'A simulated dent changes the 3D surface. The task is to locate it and estimate its depth and shape from the two images.',
      appearance:'Only the surface color changes. The correct physical output is an unchanged mesh. This checks whether the method mistakes appearance for damage.',
      healthy:'This is the healthy control. There is no simulated dent or color patch. The correct physical output is an unchanged mesh.',
      mixed:`A dent and a color patch occur ${c.truth.geometry_center===c.truth.appearance_center?'at the same location':'at different locations'}. The method must recover the physical change without mistaking the color patch for deformation.`
    };
    $('case-explanation').textContent=description[c.kind];
    let message;
    if(c.kind==='dent'||c.kind==='mixed') {
      const difference=(joint.local_rms_error/base.local_rms_error-1)*100;
      message=`The selected method ${fit.geometry_center_correct?'finds the supplied dent location':'misses the supplied dent location'}, among three allowed locations. That does not guarantee the correct depth. `;
      if(Math.abs(difference)<.001)message+='Both fits have essentially the same local shape error in this example.';
      else message+=`The shape + color fit has ${Math.abs(difference).toFixed(1)}% ${difference>0?'higher':'lower'} local shape error than the shape-only fit in this example.`;
    } else if(fit.maximum_displacement<state.catalog.scope.display_threshold) {
      message='The selected fit has no surface movement above the display threshold. Tiny nonzero movements may still exist. This is a result on a known synthetic example, not a validated real-world “safe” decision.';
    } else {
      message='The selected fit introduces false surface movement even though this example has no dent. Switch methods to inspect how separating color affects the 3D output.';
    }
    $('case-result').textContent=message;
    const marker=fit.marker_vertex_id;
    // Coordinates come from the saved prediction, regardless of which display role is visible.
    let predictedXYZ=null;
    if(marker!=null){
      predictedXYZ=[0,1,2].map(j=>output.vertices[marker*3+j]);
      const at=state.field.indices.indexOf(marker);
      if(at>=0)predictedXYZ=predictedXYZ.map((v,j)=>v+state.field.values[at*3+j]);
    }
    const metrics=[
      ['Full mesh',`${state.reference.vertex_count.toLocaleString()} vertices · ${state.reference.triangle_count.toLocaleString()} triangles`],
      ['Saved estimated dent depth',number(fit.depth)],
      ['Known dent depth · evaluation only',number(c.truth.depth)],
      ['Local shape RMS · exactly changed vertices',number(fit.local_rms_error)],
      ['Whole-blade displacement RMS error',number(fit.whole_blade_rms_error)],
      ['Fitted 3D position · display-rounded X, Y, Z',predictedXYZ?predictedXYZ.map(v=>v.toFixed(6)).join(', '):'No displayed physical-change marker']
    ];
    $('case-metrics').replaceChildren(...metrics.map(([title,value])=>{const wrap=document.createElement('div'),dl=document.createElement('dl'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=title;dd.textContent=value;dl.append(dt,dd);wrap.append(dl);return wrap;}));
    $('mesh-download').href=state.reference.mesh_url;$('field-download').href=fit.field_url;
  }
  function stopTour() {
    clearTimeout(state.timer);state.timer=null;state.tour=-1;
    $('tour-play').textContent='Play walkthrough';$('tour-next').disabled=true;
    document.querySelectorAll('.tour-active').forEach(e=>e.classList.remove('tour-active'));
  }
  function exportOBJ() {
    const mesh=state.mesh,field=state.field,vertices=new Float64Array(mesh.vertices);
    for(let i=0;i<field.indices.length;i++)for(let j=0;j<3;j++)vertices[field.indices[i]*3+j]+=field.values[i*3+j];
    const lines=[`# Jet Blade 3D: ${state.current.id}, ${$('method').value}, actual saved estimated mesh`,
      '# Coordinates: normalized blade span. No deformation amplification. Not verified millimeters.',
      '# Source: PLAID-datasets/Rotor37; synthetic changes and fitting: Jet Blade 3D.',
      '# CC BY-SA 4.0; see SOURCE_DATA.md and LICENSE.md in the source repository.'];
    for(let i=0;i<vertices.length;i+=3)lines.push(`v ${vertices[i]} ${vertices[i+1]} ${vertices[i+2]}`);
    let previous=null;
    for(let i=0;i<mesh.triangles.length;i+=3){
      const group=mesh.triangle_component[i/3]===0?'blade_surface':'artificial_closure';
      if(group!==previous){lines.push(`g ${group}`);previous=group;}
      lines.push(`f ${mesh.triangles[i]+1} ${mesh.triangles[i+1]+1} ${mesh.triangles[i+2]+1}`);
    }
    return lines.join('\n')+'\n';
  }
  const tour=[
    {title:'1 / Start with the inputs',caption:'Two inspection images and a healthy 3D blade are supplied. Here the blade, damage, cameras and lighting are simulated and known.',role:'healthy',focus:'.inputs-card'},
    {title:'2 / Locate on the 3D surface',caption:'The fit selects a dent location and estimates vertex movement. Teal marks the saved estimated change. Drag the blade to inspect it.',role:'estimate',focus:'.output-card'},
    {title:'3 / Compare with the known answer',caption:'Orange now shows the known synthetic shape. It is used to evaluate the result, not to tell the fitting method the answer.',role:'truth',focus:'.output-card'},
    {title:'4 / Check the difficult case',caption:'This example contains both a dent and a color patch. The fit can locate the dent yet get its depth wrong. A 3D output alone is not proof of accuracy.',role:'estimate',focus:'.case-summary'},
    {title:'5 / State what is done—and what is next',caption:'We have a working controlled pipeline and checked 3D outputs. Next we will directly render the estimated shapes to investigate the depth errors. Real-blade reliability is still future work.',role:'estimate',focus:'.walkthrough'}
  ];
  async function tourStep() {
    clearTimeout(state.timer);
    if(state.tour>=tour.length){stopTour();$('tour-heading').textContent='Tour complete. Explore any of the 68 examples.';$('tour-caption').textContent='The workflow works in controlled examples. The remaining question is whether the estimated shape is reliably correct.';return;}
    const step=tour[state.tour];
    $('tour-heading').textContent=step.title;$('tour-caption').textContent=step.caption;
    document.querySelectorAll('.tour-active').forEach(e=>e.classList.remove('tour-active'));
    document.querySelector(step.focus).classList.add('tour-active');
    state.role=step.role;await displayRole();
    if(state.tour>=0)state.timer=setTimeout(()=>{state.tour++;tourStep().catch(fail);},12000);
  }
  async function init() {
    try {
      state.catalog=await json('assets/data/catalog.json');
      output=new MeshViewer($('output-canvas'),{background:[.035,.066,.092],onViewChange:camera});
      healthy=new MeshViewer($('healthy-canvas'),{background:[.035,.066,.092],onViewChange:camera});
      populate('c033');await loadCase();
      for(const id of ['kind','case','method'])$(id).addEventListener('change',()=>{stopTour();if(id==='kind')populate();state.role='estimate';$('morph').value=100;$('morph-value').value='100%';loadCase().catch(fail);});
      for(const [id,role] of [['show-estimate','estimate'],['show-healthy','healthy'],['show-truth','truth']])$(id).addEventListener('click',()=>{if(!state.ready)return;stopTour();state.role=role;displayRole().catch(fail);});
      $('wire').addEventListener('change',()=>{output.setWireframe($('wire').checked);healthy.setWireframe($('wire').checked);});
      $('reset').addEventListener('click',()=>{output.reset();healthy.reset();});
      $('download-obj').addEventListener('click',()=>{
        if(!state.ready)return;
        const url=URL.createObjectURL(new Blob([exportOBJ()],{type:'text/plain'})),a=document.createElement('a');
        a.href=url;a.download=`jet-blade-3d_${state.current.id}_${$('method').value}.obj`;a.click();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
      });
      $('morph').addEventListener('input',()=>{stopTour();output.setMorph(Number($('morph').value)/100);$('morph-value').value=`${$('morph').value}%`;});
      $('tour-play').addEventListener('click',async()=>{
        if(state.tour>=0){stopTour();return;}
        if(!state.ready)return;
        $('kind').value='mixed';populate('c033');$('method').value='joint';$('morph').value=100;$('morph-value').value='100%';state.role='estimate';
        await loadCase();if(!state.ready)return;output.reset();healthy.reset();
        state.tour=0;$('tour-play').textContent='Stop walkthrough';$('tour-next').disabled=false;await tourStep();
      });
      $('tour-next').addEventListener('click',()=>{state.tour++;tourStep().catch(fail);});
      document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.tour>=0)stopTour();});
      window.JET_DEMO={state,output,healthy,loadCase,stopTour,exportOBJ};
    } catch(e) {fail(e);}
  }
  init();
})();
