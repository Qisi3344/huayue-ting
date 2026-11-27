import {landings,waterDepth,habitatAt,bearingPoint,chartPoint} from '../src/waterways.js';
import {LOCATIONS} from '../src/data.js';
import assert from 'node:assert/strict';
import {createNavigation} from '../src/navigation.js';
const nav=createNavigation();
const initial=nav.snapshot();nav.setInput(1,0);nav.step(1);let next=nav.snapshot();assert.ok(next.x>initial.x+.2,'划桨应当让船前进');
nav.setSailing(false);const anchored=nav.snapshot();nav.setInput(1,1);nav.step(.2);assert.equal(nav.snapshot().x,anchored.x,'停桨后不会漂走');
nav.setSailing(true);nav.setInput(1,0);nav.setPaused(true);const paused=nav.snapshot();nav.step(.2);assert.equal(nav.snapshot().x,paused.x,'菜单暂停不移动');
nav.setPaused(false);nav.setHarbor('reed');nav.reset();
assert.equal(nav.snapshot().x,.25);assert.equal(nav.snapshot().sailing,false,'救援后回码头并停船');
nav.setSailing(true);nav.setInput(-1,-1);
for(let i=0;i<1500;i++){next=nav.step(.04);assert.ok(waterDepth(next.x,next.z)>=.8499,'不能穿过岛或河岸');}
nav.setOnBoat(false);const ashore=nav.snapshot();nav.setInput(1,1);nav.setSailing(true);nav.step(.2);assert.equal(nav.snapshot().x,ashore.x,'岸钓不能驾船');
const boat=createNavigation();
for(const origin of LOCATIONS)for(const target of LOCATIONS){
 if(origin===target)continue;
 boat.setHarbor(origin.id);boat.reset();boat.setSailing(true);
 const port=landings[target.id];
 for(let i=0;i<5000 && !boat.reachedDestination(port);i++){
  const {x,z}=boat.snapshot(),p=bearingPoint(x,z,target.id),d=Math.hypot(p.x-x,p.z-z);
  boat.setInput((p.x-x)/d,(p.z-z)/d);boat.step(.04);
 }
 assert.ok(boat.reachedDestination(port),origin.id+' → '+target.id);
 const n=boat.snapshot();assert.equal(habitatAt(n.x,n.z),target.id);
 boat.setHarbor(target.id);assert.ok(boat.snapshot().nearDock);
 const chart=chartPoint(port.x,port.z);assert.ok(Math.hypot(chart.x-target.x,chart.y-target.y)<.001);
}
console.log('Movement, anchoring, pause, shore clearance, six map pins and all 30 guided crossings passed.');
