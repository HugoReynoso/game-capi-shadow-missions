import {CreateGround} from '@babylonjs/core/Meshes/Builders/groundBuilder';
import {ShaderMaterial} from '@babylonjs/core/Materials/shaderMaterial';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import type {Scene} from '@babylonjs/core/scene';

export function createWater(scene:Scene){
  const mesh=CreateGround('harbor water',{width:240,height:140,subdivisions:48},scene);
  mesh.position.set(0,-.8,103);mesh.isPickable=true;
  const shader=new ShaderMaterial('moving water',scene,{vertexSource:`
    precision highp float;
    attribute vec3 position;
    uniform mat4 worldViewProjection;
    uniform mat4 world;
    uniform float time;
    varying vec3 vWorld;
    void main(){vec3 p=position;p.y+=sin(p.x*.35+time*.7)*.09+sin(p.z*.7-time*.6)*.045;vWorld=(world*vec4(p,1.)).xyz;gl_Position=worldViewProjection*vec4(p,1.);}
  `,fragmentSource:`
    precision highp float;
    varying vec3 vWorld;
    uniform float time;
    uniform vec3 eye;
    void main(){
      float ripple=sin(vWorld.x*2.+vWorld.z*.4+time)*.06+sin(vWorld.z*3.-time*.8)*.05;
      vec3 n=normalize(vec3(ripple,1.,cos(vWorld.x+vWorld.z*1.7+time*.6)*.08));
      vec3 view=normalize(eye-vWorld);
      float fresnel=pow(1.-max(dot(view,n),0.),3.);
      vec3 color=mix(vec3(.025,.065,.087),vec3(.16,.25,.31),fresnel);
      float sheen=pow(max(dot(reflect(-normalize(vec3(-.4,1.,-.3)),n),view),0.),120.);
      float lights=exp(-pow((vWorld.x-12.+ripple*12.)*.12,2.))*pow(max(sin(vWorld.z*3.+time),0.),10.);
      color+=vec3(.72,.53,.26)*(sheen*.7+lights*.065);
      gl_FragColor=vec4(mix(color,vec3(.055,.095,.13),clamp(length(eye-vWorld)/260.,0.,.7)),1.);
    }
  `},{attributes:['position'],uniforms:['worldViewProjection','world','time','eye']});
  mesh.material=shader;shader.setFloat('time',0);shader.setVector3('eye',Vector3.Zero());
  return {update:(time:number,eye:Vector3)=>{shader.setFloat('time',time);shader.setVector3('eye',eye);}};
}
