import * as T from '../vendor/three.module.js';
import {batchRigidMeshes} from './boat.js';
import {bankZ} from './data.js';
import {landings,waterDepth,outerDepth,islets,habitatAt,terrainHeight} from './waterways.js';

export function buildRegions(gradient,viewFocus){
 const group=new T.Group(),col=c=>new T.MeshToonMaterial({color:c,gradientMap:gradient});
 const palette={reed:[0xc9b985,0x92aa64],sakura:[0xe0c69a,0xa8b879],falls:[0x84978b,0x537d63],snow:[0xc7e4e5,0xdbedf0],tide:[0xe2bc7e,0xc09458],moon:[0xd5cad4,0xb4b4ca]};
 const positions=[],colors=[],tint=new T.Color(),shoreTint=new T.Color();
 const vertices=[];
 for(let z=-27;z<=76;z++){
  const row=[];vertices.push(row);
  for(let x=-28;x<=77;x++){
   const d=outerDepth(x,z),y=terrainHeight(x,z,d),swatch=palette[habitatAt(x,z)];
   const cliff=z<bankZ(x,1)&&Math.abs(x-20)<6&&y>1.3;
   tint.setHex(cliff?0x838677:swatch[1]).lerp(shoreTint.setHex(swatch[0]),T.MathUtils.clamp((.72-y)/.56,0,1));
   tint.multiplyScalar(.99+.027*Math.sin(x*.54+z*.39));
   row.push([x,y,z,tint.r,tint.g,tint.b]);
  }
 }
 for(let j=1;j<vertices.length;j++)for(let i=1;i<vertices[j].length;i++){
  const a=vertices[j-1][i-1],b=vertices[j-1][i],c=vertices[j][i],d=vertices[j][i-1];
  if(Math.max(a[1],b[1],c[1],d[1])<-.4)continue;
  for(const [x,y,z,r,g,blue] of [a,d,b,b,d,c]){positions.push(x,y,z);colors.push(r,g,blue);}
 }
 const terrain=new T.BufferGeometry();terrain.setAttribute('position',new T.Float32BufferAttribute(positions,3));terrain.setAttribute('color',new T.Float32BufferAttribute(colors,3));terrain.computeVertexNormals();
 const ground=col(0xffffff);ground.vertexColors=true;
 const floor=new T.Mesh(terrain,ground);floor.receiveShadow=true;group.add(floor);
 const raw=new T.IcosahedronGeometry(1,0),round=new T.IcosahedronGeometry(1,1),cone=new T.ConeGeometry(1,1,7),cube=new T.BoxGeometry();
 const rock=col(0x526862),moss=col(0x687e55),wood=col(0x6b5545),pine=col(0x456e6b),snow=col(0xe1f3f2),ice=new T.MeshPhongMaterial({color:0x92cfe6,emissive:0x123446,specular:0xe2faff,shininess:70,flatShading:true});
 const sand=col(0xe6bd86),terra=col(0xb86646),ochre=col(0xcf9258),pearl=col(0xd1cbe0),lilac=col(0x8e91b5);
 const water=new T.MeshBasicMaterial({color:0xa8e2db}),white=new T.MeshBasicMaterial({color:0xe2faf1});
 let treeBase=null;
 const features=new T.Group();group.add(features);
 function piece(g,m,x,y,z,a,b,c,turn=0,parent=features){
  const mesh=new T.Mesh(g,m);mesh.position.set(x,y,z);mesh.scale.set(a,b,c);mesh.rotation.y=turn;if(treeBase)mesh.userData.treeBase=treeBase;parent.add(mesh);return mesh;
 }
 function forestTree(x,z,k,frost){
  treeBase=[x,z];
  const h=terrainHeight(x,z,outerDepth(x,z));
  piece(cube,wood,x,h+k,z,.24*k,2*k,.24*k);
  if(!frost){
   for(let j=0;j<4;j++){
    const a=j*2.4+x;
    piece(round,j%2?moss:pine,x+Math.cos(a)*k,h+(2.2+j*.27)*k,z+Math.sin(a)*k,1.53*k,.95*k,1.4*k,a);
    const frond=piece(raw,moss,x+Math.cos(a)*.6,h+.26*k,z+Math.sin(a)*.6,.22*k,.24*k,.85*k,a);
    frond.rotation.x=.32;
   }
   treeBase=null;return;
  }
  for(let j=0;j<3;j++){
   const r=(1.5-.34*j)*k,y=h+(1.5+j*.76)*k;
   piece(cone,pine,x,y,z,r,2.65*k,r,.4);
   piece(cone,snow,x,y+.31*k,z,r*.83,2.17*k,r*.83,.4);
  }
  treeBase=null;
 }
 const islandMats={falls:moss,snow:snow,tide:sand,moon:pearl};
 for(const b of islets.filter(b=>b.id))piece(round,islandMats[b.id],b.x,-.26,b.z,b.rx*1.03,1.25,b.rz*1.03);
 const f=landings.falls,fallsStreaks=[];
 const sprayGeometry=new T.BoxGeometry(.04,.62,.07);
 // Broken basalt columns hold two sheets at different heights; their feet meet the pool.
 for(let i=0;i<8;i++){
  const z=f.z-6+i*1.6,x=f.x+6.8+.6*Math.cos(i),h=4.7+1.3*Math.sin(i*.72);
  piece(raw,rock,x+1.5,h*.43,z,2.6,h*.66,2,.15*i);
  piece(round,moss,x+1.4,h*.91,z,2.1,.65,1.7);
  if(i===3||i===5){
   piece(cube,water,x-1.43,h*.455,z,.2,h*.92,1.55);
   piece(round,moss,x-.7,h*.90,z,1.04,.21,1.0);
   for(let k=0;k<4;k++){
    const streak=new T.Mesh(sprayGeometry,white);streak.position.set(x-1.57,0,z-.58+k*.36);group.add(streak);
    fallsStreaks.push({streak,h,phase:i+k*.31});
   }
   piece(round,white,x-1.48,.04,z,.85,.13,1.2);
  }
 }
 for(let i=0;i<66;i++){
  const frost=i>=30,p=frost?landings.snow:f;
  const a=i*2.39996,r=8+(i%5)*1.25,x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;
  if(outerDepth(x,z)<-.5)forestTree(x,z,.8+(i%4)*.27,frost);
 }
 const s=landings.snow;
 for(let i=0;i<6;i++){
  const x=s.x-12+i*4.5,z=s.z+14+Math.sin(i)*2,h=5+(i%3)*2;
  piece(cone,lilac,x,h*.38,z,5,h,4,i);piece(cone,snow,x,h*.68,z,2.8,h*.43,2.45,i);
 }
 for(let i=0;i<6;i++)piece(cone,ice,s.x-2+i*.8,1.5+i%2*.4,s.z+6,1,3+i%3*.55,.8,i).rotation.z=(i-2)*.12;
 const t=landings.tide;
 for(let i=0;i<6;i++){
  const z=t.z-7+i*3.5,x=t.x-9-(i%2)*1.3,h=2.2+(i%3)*1.1;
  piece(raw,terra,x,h*.48,z,2.3,h,2);
  piece(raw,ochre,x,h*1.16,z,2.62,h*.41,2.24);
  piece(raw,sand,x-.13,h*.83,z,2.41,h*.16,2.07,.13);
 }
 const arch=new T.TorusGeometry(2.1,.54,6,16,Math.PI);
 piece(arch,terra,t.x-5.6,.53,t.z+.8,1.25,1.38,1,Math.PI/2);
 for(let i=0;i<7;i++){
  const rib=piece(round,sand,t.x-5.1,1.05,t.z+1.4+(i-3)*.16,.19,.82,.17);rib.rotation.x=(i-3)*.18;
 }
 const m=landings.moon;
 // A lifted terrace shows a sliver of sky between the faceted rock and the water.
 const moonLeaf=col(0xb8d0df),moonShade=col(0x8397bc),silver=col(0xe1dfe9);
 for(const [dx,dz,k,y] of [[2.2,5.6,1,1.8],[-2.1,6.8,.47,2.35],[6.4,6.8,.53,2.65]]){
  const x=m.x+dx,z=m.z+dz;
  piece(raw,lilac,x,y-.22*k,z,2.86*k,.84*k,2.15*k,.31);
  piece(round,pearl,x,y+.18*k,z,2.85*k,.4*k,2.18*k,.31);
  const tx=x+(k===1?-1.73:.48)*k,tz=z+1.04*k;
  piece(cone,silver,tx,y+1.55*k,tz,.25*k,2.8*k,.27*k);
  for(let j=0;j<5;j++){
   const a=j*2.4;
   piece(round,j%2?moonLeaf:moonShade,tx+Math.cos(a)*.78*k,y+(2.5+j*.17)*k,tz+Math.sin(a)*.7*k,1.21*k,.57*k,1.1*k,a);
  }
 }
 // Crescent construction adapted from Qisi3344/moontide-isle, js/lamps.js.
 const R=.12,r=.098,offset=.03,hy=(R*R-r*r+offset*offset)/(2*offset),hx=Math.sqrt(R*R-hy*hy);
 const shape=new T.Shape();
 for(const [radius,dy,start,reverse] of [[R,0,Math.atan2(hy,hx),false],[r,offset,Math.atan2(hy-offset,hx),true]]){
  for(let i=0;i<=32;i++){
   const a=start-(Math.PI+2*start)*(reverse?32-i:i)/32;
   if(!reverse&&!i)shape.moveTo(radius*Math.cos(a),radius*Math.sin(a)+dy);
   else shape.lineTo(radius*Math.cos(a),radius*Math.sin(a)+dy);
  }
 }
 const crescent=new T.ExtrudeGeometry(shape,{depth:.019,bevelEnabled:false});
 const glow=col(0xe4f5ff);glow.emissive.setHex(0x94bdef);glow.emissiveIntensity=.35;
 for(const [dx,dz,k] of [[2.2,5.6,.76],[-.1,5.4,.45],[4.4,5.4,.5]]){
  const x=m.x+dx,z=m.z+dz,y=2.1;
  piece(cube,pearl,x,y+.12*k,z,1.12*k,.26*k,1.12*k);
  piece(cube,lilac,x,y+1.5*k,z,.58*k,3*k,.58*k,.08);
  piece(cube,pearl,x,y+3*k,z,.91*k,.22*k,.91*k,.08);
  piece(crescent,glow,x,y+4.55*k,z,10.5*k,10.5*k,10.5*k,.42);
 }
 // Small patches at the edges of each harbor leave the middle of the fairway open.
 const pad=new T.CircleGeometry(1,13,.13,Math.PI*1.91);pad.rotateX(-Math.PI/2);
 const reedBlade=new T.ConeGeometry(1,1,4),leaf=col(0x749c72),frost=col(0xa4cdd9),petal=col(0xd3c6e6);
 for(const [id,yaw] of [['falls',1.2],['snow',.25],['tide',-1.3],['moon',.45]]){
  const port=landings[id],fx=Math.sin(yaw),fz=Math.cos(yaw);
  for(const [across,ahead] of [[-3.4,-1.5],[4.1,1.5],[-4.4,3.6]]){
   for(let i=0;i<6;i++){
    const a=i*2.4,r=Math.sqrt(i)*.34,x=port.x+fx*ahead-fz*across+Math.cos(a)*r,z=port.z+fz*ahead+fx*across+Math.sin(a)*r;
    if(waterDepth(x,z)<.25)continue;
    if(id==='falls'||id==='moon'){
     piece(pad,id==='falls'?leaf:petal,x,-.093+i*.0008,z,.18+i*.026,1,.12+i*.02,a);
    }else if(id==='snow' && i%3!==0)piece(raw,frost,x,-.14,z,.21+i*.05,.055,.13+i*.027,a);
    else if(id==='tide' && waterDepth(x,z)<2.1)piece(raw,ochre,x,-.17,z,.24+i*.05,.22,.19+i*.034,a);
   }
  }
 }
 const stalk=col(0xbca675);
 for(const id of ['falls','tide']){
  const b=islets.find(b=>b.id===id);
  for(let i=0;i<14;i++){
   const a=i*.38,z=b.z+Math.sin(a)*b.rz*.85,x=b.x+Math.cos(a)*b.rx*.85;
   piece(reedBlade,stalk,x,.49,z,.065,.92+(i%4)*.15,.08,a).rotation.z=.12*Math.sin(i);
  }
 }
 // Waders share the static shore batch. Their feet sit on a waterline stone.
 const feather=col(0xe7e1c9),wing=col(0x91a1aa),leg=col(0x625b4b);
 const neck=new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(.22,.65,0),new T.Vector3(.37,.87,0),new T.Vector3(.29,1.09,0),new T.Vector3(.43,1.25,0)]),8,.09,6,false);
 for(const [id,dx,dz,turn] of [['tide',-3.8,3.4,-.8],['falls',3.8,-3.4,1.6]]){
  const port=landings[id],bird=new T.Group(),x=port.x+dx,z=port.z+dz;
  piece(round,id==='tide'?ochre:rock,x,-.09,z,.68,.3,.54);
  bird.position.set(x,.14,z);bird.rotation.y=turn;features.add(bird);
  for(const side of [-1,1])piece(cube,leg,0,.24,side*.095,.037,.47,.035,0,bird);
  piece(round,feather,0,.64,0,.43,.24,.21,0,bird);
  for(const side of [-1,1])piece(round,wing,-.12,.68,side*.12,.32,.16,.09,-.1,bird);
  piece(neck,feather,0,0,0,1,1,1,0,bird);
  piece(round,feather,.48,1.25,0,.18,.12,.13,0,bird);
  piece(cone,ochre,.75,1.24,0,.056,.34,.06,0,bird).rotation.z=-Math.PI/2;
  for(const side of [-1,1])piece(raw,leg,.54,1.28,side*.11,.028,.028,.018,0,bird);
 }
 batchRigidMeshes(features,null,viewFocus);
 const reflected=new Set([rock,moss,pine,snow,ice,water,terra,ochre,pearl,lilac,glow,moonLeaf]);
 features.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;if(reflected.has(o.material)||o.geometry.hasAttribute("treeBase"))o.layers.enable(1);}});
 const fireflies=new T.BufferGeometry(),flies=[];
 for(let i=0;i<40;i++)flies.push(f.x+Math.sin(i*2.4)*(2+i%6),.6+(i%7)*.32,f.z+Math.cos(i*2.4)*(2+i%5));
 fireflies.setAttribute('position',new T.Float32BufferAttribute(flies,3));
 const glowDots=new T.Points(fireflies,new T.PointsMaterial({color:0xffeb95,size:.23,transparent:true,depthWrite:false}));group.add(glowDots);
 glowDots.material.onBeforeCompile=shader=>{
  shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>','float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;diffuseColor.a*=1.-smoothstep(.15,1.,r);diffuseColor.rgb+=vec3(.4,.29,.05)*(1.-smoothstep(.0,.42,r));');
 };
 return {group,update(t,night){
  for(const {streak,h,phase} of fallsStreaks)streak.position.y=.45+(1-(t*.8+phase)%1)*(h*.8-.4);
  glowDots.visible=night;glowDots.position.y=.15*Math.sin(t*1.4);glowDots.material.opacity=.68+.3*Math.sin(t*2.4);glow.emissiveIntensity=night?.98:.22;}};
}
