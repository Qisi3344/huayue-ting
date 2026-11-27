import {LOCATIONS,bankZ} from './data.js';

// The existing paper chart fixes the six harbors and all player pins in place.
const u=13/35.75,v=-31/35.75;
export function chartPoint(x,z){return {x:27+(x-.25)*u-(z-1.6)*v,y:61+(x-.25)*v+(z-1.6)*u};}
export function worldPoint(x,y){
 const dx=x-27,dy=y-61,k=u*u+v*v;
 return {x:.25+(dx*u+dy*v)/k,z:1.6+(dy*u-dx*v)/k};
}
export const landings=Object.fromEntries(LOCATIONS.map(p=>[p.id,worldPoint(p.x,p.y)]));
export const bounds=[-18,67,-16,65];
// The route folds back through the lake center. Widths shape the new arms;
// the original cherry reach keeps its hand-placed two banks.
const points=[];
function knot(id,x,z,r){points.push({id,x,z,r});}
function port(id,r){const {x,z}=landings[id];knot(id,x,z,r);}
port('reed',0);
for(const [x,z] of [[9,3],[16,8],[20,12.3],[23,8.5],[27,3],[31,1.6]])knot('reed',x,z,0);
knot('sakura',32.1,1.6,0);port('sakura',3.8);
knot('sakura',42,5,3.7);knot('sakura',45,12,3.4);knot('falls',46,19,4.8);port('falls',7.6);
knot('falls',48,33,4.6);knot('snow',41,40,3.9);port('snow',9);
knot('snow',24,48,5.1);knot('tide',16,44,3.7);knot('tide',8,46,5);port('tide',7.8);
knot('tide',2,35,4.5);knot('moon',9,29,4);port('moon',6.2);
knot('moon',12,22,3.5);knot('reed',6,16.8,3.3);knot('reed',4.4,8.6,3.2);
const edges=points.map((p,i)=>{
 const q=points[(i+1)%points.length],dx=q.x-p.x,dz=q.z-p.z,length=Math.hypot(dx,dz);
 return {p,q,dx,dz,length};
});
let perimeter=0;
for(const e of edges){e.start=perimeter;perimeter+=e.length;}
const stops=Object.fromEntries(edges.filter(e=>Math.hypot(e.p.x-landings[e.p.id].x,e.p.z-landings[e.p.id].z)<.01).map(e=>[e.p.id,e.start]));
function project(e,x,z){return Math.max(0,Math.min(1,((x-e.p.x)*e.dx+(z-e.p.z)*e.dz)/(e.length*e.length)));}
function nearest(x,z){
 let distance=Infinity,best,t=0;
 for(const e of edges){
  const f=project(e,x,z),d=(x-e.p.x-f*e.dx)**2+(z-e.p.z-f*e.dz)**2;
  if(d<distance){distance=d;best=e;t=f;}
 }
 return {edge:best,t};
}
export function habitatAt(x,z){const {edge,t}=nearest(x,z);return (t<.5?edge.p:edge.q).id;}
export function bearingPoint(x,z,id){
 const {edge,t}=nearest(x,z),start=edge.start+t*edge.length;
 const forward=(stops[id]-start+perimeter)%perimeter,delta=forward<=perimeter/2?forward:forward-perimeter;
 if(Math.abs(delta)<4)return landings[id];
 const target=(start+Math.sign(delta)*4+perimeter)%perimeter;
 const e=edges.find(e=>e.start+e.length>=target)||edges[0],f=(target-e.start)/e.length;
 return {x:e.p.x+e.dx*f,z:e.p.z+e.dz*f};
}
export const islets=[{x:-7,z:-3,rx:6.15,rz:5.7},{x:-13,z:5,rx:5.7,rz:3.9},{x:37,z:-6,rx:5.1,rz:4.7}];
export const berthOffsets={falls:[5.6,-1],snow:[1,6.2],tide:[-5.6,1],moon:[2.2,5.6]};
for(const [id,[dx,dz]] of Object.entries(berthOffsets)){
 const p=landings[id];islets.push({id,x:p.x+dx,z:p.z+dz,rx:id==='snow'?3.8:3,rz:id==='moon'?2.6:2.35});
}
export function outerDepth(x,z){
 let depth=Math.min(x+16,45-x,z-bankZ(x,1),bankZ(x,2)-z);
 for(const e of edges){
  if(!(e.p.r||e.q.r))continue;
  const f=project(e,x,z),dx=x-e.p.x-f*e.dx,dz=z-e.p.z-f*e.dz;
  depth=Math.max(depth,e.p.r+f*(e.q.r-e.p.r)-Math.sqrt(dx*dx+dz*dz));
 }
 return depth;
}
export function waterDepth(x,z){
 let depth=outerDepth(x,z);
 for(const b of islets){
  const dx=(x-b.x)/b.rx,dz=(z-b.z)/b.rz;
  depth=Math.min(depth,(Math.sqrt(dx*dx+dz*dz)-1)*Math.min(b.rx,b.rz));
 }
 return depth;
}

export function terrainHeight(x,z,d=outerDepth(x,z)){
 const bluff=8.2*Math.exp(-((x-20)**2)/29)*Math.exp(-((z-bankZ(x,1)+3)**2)/50);
 return -.13+Math.min(1,Math.max(-.5,-d/2.4))*(1.1+bluff+.25*Math.sin(x*.36+z*.17));
}
