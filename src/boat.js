import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';
import {Matrix4,Mesh} from '../vendor/three.module.js';

// The oar blade still swings independently. Its static neighbours can share a draw.
export function batchRigidMeshes(group,movingPart){
 group.updateWorldMatrix(true,true);
 const inverse=group.matrixWorld.clone().invert(),matrix=new Matrix4();
 const groups=new Map(), originals=[];
 group.traverse(part=>{
  if(!part.isMesh || part===movingPart)return;
  const key=part.material.uuid+':'+part.castShadow+':'+part.receiveShadow;
  if(!groups.has(key))groups.set(key,{part,geometries:[]});
  const geometry=part.geometry.index?part.geometry.toNonIndexed():part.geometry.clone();
  geometry.applyMatrix4(matrix.multiplyMatrices(inverse,part.matrixWorld));
  groups.get(key).geometries.push(geometry);originals.push(part);
 });
 for(const {part,geometries} of groups.values()){
  const merged=new Mesh(mergeGeometries(geometries),part.material);
  merged.castShadow=part.castShadow;merged.receiveShadow=part.receiveShadow;
  group.add(merged);
  geometries.forEach(geometry=>geometry.dispose());
 }
 originals.forEach(part=>part.removeFromParent());
}
