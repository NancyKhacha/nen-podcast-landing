const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
document.documentElement.classList.add('enhanced');
const hero=$('#hero'),heroTitle=$('#hero-title'),heroCopy=$('.hero-copy'),scene=$('.hero-scene'),riftLeft=$('.rift-left'),riftRight=$('.rift-right');
const stories=$$('.story-page'),leaves=$$('.book-leaf'),jumps=$$('.story-jump'),disc=$('.book-disc'),leafHandle=$('.leaf-handle');
const shell=$('.episodes-shell'),deck=$('.episode-deck'),storySlot=$('.story-pages');
const clamp=(v,min=0,max=1)=>Math.min(max,Math.max(min,v));
let activeStory=0,framePending=false,mobileDeck=false,deckTop=80,deckStep=800,storyHeights=[];
function scheduleFrame(){if(framePending)return;framePending=true;requestAnimationFrame(renderMotion);}
function motionPreference(){
 document.documentElement.classList.toggle('motion-reduced',reduced.matches);
 mobileDeck=innerWidth<=800&&!reduced.matches;
 document.documentElement.classList.toggle('mobile-deck-on',mobileDeck);
 [heroTitle,heroCopy,scene,riftLeft,riftRight,...leaves].forEach(el=>{el.style.transform='';el.style.opacity='';});
 stories.forEach(el=>el.classList.add('is-active'));
 storySlot.style.minHeight='';storySlot.style.height='';stories.forEach(el=>el.style.transform='');
 if(mobileDeck){
  storyHeights=stories.map(el=>el.offsetHeight);
  const maxHeight=Math.max(...storyHeights);
  stories.forEach((el,i)=>el.classList.toggle('is-active',i===activeStory));
  const headerHeight=$('.site-header').offsetHeight;
  deckTop=headerHeight;
  storySlot.style.height=`${Math.max(220,innerHeight-headerHeight-$('.episode-theatre').offsetHeight)}px`;
  deckStep=Math.max(innerHeight*.95,maxHeight*1.15);
  shell.style.height=`${deck.offsetHeight+deckStep*5}px`;
  deck.style.top=`${deckTop}px`;
 }else{shell.style.height='';deck.style.top='';}
 stories.forEach((el,i)=>el.classList.toggle('is-active',i===activeStory));
 scheduleFrame();
}
function renderMotion(){
 framePending=false;
 const vh=innerHeight,mobile=innerWidth<=800;
 const heroRect=hero.getBoundingClientRect();
 const headerHeight=$('.site-header').offsetHeight;
 const marker=headerHeight+vh*.2;
 const shellRect=shell.getBoundingClientRect();
 document.documentElement.classList.toggle('deck-pinned',mobileDeck&&shellRect.top<headerHeight&&shellRect.bottom>headerHeight+60);
 const zone=$$('#hero,#about,#episodes,#authors').find(el=>{const r=el.getBoundingClientRect();return r.top<=marker&&r.bottom>marker;});
 $$('.site-header nav a').forEach(a=>a.classList.toggle('active',!!zone&&a.hash===`#${zone.id}`));
 if(!reduced.matches&&heroRect.bottom>0&&heroRect.top<vh){
  if(mobile){
   const view=$('.hero-viewport').getBoundingClientRect();
   const p=clamp(-heroRect.top/Math.max(1,heroRect.height-view.height));
   const exit=clamp((p-.22)/.78);
   heroCopy.style.transform=`translate3d(0,${-exit*vh*.62}px,0)`;
   scene.style.transform=`translate3d(${p*innerWidth*.03}px,${-p*vh*.12}px,0) scale(${1+p*.24})`;
   riftLeft.style.transform=`translate3d(${-p*112}%,${p*12}px,0) rotate(${2-p*12}deg)`;
   riftRight.style.transform=`translate3d(${p*112}%,${p*12}px,0) rotate(${-3+p*12}deg)`;
  }else{
   const p=clamp(-heroRect.top/(heroRect.height*.8));
   heroTitle.style.transform=`translate3d(${-p*45}px,${-p*120}px,0) rotate(${-p*1.3}deg)`;
   scene.style.transform=`translate3d(${p*35}px,${-p*90}px,0) scale(${1+p*.18})`;
   riftLeft.style.transform=`translate3d(${-p*115}%,${p*18}px,0) rotate(${2-p*5}deg)`;
   riftRight.style.transform=`translate3d(${p*115}%,${p*18}px,0) rotate(${-3+p*5}deg)`;
  }
 }
 const rects=stories.map(el=>el.getBoundingClientRect());
 let next=0,turn=0,readProgress=0;
 if(mobileDeck){
  const raw=clamp((deckTop-shell.getBoundingClientRect().top)/deckStep,0,4.999);
  const nearest=Math.round(raw);
  // Browser zoom rounds scroll offsets; exact anchors must select their own page.
  const progress=nearest<5&&Math.abs(raw-nearest)<.002?nearest:raw;
  next=Math.floor(progress);
  turn=next===4?0:clamp((progress-next-.67)/.33);
  readProgress=clamp((progress-next-.06)/.54);
 }else{
  rects.forEach((r,i)=>{if(r.top<=vh*.55)next=i;});
  const r=rects[next];turn=clamp((Math.max(0,-r.top)/r.height-.05)/.45);
 }
 if(next!==activeStory){activeStory=next;disc.style.background=activeStory===2?'#b7a0d9':'#ff5b16';}
 stories.forEach((el,i)=>{el.classList.toggle('is-active',i===activeStory);if(mobileDeck)el.style.transform=`translateY(${-readProgress*Math.max(0,storyHeights[i]-storySlot.clientHeight)}px)`;});
 jumps.forEach((a,i)=>{if(i===activeStory)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
 leafHandle.setAttribute('aria-label',activeStory===4?'Перелистнуть к первому выпуску':'Перелистнуть к следующему выпуску');
 if(!reduced.matches){
  leaves.forEach((leaf,i)=>{
   const delta=i-activeStory;
   leaf.style.zIndex=String(10-i);
   if(delta<0){leaf.style.transform='translate3d(-90vw,-12vh,100px) rotateY(-110deg) rotateZ(-12deg)';leaf.style.opacity='0';return;}
   leaf.style.opacity='1';
   if(delta>0){leaf.style.transform=`translate3d(${delta*(mobile?6:13)}px,${delta*(mobile?4:7)}px,${-delta*18}px) rotateZ(${Math.min(delta*4,13)}deg) rotateY(-3deg)`;$('.leaf-shade',leaf).style.opacity='0';return;}
   leaf.style.transform=`translate3d(${-turn*32}%,${-turn*10}%,${turn*140}px) rotateY(${-turn*112}deg) rotateZ(${-3-turn*9}deg)`;
   $('.leaf-shade',leaf).style.opacity=String(turn*.75);
  });
 }
}
function goStory(next){
 history.replaceState(null,'',`#story-${next}`);
 if(mobileDeck){window.scrollTo({top:scrollY+shell.getBoundingClientRect().top-deckTop+next*deckStep+1,behavior:'auto'});renderMotion();}
 else stories[next].scrollIntoView({block:'start',behavior:'auto'});
 $('#book-status').textContent=`Выпуск ${next+1}. ${$('h3',stories[next]).textContent}`;
 scheduleFrame();
}
leafHandle.addEventListener('click',()=>goStory((activeStory+1)%stories.length));
 storySlot.addEventListener('focusin',e=>{if(mobileDeck&&e.target.closest('.button'))window.scrollTo({top:scrollY+shell.getBoundingClientRect().top-deckTop+(activeStory+.61)*deckStep,behavior:'auto'});});
jumps.forEach((link,i)=>link.addEventListener('click',e=>{if(!mobileDeck)return;e.preventDefault();history.replaceState(null,'',link.hash);goStory(i);}));
window.addEventListener('scroll',scheduleFrame,{passive:true});
window.addEventListener('resize',motionPreference,{passive:true});
window.addEventListener('hashchange',scheduleFrame);
reduced.addEventListener('change',motionPreference);
document.fonts.ready.then(()=>{motionPreference();const match=location.hash.match(/^#story-([0-4])$/);if(match&&mobileDeck)goStory(Number(match[1]));});
motionPreference();
// Pause autonomous logo/title accents offscreen and while the document is hidden.
const visibleAccents=new Set();
function accentState(){visibleAccents.forEach(el=>el.classList.toggle('accent-paused',document.hidden));}
const accents=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{target.classList.toggle('accent-paused',!isIntersecting||document.hidden);if(isIntersecting)visibleAccents.add(target);else visibleAccents.delete(target);}));
$$('.title-ne,.live-logo').forEach(el=>accents.observe(el));
document.addEventListener('visibilitychange',accentState);

const audio=$('#teaser-audio'),audioButton=$('.audio-toggle'),seek=$('#audio-seek'),time=$('#audio-time'),canvas=$('#wave-canvas');
let peaks=[];
fetch('assets/waveform.json').then(r=>r.json()).then(data=>{peaks=data;drawWave();}).catch(()=>drawWave());
function clock(s){s=Math.max(0,Math.floor(s||0));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
function drawWave(){
  const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  const count=Math.floor(r.width/5),ratio=audio.currentTime/(audio.duration||68);
  for(let i=0;i<count;i++){
    const amp=peaks.length?peaks[Math.floor(i/count*peaks.length)]:.2;
    const height=Math.max(3,Math.min(44,amp*46));
    ctx.fillStyle=i/count<=ratio?'#11110f':'#6e624c';ctx.fillRect(i*5,(r.height-height)/2,2,height);
  }
}
new ResizeObserver(drawWave).observe(canvas);
const playIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7Z"/></svg>';
const pauseIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zm7 0h4v14h-4z"/></svg>';
function audioState(){const playing=!audio.paused;audioButton.innerHTML=playing?pauseIcon:playIcon;audioButton.setAttribute('aria-pressed',String(playing));audioButton.setAttribute('aria-label',playing?'Пауза':'Слушать тизер');}
audioButton.addEventListener('click',async()=>{if(!audio.paused){audio.pause();return;}try{$('#audio-error').hidden=true;await audio.play();}catch{$('#audio-error').hidden=false;}audioState();});
audio.addEventListener('play',audioState);audio.addEventListener('pause',audioState);audio.addEventListener('ended',audioState);
audio.addEventListener('loadedmetadata',()=>{seek.max=audio.duration;time.textContent=`${clock(audio.currentTime)} / ${clock(audio.duration)}`;});
audio.addEventListener('timeupdate',()=>{seek.value=audio.currentTime;time.textContent=`${clock(audio.currentTime)} / ${clock(audio.duration||68)}`;drawWave();});
seek.addEventListener('input',()=>{if(audio.readyState>0){audio.currentTime=Number(seek.value);}else{audio.load();audio.addEventListener('loadedmetadata',()=>{audio.currentTime=Number(seek.value);},{once:true});}});
audio.addEventListener('error',()=>{$('#audio-error').hidden=false;audioState();});
const dialog=$('#video-dialog'),video=$('#teaser-video');
$$('.watch-teaser').forEach(b=>b.addEventListener('click',()=>{audio.pause();dialog.showModal();video.play().catch(()=>{});}));
dialog.addEventListener('close',()=>video.pause());
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});

document.addEventListener('click',e=>{
 const link=e.target.closest('a[href^="#"]');if(!link)return;
 const hash=link.hash;
 $$('.site-header nav a').forEach(a=>a.classList.toggle('active',hash===a.hash||(hash.startsWith('#story-')&&a.hash==='#episodes')));
});
