import {LOCATIONS} from './data.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const landings = Object.fromEntries(LOCATIONS.filter(p=>['reed','sakura'].includes(p.id)).map(p=>[p.id,p.water.spawn]));
export function otherLanding(id) {
 return id === 'reed' ? 'sakura' : id === 'sakura' ? 'reed' : null;
}

// Project the shared sailing route onto its two pins on the illustrated map.
export function mapPosition(locations,id,nav){
 const area=locations.find(place=>place.id===id);
 if(!nav?.onBoat)return {x:area.x,y:area.y};
 const origin=landings.reed,dx=nav.x-origin.x,dz=nav.z-origin.z;
 if(!otherLanding(id))return {x:area.x+dx*.9,y:area.y+dz*.9};
 const start=locations.find(place=>place.id==='reed'),end=locations.find(place=>place.id==='sakura');
 const span=landings.sakura.x-origin.x;
 const eastX=(end.x-start.x)/span,eastY=(end.y-start.y)/span;
 return {x:start.x+dx*eastX-dz*eastY,y:start.y+dx*eastY+dz*eastX};
}

export function createNavigation(){
 let x=.25,z=1.6,vx=0,vz=0,ix=0,iz=0,sailing=true,paused=false,onBoat=true,heading=-.27;
 let harbor = 'reed';
 let water=LOCATIONS[0].water;
 function dock(){return water.spawn;}
 function snapshot(){return{x,z,vx,vz,sailing,paused,onBoat,heading,speed:Math.hypot(vx,vz),nearDock:Math.hypot(x-dock().x,z-dock().z)<1.25};}
 function clearance(a,b){
  const [left,right,top,bottom]=water.bounds;
  let margin=Math.min(a-left,right-a,b-top,bottom-b);
  for(const o of water.obstacles){
   if(o.locationId && o.locationId!==harbor)continue;
   const distance=(Math.hypot((a-o.x)/o.rx,(b-o.z)/o.rz)-1)*Math.min(o.rx,o.rz);
   margin=Math.min(margin,distance);
  }
  return margin;
 }
 function navigable(a,b){return clearance(a,b)>=0;}
 return{
  snapshot,
  setInput(a,b){const n=Math.max(1,Math.hypot(a,b));ix=clamp(a/n,-1,1);iz=clamp(b/n,-1,1);},
  setSailing(value){sailing=Boolean(value);ix=0;iz=0;vx=0;vz=0;},
  setPaused(value){paused=Boolean(value);if(paused){ix=0;iz=0;vx=0;vz=0;}},
  setOnBoat(value){onBoat=Boolean(value);if(!onBoat){sailing=false;vx=0;vz=0;ix=0;iz=0;}},
  setHarbor(id){const place=LOCATIONS.find(p=>p.id===id);if(place){harbor=id;water=place.water;}},
  reachedDestination(){
   const target=landings[otherLanding(harbor)];
   return Boolean(target && sailing && onBoat && !paused && Math.hypot(x-target.x,z-target.z)<1.25);
  },
  reset(){x=dock().x;z=dock().z;vx=0;vz=0;ix=0;iz=0;heading=-.27;sailing=false;},
  step(seconds){const dt=clamp(Number(seconds)||0,0,.2);if(!sailing||paused||!onBoat||!dt)return snapshot();const response=1-Math.exp(-8*dt);vx+=(ix*2.6-vx)*response;vz+=(iz*2.6-vz)*response;const margin=clearance(x,z);
   if(margin<1.2){
    const gx=(clearance(x+.02,z)-clearance(x-.02,z))/.04,gz=(clearance(x,z+.02)-clearance(x,z-.02))/.04;
    const inward=vx*gx+vz*gz;
    if(inward<0){const push=(1-clamp(margin/1.2,0,1))*(-inward+.35);vx+=push*gx;vz+=push*gz;}
   }
   const nx=x+vx*dt,nz=z+vz*dt;if(navigable(nx,nz)){x=nx;z=nz;}else{if(navigable(nx,z))x=nx;else vx=0;if(navigable(x,nz))z=nz;else vz=0;}if(Math.hypot(vx,vz)>.1)heading=Math.atan2(vx,vz);return snapshot();}
 };
}
