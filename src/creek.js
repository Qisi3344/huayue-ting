import * as T from '../vendor/three.module.js';
import {bankZ,bridgeX,channel} from './data.js';
import {batchRigidMeshes} from './boat.js';
import {waterHeight} from './lake.js';

// All silhouettes, including the waterline under the bridge, use the sailing coordinates.
export function buildCreek(gradient){
 const group=new T.Group();
 const color=c=>new T.MeshToonMaterial({color:c,gradientMap:gradient});
 const grass=color(0x96ad61),sand=color(0xcdba83),stone=color(0x827e70),moss=color(0x627753);
 const bark=color(0x674939),pinks=[0xe39aa8,0xf2bfbd,0xbf788b].map(color);
 const foliage=[0x708a4e,0x879f53,0xa5b965].map(color),gold=color(0xcaac64);
 const lump=new T.IcosahedronGeometry(1,0),crown=new T.IcosahedronGeometry(1,1);
 let seed=145;const random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
 function piece(geometry,material,x,y,z,sx=1,sy=1,sz=1){
  const mesh=new T.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);group.add(mesh);return mesh;
 }
 function limb(a,b,r,tip){
  const start=new T.Vector3(...a),end=new T.Vector3(...b),v=end.clone().sub(start);
  const mesh=piece(new T.CylinderGeometry(tip,r,v.length(),7),bark,...start.addScaledVector(v,.5).toArray());
  mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());
 }
 function rise(x,side){return .85+(side===1?8.2:1.8)*Math.exp(-((x-20)**2)/29);}
 for(const side of [1,2]){
  const sign=side===1?-1:1,positions=[],colors=[];
  function vertex(row,j){
   const [x]=row,h=rise(x,side);
   return [x,[waterHeight-.18,.18,h,h*.85,1.2][j],row[side]+sign*[-.12,.65,side===1?1.95:3.1,7,24][j]];
  }
  for(let i=1;i<channel.length;i++)for(let j=0;j<4;j++){
   const a=vertex(channel[i-1],j),b=vertex(channel[i],j),c=vertex(channel[i],j+1),d=vertex(channel[i-1],j+1);
   const tint=(j===0?sand:j===1&&side===1&&i>=6&&i<=9?stone:grass).color.clone().multiplyScalar(.9+random()*.12);
   for(const v of (side===1?[a,b,c,a,c,d]:[a,c,b,a,d,c])){positions.push(...v);colors.push(tint.r,tint.g,tint.b);}
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  const material=color(0xffffff);material.vertexColors=true;material.side=T.DoubleSide;
  piece(geo,material,0,0,0);
 }
 // The old cherry leans out from the northern headland. Its low wide crown
 // frames the entrance; the rock behind it hides the bridge on departure.
 function blossom(x,z,y,k,lean){
  const joint=[x+.35*k,y+1.75*k,z+lean*.75*k];
  const crook=[x-.38*k,y+.83*k,z+.4*k*lean];
  limb([x,y-.16,z],crook,.53*k,.4*k);limb(crook,joint,.41*k,.29*k);
  for(let i=0;i<5;i++){
   const a=i*2.4,dx=Math.cos(a)*1.7*k,dz=(Math.sin(a)*1.2+lean)*k;
   const end=[joint[0]+dx,joint[1]+(.75+i*.13)*k,joint[2]+dz];
   const elbow=[joint[0]+dx*.54,joint[1]+.26*k,joint[2]+dz*.6];
   limb(joint,elbow,.24*k,.17*k);limb(elbow,end,.17*k,.075*k);
   for(let n=0;n<4;n++){
    const angle=a+n*1.75;
    const c=piece(crown,pinks[(i+n)%3],end[0]+Math.cos(angle)*.86*k,end[1]+random()*.43*k,end[2]+Math.sin(angle)*.75*k,1.46*k,(.56+random()*.24)*k,1.16*k);
    c.rotation.y=angle;
    // Short sprays break up the solid crown into petal-shaped silhouette edges.
    for(let j=0;j<9;j++){
     const t=random()*Math.PI*2,e=.8+random()*.34,petal=.12+random()*.16;
     const spray=piece(lump,pinks[(n+j)%3],c.position.x+1.4*k*Math.cos(t)*e,c.position.y+(.08-random()*.36)*k,c.position.z+1.08*k*Math.sin(t)*e,petal*k,.10*k,petal*k);
     spray.rotation.y=t;
    }
   }
  }
 }
 blossom(12,bankZ(12,1)-1,.55,1.85,1);
 for(const [x,side,k] of [[20.5,2,.88],[24,1,.78],[34.5,2,1.02],[36.5,1,.85],[40,2,1.22]]){
  const sign=side===1?-1:1;blossom(x,bankZ(x,side)+sign*2.4,rise(x,side)*(side===1?1:.72),k,-sign);
 }
 for(let i=0;i<105;i++){
  const x=-11+random()*54,side=i%2+1,sign=side===1?-1:1;
  const z=bankZ(x,side)+sign*(3.4+random()*6),y=rise(x,side)*.85,k=.6+random()*1.35;
  if(x<9 && side===2 && i%3)continue;
  limb([x,y-.2,z],[x+.12,y+1.9*k,z],.17*k,.1*k);
  for(let j=0;j<6;j++){
   const t=j*2.39+i,r=j<4?1:.48;
   piece(lump,foliage[(i+j)%3],x+Math.cos(t)*r*k,y+(1.8+j*.19)*k,z+Math.sin(t)*r*k,(1.05+r*.35)*k,.88*k,1.25*k).rotation.y=t;
  }
 }
 for(let i=0;i<115;i++){
  const x=-10+random()*23,side=i%2+1,sign=side===1?-1:1,z=bankZ(x,side)+sign*(random()*.85);
  for(let j=0;j<3;j++){const h=.65+random()*.65;piece(lump,gold,x+j*.09,.18+h*.4,z+random()*.2,.044,h*.54,.06).rotation.z=(random()-.5)*.4;}
 }
 for(let i=0;i<65;i++){
  const x=-9+random()*52,side=i%2+1,sign=side===1?-1:1,k=.22+random()*.5;
  piece(lump,i%4?stone:moss,x,0,bankZ(x,side)+sign*.28,k*1.35,k*.7,k).rotation.y=i;
 }
 // Arch is hollow geometry; its feet sit beyond the navigable banks.
 const north=bankZ(bridgeX,1),south=bankZ(bridgeX,2),mid=(north+south)/2,r=(south-north)/2;
 const arch=new T.Shape();arch.moveTo(-r-1.6,-.45);arch.lineTo(-r,-.45);arch.lineTo(-r,.4);
 arch.absellipse(0,.4,r,4.7,Math.PI,0,true);arch.lineTo(r,-.45);arch.lineTo(r+1.6,-.45);arch.lineTo(r+1.6,3.05);
 arch.quadraticCurveTo(0,9.2,-r-1.6,3.05);arch.closePath();
 const span=new T.ExtrudeGeometry(arch,{depth:1.45,bevelEnabled:false,curveSegments:24});
 piece(span,stone,bridgeX-.725,0,mid).rotation.y=Math.PI/2;
 const trim=[0xc4b49d,0xad9e8d,0xd0c1a8].map(color);
 for(const face of [-.8,.8])for(let i=0;i<17;i++){
  const a=Math.PI*i/17,b=Math.PI*(i+1)/17-.015,block=new T.Shape();
  for(const [n,[angle,offset]] of [[a,0],[a,.46],[b,.46],[b,0]].entries()){
   const x=Math.cos(angle)*(r+offset),y=.4+Math.sin(angle)*(4.7+offset);
   if(n===0)block.moveTo(x,y);else block.lineTo(x,y);
  }
  block.closePath();piece(new T.ExtrudeGeometry(block,{depth:.09,bevelEnabled:false}),trim[i%3],bridgeX+face,0,mid).rotation.y=Math.PI/2;
 }
 for(let i=0;i<32;i++){
  const x=14+random()*10,z=bankZ(x,1)-1.4-random()*2;
  const h=rise(x,1),k=.6+random()*.85;
  const rock=piece(lump,i%4?stone:moss,x,h*.57,z,k*1.3,h*.43,k);rock.rotation.y=i;
 }
 piece(crown,foliage[0],52,-1.4,2,8,4.2,16);
 for(let i=0;i<24;i++){
  const a=i*Math.PI/12,k=5+random()*7;
  piece(lump,i%2?colorMountainA:colorMountainB,18+Math.cos(a)*55,-2.5,Math.sin(a)*45,10+random()*8,k,9).rotation.y=a;
 }
 batchRigidMeshes(group);group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 return group;
}
const colorMountainA=new T.MeshBasicMaterial({color:0x9eb8ac}),colorMountainB=new T.MeshBasicMaterial({color:0xbac7b0});
