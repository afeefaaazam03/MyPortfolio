(() => {
  'use strict';
  const range=document.getElementById('hero-range'),wipe=document.getElementById('hero-wipe');
  const reveal=()=>wipe.style.setProperty('--reveal',`${range.value}%`);
  range.addEventListener('input',reveal);reveal();
  wipe.addEventListener('pointerdown',e=>{if(e.button!==0)return;wipe.setPointerCapture(e.pointerId);move(e);});
  wipe.addEventListener('pointermove',e=>{if(wipe.hasPointerCapture(e.pointerId))move(e);});
  function move(e){const r=wipe.getBoundingClientRect();range.value=Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100));reveal();}
  const deck=document.getElementById('presentation-deck'),slides=[...deck.querySelectorAll('.story-slide')],tabs=[...deck.querySelectorAll('[data-slide]')];
  let current=0;
  function show(index){
    current=Math.max(0,Math.min(slides.length-1,index));
    slides.forEach((s,i)=>s.hidden=i!==current);
    tabs.forEach((t,i)=>{if(i===current)t.setAttribute('aria-current','step');else t.removeAttribute('aria-current');});
    document.getElementById('slide-prev').disabled=current===0;
    document.getElementById('slide-next').disabled=current===slides.length-1;
    document.getElementById('slide-position').textContent=`${current+1} / ${slides.length}`;
    document.getElementById('slide-announcement').textContent=`Slide ${current+1}: ${slides[current].getAttribute('aria-label')}`;
  }
  tabs.forEach(t=>t.addEventListener('click',()=>show(Number(t.dataset.slide))));
  document.getElementById('slide-prev').addEventListener('click',()=>show(current-1));
  document.getElementById('slide-next').addEventListener('click',()=>show(current+1));
  deck.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea'))return;if(e.key==='ArrowRight'){e.preventDefault();show(current+1);}if(e.key==='ArrowLeft'){e.preventDefault();show(current-1);}});
  document.getElementById('present-fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await deck.requestFullscreen();}catch(_){deck.scrollIntoView({behavior:'smooth',block:'start'});}});
  const nav=[...document.querySelectorAll('.site-header nav a[href^="#"]')];
  if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)nav.forEach(a=>a.classList.toggle('active',a.hash==='#'+e.target.id));},{rootMargin:'-15% 0px -60% 0px'});nav.forEach(a=>{const e=document.querySelector(a.hash);if(e)io.observe(e);});}
  show(0);
  window.JET_PRESENTATION={show,get current(){return current;},count:slides.length};
})();
