import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';
import {Matrix4,Mesh,Float32BufferAttribute} from '../vendor/three.module.js';

// The oar blade still swings independently. Its static neighbours can share a draw.
export function batchRigidMeshes(group,movingPart,viewFocus){
 group.updateWorldMatrix(true,true);
 const inverse=group.matrixWorld.clone().invert(),matrix=new Matrix4();
 const groups=new Map(), originals=[];
 group.traverse(part=>{
  if(!part.isMesh || part===movingPart)return;
  const tree=part.userData.treeBase;
  const key=[part.material.uuid,part.castShadow,part.receiveShadow,Boolean(tree)].join(':');
  if(!groups.has(key))groups.set(key,{part,geometries:[]});
  const geometry=part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone();
  if(tree){
   const origins=new Float32Array(geometry.attributes.position.count*2);
   for(let i=0;i<origins.length;i+=2){origins[i]=tree[0];origins[i+1]=tree[1];}
   geometry.setAttribute('treeBase',new Float32BufferAttribute(origins,2));
  }
  geometry.applyMatrix4(matrix.multiplyMatrices(inverse,part.matrixWorld));
  groups.get(key).geometries.push(geometry);originals.push(part);
 });
 for(const {part,geometries} of groups.values()){
  const material=part.userData.treeBase?part.material.clone():part.material;
  if(part.userData.treeBase){
   // Fade entire foreground trees together; the water and distant bank stay visible.
   material.onBeforeCompile=shader=>{
    shader.uniforms.viewFocus={value:viewFocus};
    shader.vertexShader='attribute vec2 treeBase; uniform vec3 viewFocus; varying float leafVisibility;\n'+shader.vertexShader.replace('#include <begin_vertex>',`
     #include <begin_vertex>
     vec2 sight=viewFocus.xz-cameraPosition.xz,offset=treeBase-cameraPosition.xz;
     float reach=max(.01,length(sight));vec2 dir=sight/reach;
     float side=abs(dir.x*offset.y-dir.y*offset.x);
     leafVisibility=max(smoothstep(3.6,5.7,side),smoothstep(reach-2.5,reach+.6,dot(dir,offset)));
    `);
    shader.fragmentShader='varying float leafVisibility;\n'+shader.fragmentShader.replace('#include <alphatest_fragment>',`
     #include <alphatest_fragment>
     if(leafVisibility<.999 && leafVisibility<=fract(dot(floor(gl_FragCoord.xy),vec2(.75488,.56984))))discard;
    `);
   };
  }
  const merged=new Mesh(mergeGeometries(geometries),material);
  merged.castShadow=part.castShadow;merged.receiveShadow=part.receiveShadow;
  group.add(merged);
  geometries.forEach(geometry=>geometry.dispose());
 }
 originals.forEach(part=>part.removeFromParent());
}
