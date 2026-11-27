import {landings,chartPoint,waterDepth} from './waterways.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function mapPosition(locations,id,nav){
 if(nav?.onBoat)return chartPoint(nav.x,nav.z);
 const p=locations.find(p=>p.id===id);return {x:p.x,y:p.y};
}

export function createNavigation(){
 let x=.25,z=1.6,vx=0,vz=0,ix=0,iz=0,sailing=true,paused=false,onBoat=true,heading=-.27;
 let harbor = 'reed';
 function dock(){return landings[harbor];}
 function snapshot(){return{x,z,vx,vz,paddling:Boolean(ix||iz),sailing,paused,onBoat,heading,speed:Math.hypot(vx,vz),nearDock:Math.hypot(x-dock().x,z-dock().z)<1.25};}
 function clearance(a,b){return waterDepth(a,b)-.85;}
 function navigable(a,b){return clearance(a,b)>=0;}
 return{
  snapshot,
  setInput(a,b){const n=Math.max(1,Math.hypot(a,b));ix=clamp(a/n,-1,1);iz=clamp(b/n,-1,1);},
  setSailing(value){sailing=Boolean(value);ix=0;iz=0;vx=0;vz=0;},
  setPaused(value){paused=Boolean(value);if(paused){ix=0;iz=0;vx=0;vz=0;}},
  setOnBoat(value){onBoat=Boolean(value);if(!onBoat){sailing=false;vx=0;vz=0;ix=0;iz=0;}},
  setHarbor(id){if(landings[id])harbor=id;},
  reachedDestination(target){
   return Boolean(target && sailing && onBoat && !paused && Math.hypot(x-target.x,z-target.z)<1.25);
  },
  reset(){x=dock().x;z=dock().z;vx=0;vz=0;ix=0;iz=0;heading=({reed:Math.PI/2,sakura:-Math.PI/2,falls:1.2,snow:.25,tide:-1.3,moon:.45})[harbor];sailing=false;},
  step(seconds){const dt=clamp(Number(seconds)||0,0,.2);if(!sailing||paused||!onBoat||!dt)return snapshot();const response=1-Math.exp(-8*dt);vx+=(ix*2.6-vx)*response;vz+=(iz*2.6-vz)*response;const margin=clearance(x,z);
   if(margin<1.2){
    const gx=(clearance(x+.02,z)-clearance(x-.02,z))/.04,gz=(clearance(x,z+.02)-clearance(x,z-.02))/.04;
    const inward=vx*gx+vz*gz;
    if(inward<0){const push=(1-clamp(margin/1.2,0,1))*(-inward+.35);vx+=push*gx;vz+=push*gz;}
   }
   const nx=x+vx*dt,nz=z+vz*dt;if(navigable(nx,nz)){x=nx;z=nz;}else{if(navigable(nx,z))x=nx;else vx=0;if(navigable(x,nz))z=nz;else vz=0;}if(Math.hypot(vx,vz)>.1)heading=Math.atan2(vx,vz);return snapshot();}
 };
}
