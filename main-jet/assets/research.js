'use strict';
const $ = (s) => document.querySelector(s);
const wipe = $('#wipe-range');
function updateWipe(value) {wipe.value=String(Math.max(0,Math.min(100,value)));$('#hero-wipe').style.setProperty('--reveal', `${wipe.value}%`);}
wipe.addEventListener('input', () => updateWipe(wipe.value));
const wipeSurface=$('#hero-wipe');
function moveWipe(event) {const bounds=wipeSurface.getBoundingClientRect();updateWipe(Math.round(100*(event.clientX-bounds.left)/bounds.width));}
wipeSurface.addEventListener('pointerdown',event=>{if(event.button!==0)return;wipeSurface.setPointerCapture(event.pointerId);moveWipe(event);});
wipeSurface.addEventListener('pointermove',event=>{if(wipeSurface.hasPointerCapture(event.pointerId))moveWipe(event);});
wipeSurface.addEventListener('pointerup',event=>{if(wipeSurface.hasPointerCapture(event.pointerId))wipeSurface.releasePointerCapture(event.pointerId);});
const reviews = {
  '0265': {metric:'74.75%', label:'coverage of the reviewed region', text:'The model marks 1,125 of 1,505 reviewed pixels and misses 380. The partial polygon includes missing material/background; it is not a surface-only damage label.', name:'Edge cutout', human:'Partial human review', scope:'Detail crop · partial non-expert review · previously exposed development photograph. Unmarked pixels remain unknown. Region coverage is not whole-image accuracy or IoU.'},
  '0268': {metric:'0 / 272', label:'reviewed pixels covered by the model', text:'The small reviewer-marked edge region is missed entirely in this saved prediction. This tells us about this marked region; it does not evaluate the rest of the photograph.', name:'Small edge region', human:'Partial human review', scope:'Detail crop · partial non-expert review · previously exposed development photograph. Unmarked pixels remain unknown. No whole-image accuracy can be inferred.'},
  '0358': {metric:'0 / 116,239', label:'reviewed pixels covered by the model', text:'The model misses the large reviewed dark region. Its physical cause is unconfirmed; darkness alone does not establish corrosion or measured surface damage.', name:'Dark patch', human:'Partial human review', scope:'Detail crop · partial non-expert review · previously exposed development photograph. The physical cause of this appearance has not been verified.'},
  '0299': {metric:'1,563', label:'model-marked pixels despite “No visible damage”', text:'The image-level review says “No visible damage”, while the model marks 1,563 pixels, including writing. There is no complete negative pixel mask, so this is a disagreement to investigate, not a measured false-positive rate.', name:'No visible damage', human:'Image-level review; no region mask', scope:'Previously exposed development photograph · image-level non-expert review. This is also the default real 3D view; its estimated geometry and physical damage remain unverified.'}
};
function selectReview(id, focus = false) {
  const r = reviews[id];
  document.querySelectorAll('[data-review]').forEach(b => {const on=b.dataset.review===id;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;if(on&&focus)b.focus();});
  $('#review-panel').setAttribute('aria-labelledby',`tab-${id}`);
  for(const [target, suffix] of [['review-input','input'],['review-human','review'],['review-prediction','prediction']]) {const img=$(`#${target}`);img.src=`assets/${id}_${suffix}.png`;img.alt=`Photo ${id}: ${r.name}, ${suffix}`;}
  $('#human-caption').textContent=r.human;
  $('#review-metric').textContent=r.metric;$('#review-metric-label').textContent=r.label;
  $('#review-explanation').textContent=r.text;$('#review-scope').textContent=r.scope;
  window.MAIN_JET_REVIEW=id;
}
document.querySelectorAll('[data-review]').forEach((button,index,list) => {
  button.addEventListener('click',()=>selectReview(button.dataset.review));
  button.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(index+1)%list.length;else if(e.key==='ArrowLeft')next=(index+list.length-1)%list.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=list.length-1;else return;e.preventDefault();selectReview(list[next].dataset.review,true);});
});
window.MAIN_JET_REVIEW='0265';
const demos = {synthetic:{src:'working_3d/MAIN_JET_3D_DEMO.html?embed=1', title:'Interactive synthetic blade geometry comparison'}, real:{src:'real_data/MAIN_JET_REAL_3D_DEMO.html?embed=1',title:'Interactive real-photo surface estimates and photograph gallery'}};
document.querySelectorAll('[data-load-demo]').forEach(button => button.addEventListener('click',()=>{
  const name=button.dataset.loadDemo, box=$(`#${name}-embed`), shell=button.closest('.demo-shell');
  if(box.querySelector('iframe')) {box.replaceChildren();box.hidden=true;shell.querySelector('.demo-poster').hidden=false;shell.querySelector('.panel-labels').hidden=false;button.textContent=name==='real'?'Load real-data demo ↗':'Load interactive 3D ↗';button.setAttribute('aria-expanded','false');return;}
  const iframe=document.createElement('iframe');iframe.title=demos[name].title;iframe.src=demos[name].src;iframe.setAttribute('allow','fullscreen');iframe.setAttribute('allowfullscreen','');
  const status=document.createElement('p');status.className='embed-status';status.setAttribute('role','status');status.textContent='Loading saved data… Large 3D examples can take a moment.';
  box.hidden=false;box.append(status,iframe);button.textContent='Close interactive viewer ×';button.setAttribute('aria-expanded','true');
  iframe.addEventListener('load',()=>{status.textContent='Drag the surface to rotate. Use Auto-rotate or the guided tour below. For more space, open the full viewer.';});
  shell.querySelector('.demo-poster').hidden=true;shell.querySelector('.panel-labels').hidden=true;
}));
document.querySelectorAll('[data-load-demo]').forEach(b=>{b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls',`${b.dataset.loadDemo}-embed`);});
$('#pdf-toggle').addEventListener('click',()=>{const box=$('#pdf-preview'),open=box.hidden;box.hidden=!open;$('#pdf-toggle').setAttribute('aria-expanded',String(open));$('#pdf-toggle').textContent=open?'Close PDF preview ↑':'Preview the original PDF ↓';if(open&&!box.querySelector('iframe')){const frame=document.createElement('iframe');frame.src='MAIN_JET_RESEARCH_PROPOSAL.pdf';frame.title='Original Main Jet research proposal PDF';box.append(frame);}});
const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){document.querySelectorAll('.site-header nav a').forEach(a=>{if(a.hash===`#${entry.target.id}`)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}}},{rootMargin:'-15% 0px -65% 0px',threshold:0});
document.querySelectorAll('main > section').forEach(section=>observer.observe(section));
