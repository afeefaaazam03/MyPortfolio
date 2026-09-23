'use strict';
(()=>{
 const deck=document.getElementById('quick-deck');
 if(!deck)return;
 const slides=[...deck.querySelectorAll('.quick-slide')],tabs=[...deck.querySelectorAll('[data-quick-slide]')];
 const previous=document.getElementById('quick-prev'),next=document.getElementById('quick-next'),full=document.getElementById('quick-fullscreen');
 let current=0;
 function show(index){
  current=Math.max(0,Math.min(slides.length-1,index));
  slides.forEach((slide,i)=>slide.hidden=i!==current);
  tabs.forEach((tab,i)=>i===current?tab.setAttribute('aria-current','step'):tab.removeAttribute('aria-current'));
  previous.disabled=current===0;next.disabled=current===slides.length-1;
  document.getElementById('quick-count').textContent=`${current+1} / ${slides.length}`;
  document.getElementById('quick-caption').textContent=tabs[current].querySelector('span').textContent;
  slides[current].querySelectorAll('img').forEach(image=>image.loading='eager');
  const stage=deck.querySelector('.quick-stage');stage.scrollTop=0;
  window.MAIN_JET_QUICK={slide:current+1,total:slides.length,title:slides[current].querySelector('h3').textContent};
 }
 tabs.forEach(tab=>tab.addEventListener('click',()=>show(Number(tab.dataset.quickSlide))));
 previous.addEventListener('click',()=>show(current-1));next.addEventListener('click',()=>show(current+1));
 deck.addEventListener('keydown',event=>{
  if(event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.key==='ArrowRight'){event.preventDefault();show(current+1);}
  else if(event.key==='ArrowLeft'){event.preventDefault();show(current-1);}
  else if(event.key==='Home'){event.preventDefault();show(0);}
  else if(event.key==='End'){event.preventDefault();show(slides.length-1);}
 });
 full.addEventListener('click',async()=>{
  try{if(document.fullscreenElement===deck)await document.exitFullscreen();else if(deck.requestFullscreen)await deck.requestFullscreen();else throw Error('Unavailable');}
  catch(_){document.getElementById('quick-help').textContent='Full screen is unavailable here. You can still present with Next / Previous, or use your browser’s full-screen option.';}
 });
 document.addEventListener('fullscreenchange',()=>{
  const active=document.fullscreenElement===deck;
  full.textContent=active?'Exit full screen':'Full screen';
  full.setAttribute('aria-label',active?'Exit full screen':'Present the quick slides in full screen');
  if(active)deck.focus({preventScroll:true});
 });
 show(0);
})();
