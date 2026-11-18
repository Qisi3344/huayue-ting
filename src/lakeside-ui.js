const $=selector=>document.querySelector(selector);

export function bindDial(showSettings,describe){
 const dial=$('#dial'),detail=$('#dialReadout');
 let hold,hide,opened=false;
 function reveal(){
  detail.textContent=describe();detail.hidden=false;
  clearTimeout(hide);hide=setTimeout(()=>detail.hidden=true,2000);
 }
 const cancel=()=>clearTimeout(hold);
 dial.onpointerdown=e=>{
  if(e.button!==0)return;
  opened=false;dial.setPointerCapture(e.pointerId);
  hold=setTimeout(()=>{opened=true;detail.hidden=true;showSettings();},550);
 };
 for(const type of ['pointerup','pointercancel','lostpointercapture'])dial.addEventListener(type,cancel);
 dial.oncontextmenu=e=>e.preventDefault();
 dial.onclick=()=>{if(!opened)reveal();opened=false;};
 dial.onkeydown=e=>{if(e.key==='ArrowDown'){e.preventDefault();showSettings();}};
 window.addEventListener('blur',cancel);
}

export function bindJoystick(start,steer){
 const game=$('#game'),stick=$('#joystick'),knob=stick.firstElementChild;
 let id=null,x=0,y=0,active=false;
 function end(){
  if(id===null)return;
  id=null;active=false;stick.hidden=true;steer(0,0);
 }
 game.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse'||id!==null||!e.target.closest('#world')||
     e.clientX>innerWidth*.48||e.clientY<innerHeight*.52)return;
  id=e.pointerId;x=e.clientX;y=e.clientY;game.setPointerCapture(id);e.stopPropagation();
 },true);
 game.addEventListener('pointermove',e=>{
  if(e.pointerId!==id)return;
  const dx=e.clientX-x,dy=e.clientY-y,d=Math.hypot(dx,dy);
  if(!active){
   if(d<7)return;
   if(!start()){end();return;}
   active=true;stick.hidden=false;
   stick.style.left=x+'px';stick.style.top=y+'px';
  }
  const scale=1/Math.max(d,34);
  knob.style.transform='translate('+dx*scale*26+'px,'+dy*scale*26+'px)';
  steer(dx*scale,dy*scale);
 });
 for(const event of ['pointerup','pointercancel','lostpointercapture'])game.addEventListener(event,e=>{if(e.pointerId===id)end();});
 window.addEventListener('blur',end);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)end();});
 return end;
}
export function bindIdle(){
 const game=$('#game');
 let timer;
 function wake(){
  game.classList.remove('idle-hud');clearTimeout(timer);
  timer=setTimeout(()=>game.classList.add('idle-hud'),4000);
 }
 for(const event of ['pointermove','pointerdown','keydown','focusin','wheel'])window.addEventListener(event,wake,{passive:true});
 wake();
}
