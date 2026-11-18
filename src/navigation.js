const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const landings = {reed: {x: .25, z: 1.6}, sakura: {x: 18, z: 1.6}};
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
 function dock(){ return landings[harbor] || landings.reed; }
 function snapshot(){return{x,z,vx,vz,sailing,paused,onBoat,heading,speed:Math.hypot(vx,vz),nearDock:Math.hypot(x-dock().x,z-dock().z)<1.25};}
 function navigable(a,b){if (otherLanding(harbor) && a > 10.5) return a <= 20 && b >= -1 && b <= 5;
 return a>=-.5&&a<=10.5&&b>=-7.2&&b<=8.7&&((a+7)/7.15)**2+((b+3)/6.7)**2>=1&&!((a-6)**2+(b+6)**2<1.8);}
 return{
  snapshot,
  setInput(a,b){const n=Math.max(1,Math.hypot(a,b));ix=clamp(a/n,-1,1);iz=clamp(b/n,-1,1);},
  setSailing(value){sailing=Boolean(value);ix=0;iz=0;vx=0;vz=0;},
  setPaused(value){paused=Boolean(value);if(paused){ix=0;iz=0;vx=0;vz=0;}},
  setOnBoat(value){onBoat=Boolean(value);if(!onBoat){sailing=false;vx=0;vz=0;ix=0;iz=0;}},
  setHarbor(id){harbor=id;},
  reachedDestination(){
   const target=landings[otherLanding(harbor)];
   return Boolean(target && sailing && onBoat && !paused && Math.hypot(x-target.x,z-target.z)<1.25);
  },
  reset(){x=dock().x;z=dock().z;vx=0;vz=0;ix=0;iz=0;heading=-.27;sailing=false;},
  step(seconds){const dt=clamp(Number(seconds)||0,0,.2);if(!sailing||paused||!onBoat||!dt)return snapshot();const response=1-Math.exp(-8*dt);vx+=(ix*2.6-vx)*response;vz+=(iz*2.6-vz)*response;const nx=x+vx*dt,nz=z+vz*dt;if(navigable(nx,nz)){x=nx;z=nz;}else{if(navigable(nx,z))x=nx;else vx=0;if(navigable(x,nz))z=nz;else vz=0;}if(Math.hypot(vx,vz)>.1)heading=Math.atan2(vx,vz);return snapshot();}
 };
}
