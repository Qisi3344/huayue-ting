// North is -Z and east is +X. Both extents are square so heading and distance
// have the same scale on either axis, even on a portrait screen.
const routeBounds={xmin:-10,xmax:24,zmin:-17,zmax:17};
const localBounds={xmin:-13,xmax:17,zmin:-15,zmax:15};
const resolution=384;

function paintBase(bounds,{banks,trees,docks,falls}){
 const canvas=document.createElement('canvas');
 canvas.width=canvas.height=resolution;
 const ctx=canvas.getContext('2d');
 const scale=resolution/(bounds.xmax-bounds.xmin);
 ctx.setTransform(scale,0,0,scale,-bounds.xmin*scale,-bounds.zmin*scale);
 const water=ctx.createLinearGradient(bounds.xmin,bounds.zmin,bounds.xmax,bounds.zmax);
 water.addColorStop(0,'#9bc8ba');water.addColorStop(1,'#547f82');
 ctx.fillStyle=water;
 ctx.fillRect(bounds.xmin,bounds.zmin,bounds.xmax-bounds.xmin,bounds.zmax-bounds.zmin);
 function oval(x,z,rx,rz,fill){
  ctx.beginPath();ctx.ellipse(x,z,rx,rz,0,0,2*Math.PI);ctx.fillStyle=fill;ctx.fill();
 }
 for(const [rim,fill] of [[1.65,'#99c2af'],[.65,'#b8d0b1'],[.2,'#e2dcb6'],[0,'#aabb8d']]){
  for(const bank of banks)oval(bank.x,bank.y,bank.z+rim,bank.w+rim,fill);
 }
 for(const {g,type} of trees){
  const {x,z}=g.position,r=g.scale.x;
  oval(x,z,r*.86,r*.79,type==='flower'?'#cfafa7':'#779978');
  oval(x-r*.18,z-r*.2,r*.56,r*.48,type==='flower'?'#dfc1b5':'#91ae85');
 }
 for(const dock of docks){
  ctx.save();ctx.translate(dock.position.x,dock.position.z);ctx.rotate(-dock.rotation.y);
  ctx.fillStyle='#776951';ctx.fillRect(-3.02,-.85,4.2,1.7);
  ctx.fillStyle='#e1c998';
  for(let i=0;i<9;i++)ctx.fillRect(-2.96+.46*i,-.76,.38,1.52);
  ctx.restore();
 }
 if(falls){oval(5.5,-7,1.55,1.25,'#a7b4a3');oval(5.35,-5.8,.43,.76,'#d6e6db');}
 return canvas;
}

export function createMinimap(base,marker){
 const cache=new Map();
 let bounds=routeBounds,lastX,lastZ,lastYaw,lastBoat;
 return {
  setArea(key,features){
   bounds=key==='route'?routeBounds:localBounds;
   if(!cache.has(key))cache.set(key,paintBase(bounds,features));
   const canvas=cache.get(key);
   if(base.firstChild!==canvas)base.replaceChildren(canvas);
   lastX=undefined;
  },
  update(x,z,yaw,onBoat){
   if(x!==lastX||z!==lastZ){
    marker.style.left=(x-bounds.xmin)/(bounds.xmax-bounds.xmin)*100+'%';
    marker.style.top=(z-bounds.zmin)/(bounds.zmax-bounds.zmin)*100+'%';
    lastX=x;lastZ=z;
   }
   if(yaw!==lastYaw){
    // CSS starts at north and turns clockwise; world yaw starts at south.
    marker.style.transform='translate(-50%, -50%) rotate('+(Math.PI-yaw)+'rad)';
    lastYaw=yaw;
   }
   if(onBoat!==lastBoat){marker.classList.toggle('ashore',!onBoat);lastBoat=onBoat;}
  }
 };
}
