import assert from 'node:assert/strict';
import {createNavigation} from '../src/navigation.js';
const nav=createNavigation();
const initial=nav.snapshot();nav.setInput(1,0);nav.step(1);let next=nav.snapshot();assert.ok(next.x>initial.x+.2,'划桨应当让船前进');
nav.setSailing(false);const anchored=nav.snapshot();nav.setInput(1,1);nav.step(.2);assert.equal(nav.snapshot().x,anchored.x,'停桨后不会漂走');
nav.setSailing(true);nav.setInput(1,0);nav.setPaused(true);const paused=nav.snapshot();nav.step(.2);assert.equal(nav.snapshot().x,paused.x,'菜单暂停不移动');
nav.setPaused(false);nav.setInput(1,0);nav.setHarbor('falls');for(let i=0;i<1500;i++)nav.step(.04);assert.ok(nav.snapshot().x>20 && nav.snapshot().x<=22,'不会越过水域右边界');
nav.reset();assert.equal(nav.snapshot().x,.25);assert.equal(nav.snapshot().z,1.6);assert.equal(nav.snapshot().sailing,false,'救援后回码头并停船');
nav.setSailing(true);nav.setInput(-1,-1);for(let i=0;i<1500;i++)nav.step(.04);next=nav.snapshot();assert.ok(((next.x+7)/6.5)**2+((next.z+3)/5.7)**2>=1,'小船不穿进主岛');
nav.setOnBoat(false);const ashore=nav.snapshot();nav.setInput(1,1);nav.setSailing(true);nav.step(.2);assert.equal(nav.snapshot().x,ashore.x,'岸钓不能驾船');
const ferry=createNavigation();
for(const [from,to,direction] of [['reed','sakura',1],['sakura','reed',-1]]){
 ferry.setHarbor(from);
 ferry.setSailing(true);
 assert.equal(ferry.reachedDestination(),false,'选航线不会立即抵达');
 ferry.setInput(direction,0);
 for(let frame=0;frame<600 && !ferry.reachedDestination();frame++) ferry.step(1/60);
 assert.equal(ferry.reachedDestination(),true,'能够划到对岸');
 ferry.setSailing(false);
 ferry.setHarbor(to);
 assert.ok(ferry.snapshot().nearDock,'到达后当前位置就是新码头');
 ferry.reset();
 assert.equal(ferry.snapshot().x,to==='sakura'?18:.25,'救援回到当前水域');
}
console.log(JSON.stringify({navigationChecks:['movement','anchor','pause','water boundary','return dock','island collision','ashore movement blocked','two-way harbor crossing and rescue'],status:'passed'},null,2));

const {mapPosition,landings:ports}=await import('../src/navigation.js');
const {LOCATIONS}=await import('../src/data.js');
for(const id of ['reed','sakura']){
 const port=LOCATIONS.find(p=>p.id===id);
 const pos=mapPosition(LOCATIONS,id,{...ports[id],onBoat:true});
 assert.ok(Math.hypot(pos.x-port.x,pos.y-port.y)<1e-9);
}
const mid={x:(ports.reed.x+ports.sakura.x)/2,z:ports.reed.z,onBoat:true};
assert.deepEqual(mapPosition(LOCATIONS,'reed',mid),mapPosition(LOCATIONS,'sakura',mid));
assert.notDeepEqual(mapPosition(LOCATIONS,'reed',mid),mapPosition(LOCATIONS,'reed',{...mid,z:0}));

// Same approach to the mapped waterfall rock in two different waters.
function approachRock(site){
 const boat=createNavigation();boat.setHarbor(site);boat.reset();boat.setSailing(true);
 boat.setInput(1,0);
 for(let i=0;i<120 && boat.snapshot().x<5.5;i++)boat.step(.04);
 assert.ok(boat.snapshot().x>=5.5);
 boat.setInput(0,-1);
 let slowed=false;
 for(let i=0;i<130;i++){
  const pos=boat.step(.04);
  if(site==='falls'){
   assert.ok(Math.hypot((pos.x-5.5)/1.6,(pos.z+7)/1.3)>=1);
   if(pos.z < -4 && pos.speed < 1.5)slowed=true;
  }
 }
 if(site==='falls')assert.ok(slowed);
 return boat.snapshot();
}
assert.ok(approachRock('reed').z < -8);
approachRock('falls');
