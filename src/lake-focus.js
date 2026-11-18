import * as THREE from '../vendor/three.module.js';

// Combine the bright halo and the out-of-focus screen edges in a single pass.
export function createLakeFocus(renderer) {
 const target=new THREE.WebGLRenderTarget(1,1);
 target.texture.colorSpace=THREE.SRGBColorSpace;
 const screen=new THREE.Scene(), cameraForScreen=new THREE.Camera();
 const material=new THREE.ShaderMaterial({
  depthTest:false,depthWrite:false,
  uniforms:{frame:{value:target.texture},pixel:{value:new THREE.Vector2()}},
  vertexShader:`
   varying vec2 vUv;
   void main(){vUv=position.xy*.5+.5;gl_Position=vec4(position.xy,0.,1.);}
  `,
  fragmentShader:`
   uniform sampler2D frame;
   uniform vec2 pixel;
   varying vec2 vUv;
   void main(){
    vec3 center=texture2D(frame,vUv).rgb;
    float fringe=smoothstep(.24,.52,abs(vUv.y-.48));
    vec2 stepUV=pixel*(1.6+2.*fringe);
    vec3 surround=(texture2D(frame,vUv+stepUV).rgb+texture2D(frame,vUv-stepUV).rgb
       +texture2D(frame,vUv+vec2(-stepUV.x,stepUV.y)).rgb+texture2D(frame,vUv+vec2(stepUV.x,-stepUV.y)).rgb)*.25;
    vec3 color=mix(center,surround,fringe*.55)+max(surround-vec3(.72),0.)*.12;
    gl_FragColor=vec4(color,1.);
    #include <colorspace_fragment>
   }
  `
 });
 const triangle=new THREE.BufferGeometry();
 triangle.setAttribute('position',new THREE.Float32BufferAttribute([-1,-1,0,3,-1,0,-1,3,0],3));
 const quad=new THREE.Mesh(triangle,material);quad.frustumCulled=false;screen.add(quad);
 return {
  resize(width,height,ratio){
   target.samples=width<=650?0:Math.min(2,renderer.capabilities.maxSamples);
   target.setSize(Math.round(width*ratio),Math.round(height*ratio));
   material.uniforms.pixel.value.set(1/width,1/height);
  },
  render(scene,camera){
   renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);
   renderer.render(screen,cameraForScreen);
  },
  dispose(){target.dispose();triangle.dispose();material.dispose();}
 };
}
