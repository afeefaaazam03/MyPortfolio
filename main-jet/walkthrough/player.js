'use strict';
(() => {
  const $ = id => document.getElementById(id), canvas = $('film'), ctx = canvas.getContext('2d'), narration=$('narration');
  const duration = 132;
  const chapters = [
    {start:0, title:'Locate on the mesh', heading:'We already located an image finding in 3D.', caption:'A saved image peak maps to a known mesh point. The point hits the nick, but the damage mask has only 20% overlap.'},
    {start:18, title:'The idea', heading:'See the input. Inspect the actual output.', caption:'Our current prototype estimates a blade’s 3D change from supplied healthy geometry and matching images.'},
    {start:30, title:'Actual inputs', heading:'This is what goes into the 3D prototype.', caption:'A healthy 3D blade, seven matching image pairs, and a supplied mapping between pictures and surface points.'},
    {start:48, title:'Actual output', heading:'This is the saved 3D prediction.', caption:'Compare the known synthetic change with the prediction. The model also changes places that should stay healthy.'},
    {start:66, title:'Already built', heading:'We have working components — with different outputs.', caption:'The 3D predictor and the real-photo detector are separate existing components. The website replays their saved outputs.'},
    {start:82, title:'Latest findings', heading:'Closer shapes. Reliability still needs work.', caption:'Only 3 of 18 cases for the new learned model, and 4 of 18 for a simple rule, passed every improvement check.'},
    {start:98, title:'Planned work', heading:'Here is what we still need to prove.', caption:'Improve where 3D change is predicted, and separately test whether learning from 3D improves real-photo inspection.'},
    {start:114, title:'Intended output', heading:'If the research works as planned…', caption:'ILLUSTRATION — NOT A MODEL RESULT. A possible future report would link the marked 3D region, estimated shape change and image evidence.'}
  ];
  const C = {navy:'#102e3e', ink:'#183f50', muted:'#537380', teal:'#0b8492', blue:'#3494c3', orange:'#e9934c', line:'#c8dce3', paper:'#f0f5f6', purple:'#705298'};
  let ready=false, playing=false, time=0, lastTick=0, previousFrame=0, explore=false, drag=null, playToken=0;
  const manual={state:'dent',scope:'patch',yaw:.35,pitch:-.35};
  const images=new Map(); let geometry;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function text(value,x,y,size=20,color=C.ink,weight=400,align='left') {ctx.font=`${weight} ${size}px Arial,sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(value,x,y);}
  function wrap(value,x,y,width,size=20,color=C.muted,weight=400,lineHeight=size*1.4) {
    ctx.font=`${weight} ${size}px Arial,sans-serif`; let line='',offset=0;
    for(const word of value.split(' ')){const trial=line?line+' '+word:word;if(ctx.measureText(trial).width>width&&line){text(line,x,y+offset,size,color,weight);line=word;offset+=lineHeight;}else line=trial;}
    if(line)text(line,x,y+offset,size,color,weight);return y+offset+lineHeight;
  }
  function round(x,y,w,h,r=12,fill='white',stroke=C.line){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
  function chip(label,x,y,fill='#def1f2',color=C.teal){ctx.font='700 12px Arial';const w=ctx.measureText(label).width+24;round(x,y,w,27,4,fill,null);text(label,x+12,y+18,12,color,700);}
  function photo(src,x,y,w,h){const img=images.get(src);if(!img)throw Error('Missing image '+src);round(x,y,w,h,5,'#e4edf0',null);const s=Math.min(w/img.width,h/img.height);ctx.drawImage(img,x+(w-img.width*s)/2,y+(h-img.height*s)/2,img.width*s,img.height*s);}
  function mesh(role,scope,x,y,w,h,yaw=.35,pitch=-.35,state='dent') {
    const rendered=geometry.draw({role,scope,state,yaw,pitch,width:Math.round(w),height:Math.round(h),wire:scope==='patch'});
    ctx.drawImage(rendered,x,y,w,h);
  }
  function arrow(x,y,w,phase=0){ctx.strokeStyle='#b8d7de';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.stroke();ctx.strokeStyle=C.teal;ctx.beginPath();ctx.moveTo(x+w-12,y-8);ctx.lineTo(x+w,y);ctx.lineTo(x+w-12,y+8);ctx.stroke();ctx.fillStyle=C.teal;ctx.beginPath();ctx.arc(x+((phase%1+1)%1)*Math.max(1,w-10),y,4,0,Math.PI*2);ctx.fill();}
  function chapterAt(t){let i=0;for(let j=1;j<chapters.length;j++)if(t>=chapters[j].start)i=j;return i;}
  function background(i){ctx.fillStyle=C.paper;ctx.fillRect(0,0,1280,720);ctx.fillStyle=C.navy;ctx.fillRect(0,0,1280,43);text('MAIN JET',36,28,16,'#dcf6f6',700);text(explore?'EXPLORE ACTUAL SAVED OUTPUT':i===7?'FUTURE OUTPUT · DESIGN ILLUSTRATION':'SAVED RESULTS · A VISUAL WALKTHROUGH',1244,27,12,'#afd0dd',600,'right');text(`${String(i+1).padStart(2,'0')} / ${chapters[i].title.toUpperCase()}`,40,79,12,C.teal,700);text(chapters[i].heading,40,124,34,C.ink,700);}
  function caption(i,t){round(32,611,1216,77,8,'#dfedef',null);wrap(explore?(manual.state==='healthy'?'Healthy control: identical image pairs produce zero movement by design. This does not prove real-world healthy recognition.':'Drag to rotate the actual saved shapes. Blue shows predicted movement, including unwanted changes outside the known dent.'):chapters[i].caption,52,640,1174,21,C.ink,500,28);text('3D: Safran / PLAID Rotor37 · CC BY-SA 4.0 · synthetic alterations | Sources: afeefaaazam03.github.io/MyPortfolio/main-jet/walkthrough/ATTRIBUTION.md',36,704,10,C.muted);ctx.fillStyle='#d2e1e6';ctx.fillRect(0,710,1280,10);ctx.fillStyle=C.teal;ctx.fillRect(0,710,1280*t/duration,10);}
  function localizationScene(t){
    chip('ACTUAL SAVED LOCALIZATION',40,154);chip('MESH + CAMERA INFORMATION SUPPLIED',294,154);
    photo('../localization/example_1.png',40,193,1200,337.5);
    text('Saved peak: [347, 267]  ·  Triangle: 60247',50,555,18,C.ink,600);
    text('XYZ: −0.250668422, 0.275741425, −0.004085742',602,555,18,C.ink,600);
    text('Point on nick: yes  ·  Damage-mask overlap: 20%',50,584,18,C.teal,700);
    text('Known geometry maps the point; the detector did not infer the mesh.',602,584,15,C.muted);
  }
  function scene0(t){
    round(40,158,532,409);chip('INPUTS · SUPPLIED',61,178);text('Matching images + healthy 3D model',61,235,23,C.ink,700);
    const v=MJ_DATA.views[5];photo(v.healthy_rgb,62,259,230,221);photo(v.observed_rgb,308,259,242,221);text('Healthy reference',177,509,17,C.muted,400,'center');text('Inspection image',429,509,17,C.muted,400,'center');
    arrow(589,349,70,t*.22);round(679,158,561,409);chip('OUTPUT · SAVED PREDICTION',699,178);text('An estimated changed shape',699,235,23,C.ink,700);
    mesh('prediction','whole',700,256,293,244,.35+Math.sin(t*.25)*.3,-.25);mesh('prediction','patch',1002,289,209,165,.35,-.35);text('Whole blade',847,520,17,C.muted,400,'center');text('Evaluation crop',1105,485,13,C.muted,400,'center');text('blue = predicted movement',960,551,15,C.teal,500,'center');
    text('Current 3D prototype now  •  Better real-photo inspection is a separate research goal',640,588,18,C.muted,400,'center');
  }
  function scene1(t){
    const index=Math.min(6,Math.floor(t/2.35)),v=MJ_DATA.views[index];
    round(40,162,291,398);chip('1 · HEALTHY 3D BLADE',59,181);mesh('healthy','whole',55,223,260,267,.15+Math.sin(t*.2)*.3,-.25);text('Supplied starting shape',185,532,16,C.muted,400,'center');
    text('+',360,371,34,C.teal,500,'center');round(389,162,523,398);chip('2 · SEVEN MATCHED IMAGE PAIRS',408,181);
    photo(v.healthy_rgb,407,224,232,230);photo(v.observed_rgb,658,224,233,230);text('Healthy reference',523,483,16,C.muted,400,'center');text('Inspection image',774,483,16,C.muted,400,'center');
    for(let i=0;i<7;i++){round(414+i*68,507,56,32,5,i===index?C.teal:'#e5eff2',null);text(String(i+1),442+i*68,529,15,i===index?'white':C.muted,700,'center');}
    text('+',939,371,34,C.teal,500,'center');round(963,162,277,398);chip('3 · KNOWN MAPPING',981,181);text('Picture ↔ Surface',1102,276,23,C.ink,700,'center');
    for(let i=0;i<4;i++){round(994,310+i*34,47,19,3,'#cadfe5',null);arrow(1057,319+i*34,113,(t*.25+i*.2));}wrap('We already know where image evidence belongs on the healthy blade.',985,481,230,17,C.muted,400,24);
    text('These are all seven original saved views. No single-view prediction is being invented here.',640,592,17,C.muted,400,'center');
  }
  function scene2(t){
    const scope=explore?manual.scope:(t<6?'whole':'patch'),yaw=explore?manual.yaw:.35+Math.sin(t*.28)*.3,pitch=explore?manual.pitch:-.35,state=explore?manual.state:'dent';
    const labels=['Healthy starting shape','Known synthetic change','Model prediction'];
    for(let i=0;i<3;i++){const x=40+i*407;round(x,165,386,383);text(labels[i],x+193,203,21,C.ink,700,'center');const role=['healthy','reference','prediction'][i];mesh(role,scope,x+9,226,368,265,yaw,pitch,state);text(['Supplied CAD','Answer for checking','Earlier learned model'][i],x+193,525,16,C.muted,400,'center');}
    text(scope==='patch'?'LOCAL COMPARISON · crop selected using the known answer · original movement scale':'WHOLE BLADE · synchronized rotation · original movement scale',640,578,16,C.muted,500,'center');
    text('Orange: known changed area     •     Blue: predicted movement, not confidence',640,601,15,C.teal,500,'center');
  }
  function scene3(t){
    round(40,163,586,353);chip('BUILT · 3D SHAPE PREDICTION',61,181);mesh('prediction','patch',64,226,310,236,.35+Math.sin(t*.3)*.25,-.35);wrap('A saved estimate of how a known blade’s surface changed.',397,267,195,22,C.ink,600,31);text('Public synthetic · evaluation crop',333,491,16,C.muted,400,'center');
    round(646,163,594,353);chip('BUILT · SEPARATE PHOTO DETECTOR',668,181);photo('../assets/aebis_329_input.png',668,222,320,241);const reveal=.5+.45*Math.sin(t*.35);ctx.save();ctx.beginPath();ctx.rect(668,222,320*reveal,241);ctx.clip();photo('../assets/aebis_329_prediction.png',668,222,320,241);ctx.restore();ctx.strokeStyle=C.orange;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(668+320*reveal,222);ctx.lineTo(668+320*reveal,463);ctx.stroke();wrap('Suspected damage highlighted in a real photograph.',1008,267,209,21,C.ink,600,30);text('Existing image-only model · actual saved result',943,491,15,C.muted,400,'center');
    ['Built controlled examples','Trained small models','Checked outputs and failures'].forEach((s,i)=>{round(40+i*408,541,386,49,7,'#dfefee',null);text('✓ '+s,233+i*408,571,18,C.teal,600,'center');});
  }
  function scene4(t){
    text('LATEST COMPLETED STUDY: 18 simulated dents on 2 new blade instances + 2 healthy states',40,160,18,C.muted,400);
    for(let i=0;i<2;i++){const x=40+i*614,n=i?4:3;round(x,188,586,359);chip(i?'FIXED GEOMETRIC RULE':'NEW LEARNED SHAPE-CHANGE MODEL',x+23,207,i?'#f8ebdf':'#def1f2',i?'#a56527':C.teal);text(String(n),x+25,327,82,C.teal,700);text('/ 18 cases',x+90,323,28,C.muted,400);text('Passed every improvement check',x+25,369,22,C.ink,600);
      for(let k=0;k<18;k++){const cx=x+35+(k%9)*63,cy=412+Math.floor(k/9)*41;ctx.fillStyle=k<n?C.teal:'#d8e4e9';ctx.beginPath();ctx.arc(cx,cy,12,0,Math.PI*2);ctx.fill();}
      wrap(i?'This simple rule reduced unwanted changes more than the new learner.':'Shape error improved, but missed damage and false changes remain.',x+25,499,530,18,C.muted,400,25);
    }
    text('Compared with the earlier model. Case counts are not overall accuracy.',640,580,18,C.muted,400,'center');
  }
  function scene5(t){
    round(40,161,1200,188);chip('PLANNED · CURRENT 3D DIRECTION',61,180);text('Make the 3D change reliable.',62,242,24,C.ink,700);
    const a=['Find the right area','Test untouched cases','Check measured real shapes'];a.forEach((s,i)=>{const x=62+i*391;round(x,266,337,53,7,'#e5f2f1',null);text(s,x+168,299,18,C.teal,600,'center');if(i<2)arrow(x+349,293,29,t*.2);});
    round(40,370,1200,211,12,'#f7f3fc','#dcd0ec');chip('PLANNED · BROADER PHOTO-INSPECTION PROPOSAL',61,389,'#e8dff5',C.purple);text('Does extra 3D teaching help on real photographs?',62,451,24,C.ink,700);
    const b=['Train with images only','Train with images + 3D','Compare on new real photos'];b.forEach((s,i)=>{const x=62+i*391;round(x,477,337,53,7,'white','#ded4eb');text(s,x+168,510,18,C.purple,600,'center');if(i===0)text('vs',x+362,510,17,C.purple,600,'center');if(i===1)arrow(x+349,503,29,t*.2);});text('A proposed comparison — its benefit has not been demonstrated.',640,563,16,C.purple,400,'center');
  }
  function futureScene(t){
    chip('ILLUSTRATION — NOT A MODEL RESULT',40,153,'#e8dff5',C.purple);
    photo('../assets/future-output.svg',40,193,1200,403);
  }
  const renderers=[localizationScene,scene0,scene1,scene2,scene3,scene4,scene5,futureScene];
  function draw(t){if(!ready)return;time=clamp(t,0,duration);const i=explore?3:chapterAt(Math.min(time,duration-.001));background(i);renderers[i](time-chapters[i].start);caption(i,time);sync(i);}
  function clock(t){return `${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;}
  function sync(i){$('clock').textContent=`${clock(time)} / 2:12`;$('seek').value=time;$('play').textContent=playing?'Ⅱ Pause':'▶ Play walkthrough';$('scene-title').textContent=explore?'Explore the actual saved output':chapters[i].heading;$('scene-caption').textContent=explore?(manual.state==='healthy'?'The saved healthy control has zero movement by design. Use the dent case to inspect the model’s successes and mistakes.':'Rotate the three synchronized surfaces. The known reference is used for checking; the prediction was estimated from paired image evidence.'):chapters[i].caption;document.querySelectorAll('[data-chapter]').forEach((b,j)=>j===i?b.setAttribute('aria-current','step'):b.removeAttribute('aria-current'));$('explore-controls').hidden=!explore;canvas.classList.toggle('exploring',explore);$('explore').textContent=explore?'Return to walkthrough':'Explore the 3D output';}
  function pause(){playToken++;playing=false;narration.pause();sync(explore?3:chapterAt(Math.min(time,duration-.001)));}
  function setAudioTime(t){try{narration.currentTime=clamp(t,0,duration);}catch(_){/* Metadata may still be loading. */}}
  function tick(now){if(playing){time=Math.min(duration,narration.currentTime);if(now-previousFrame>=45||time===duration){draw(time);previousFrame=now;}if(time>=duration)pause();}requestAnimationFrame(tick);}
  async function start(){if(!ready)return;if(playing){pause();return;}const token=++playToken;explore=false;if(time>=duration)time=0;setAudioTime(time);try{await narration.play();if(token!==playToken){narration.pause();return;}playing=true;draw(time);}catch(_){playing=false;$('scene-caption').textContent='Narration could not start here. Use the narrated MP4 link below, or explore the saved shapes.';}}
  function seek(t){pause();explore=false;time=clamp(Number(t),0,duration);setAudioTime(time);draw(time);}
  $('play').addEventListener('click',start);$('restart').addEventListener('click',()=>seek(0));$('seek').addEventListener('input',e=>seek(e.target.value));
  $('explore').addEventListener('click',()=>{pause();explore=!explore;time=56;setAudioTime(time);draw(time);canvas.focus({preventScroll:true});});
  $('sound').addEventListener('click',()=>{narration.muted=!narration.muted;$('sound').textContent=narration.muted?'Narration off':'Narration on';$('sound').setAttribute('aria-pressed',String(!narration.muted));});
  narration.addEventListener('ended',()=>{pause();draw(duration);});
  $('case').addEventListener('change',()=>{manual.state=$('case').value;draw(time);});$('scope').addEventListener('change',()=>{manual.scope=$('scope').value;draw(time);});$('reset').addEventListener('click',()=>{manual.yaw=.35;manual.pitch=-.35;draw(time);});
  $('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('player').requestFullscreen();}catch(_){$('scene-caption').textContent='Use the browser full-screen command if this device does not support the full-screen button.';}});document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'Exit full screen':'Full screen';});
  canvas.addEventListener('pointerdown',e=>{if(!explore)return;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!drag)return;manual.yaw+=(e.clientX-drag.x)*.009;manual.pitch=clamp(manual.pitch+(e.clientY-drag.y)*.009,-1.5,1.5);drag={x:e.clientX,y:e.clientY};draw(time);});for(const name of ['pointerup','pointercancel'])canvas.addEventListener(name,()=>drag=null);
  canvas.addEventListener('keydown',e=>{if(e.key===' '){e.preventDefault();start();}else if(e.key==='Home'){e.preventDefault();seek(0);}else if(e.key.startsWith('Arrow')){e.preventDefault();if(explore){if(e.key==='ArrowLeft')manual.yaw-=.12;if(e.key==='ArrowRight')manual.yaw+=.12;if(e.key==='ArrowUp')manual.pitch-=.12;if(e.key==='ArrowDown')manual.pitch+=.12;draw(time);}else seek(time+(e.key==='ArrowLeft'||e.key==='ArrowDown'?-5:5));}});
  chapters.forEach((chapter,i)=>{const b=document.createElement('button');b.type='button';b.dataset.chapter=i;b.textContent=`${i+1} · ${chapter.title}`;b.disabled=true;b.addEventListener('click',()=>seek(chapter.start));$('chapters').append(b);});
  if(new URLSearchParams(location.search).has('export'))document.body.classList.add('export-mode');
  window.MJ_FILM={ready:false,duration,chapters,renderAt:async t=>{if(!ready)throw Error('Film assets are not ready');seek(t);return {time,chapter:chapterAt(Math.min(time,duration-.001))};},capture:()=>canvas.toDataURL('image/png'),get state(){return {time,playing,explore,audioTime:narration.currentTime,narrationMuted:narration.muted,narrationPlaying:!narration.paused,...manual};}};
  async function init(){try{const paths=new Set(['../assets/aebis_329_input.png','../assets/aebis_329_prediction.png','../localization/example_1.png','../assets/future-output.svg']);MJ_DATA.views.forEach(v=>{paths.add(v.healthy_rgb);paths.add(v.observed_rgb);});await Promise.all([...paths].map(src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{images.set(src,img);resolve();};img.onerror=()=>reject(Error('Could not load saved image '+src));img.src=src;})));geometry=new MJGeometry();ready=true;window.MJ_FILM.ready=true;$('loading').hidden=true;for(const e of document.querySelectorAll('button:disabled,input:disabled'))e.disabled=false;draw(0);requestAnimationFrame(tick);}catch(error){$('loading').textContent='The saved demonstration could not load. You can still watch the downloadable MP4.';$('loading').dataset.error=error.message;console.error(error);}}
  init();
})();
