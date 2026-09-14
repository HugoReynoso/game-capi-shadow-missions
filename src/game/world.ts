import type {Mission} from '../data/missions';
import {Color3,Color4} from '@babylonjs/core/Maths/math.color';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {Engine} from '@babylonjs/core/Engines/engine';
import {Scene} from '@babylonjs/core/scene';
import {FreeCamera} from '@babylonjs/core/Cameras/freeCamera';
import {HemisphericLight} from '@babylonjs/core/Lights/hemisphericLight';
import {DirectionalLight} from '@babylonjs/core/Lights/directionalLight';
import {CreateBox} from '@babylonjs/core/Meshes/Builders/boxBuilder';
import {CreateSphere} from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import {CreateDisc} from '@babylonjs/core/Meshes/Builders/discBuilder';
import {SpotLight} from '@babylonjs/core/Lights/spotLight';
import {ShadowGenerator} from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import {createSurfaces} from './surfaces';
import {createCharacters} from './characters';
import {createWater} from './water';
import '@babylonjs/core/Culling/ray';
import '@babylonjs/core/Rendering/outlineRenderer';
const MeshBuilder={CreateBox,CreateSphere,CreateDisc};
import type { Settings } from '../services/save';
export type {NPC} from './characters';
export function createWorld(canvas:HTMLCanvasElement,settings:Settings,mission:Mission){
 const engine=new Engine(canvas,true,{stencil:true,preserveDrawingBuffer:false});
 engine.setHardwareScalingLevel(settings.quality==='LOW'?2:settings.quality==='HIGH'?1:Math.max(1,window.devicePixelRatio/1.5));
 const scene=new Scene(engine);scene.clearColor=new Color4(.035,.065,.095,1);scene.fogMode=Scene.FOGMODE_EXP2;scene.fogDensity=.008;scene.fogColor=new Color3(.055,.095,.13);
 const camera=new FreeCamera('sniper',new Vector3(0,7,-24),scene);camera.minZ=.1;camera.maxZ=250;camera.fov=.72;camera.setTarget(new Vector3(0,1.3,9));
 const sky=new HemisphericLight('moon',new Vector3(.3,1,-.4),scene);sky.intensity=.95;sky.diffuse=new Color3(.61,.76,.91);sky.groundColor=new Color3(.24,.27,.29);
 const sun=new DirectionalLight('rim',new Vector3(-.4,-1,.6),scene);sun.intensity=.7;sun.diffuse=new Color3(1,.72,.4);
 const shadow=settings.quality==='LOW'?null:new ShadowGenerator(settings.quality==='HIGH'?2048:1024,sun);
 sun.position.set(-12,25,-10);sun.shadowMinZ=1;sun.shadowMaxZ=100;
 if(shadow){shadow.usePercentageCloserFiltering=true;shadow.bias=.001;shadow.normalBias=.035;shadow.filteringQuality=ShadowGenerator.QUALITY_LOW;shadow.setDarkness(.25);}
 const {material,ground}=createSurfaces(scene);
 function box(name:string,x:number,y:number,z:number,w:number,h:number,d:number,color:string,glow=false){
   const m=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.position.set(x,y,z);
   const surface=name.includes('crate')?'wood':name.includes('container')||name.includes('hull')||name.includes('warehouse')?'metal':undefined;
   m.material=name==='quay'?ground:material(color,glow,surface);m.receiveShadows=!glow;
   if(!glow&&['container','cargo crate','warehouse','cargo hull','bridge','ship freight','crane leg'].includes(name))shadow?.addShadowCaster(m);
   return m;
 }
 scene.imageProcessingConfiguration.toneMappingEnabled=true;
 scene.imageProcessingConfiguration.toneMappingType=1;
 scene.imageProcessingConfiguration.exposure=1.25;
 scene.imageProcessingConfiguration.contrast=1.12;
 box('quay',0,-.5,12,70,1,44,'#48545c');
 const water=createWater(scene);
 for(let i=0;i<20;i++){box('quay edge',-33+i*3.5,.06,32,1.7,.1,.4,i%2?'#c9a45d':'#252e35');}
 for(let i=0;i<12;i++)box('lane',-28+i*5,.025,1,2,.018,.12,'#96947c');
 function container(x:number,z:number,c:string,level=0){box('container',x,1.4+level*2.8,z,6,2.8,3,c);for(let i=0;i<12;i++)box('corrugation',x-2.75+i*.5,1.4+level*2.8,z-1.53,.055,2.6,.04,c);box('container lock',x+2.65,1.4+level*2.8,z-1.57,.055,2.4,.06,'#809098');}
 container(-13,13,'#406c76');container(-13,13,'#38535f',1);container(-19,17,'#9b5038');container(12,16,'#925b40');container(19,13,'#49636e');container(19,13,'#354b5a',1);container(5,23,'#375861');container(-3,23,'#634a41');
 for(const [x,z] of [[-4,12],[2,12],[3,14],[-7,18],[8,18]]){box('cargo crate',x,.65,z,1.3,1.3,1.3,'#94826a');box('crate strap',x,.66,z-.66,.09,1.32,.02,'#343e43');}
 box('warehouse',-28,5,28,13,10,15,'#263b48');box('warehouse door',-24,2.5,20.4,5,5,.2,'#151f28');
 for(let i=0;i<4;i++)box('warehouse window',-32+i*2.4,7,20.4,1.5,1,.1,'#d6b678',true);
 // Cargo ship, bridge and stacked freight beyond the quay.
 box('cargo hull',8,1,45,36,4,9,'#273844');box('hull stripe',8,2.3,40.4,35,.5,.1,'#9c4c3c');box('ship deck',8,3.1,45,34,.3,8,'#6c7778');box('bridge',22,6,45,5,6,6,'#a1aca8');box('bridge glass',22,7.2,41.9,4.5,1,.1,'#16394a');box('mast',22,11,45,.2,5,.2,'#b2b6ae');
 for(let i=0;i<4;i++){box('ship freight',-6+i*6,4.7,45,5.6,3,5,i%2?'#547073':'#79574a');}
 function crane(x:number,z:number){box('crane leg',x,10,z,.7,20,.7,'#aa7650');box('crane rear',x+5,10,z+3,.7,20,.7,'#aa7650');box('gantry',x+2.5,19,z,20,.7,1,'#bc8859');box('cable',x-6,13,z,.055,12,.055,'#bbc2b9');box('hook',x-6,7,z,.4,.5,.4,'#e0c182');const brace=box('diagonal',x+2.5,10,z, .3,20,.3,'#7e654f');brace.rotation.z=-.24;}
 crane(-19,34);crane(15,35);
 for(const x of [-20,-9,9,23]){box('lamp pole',x,5,20,.13,10,.13,'#6f7b81');box('lamp arm',x+1,10,20,2,.12,.12,'#738087');box('lamp',x+1.8,9.9,20,.7,.12,.5,'#ffe1a0',true);const pool=MeshBuilder.CreateDisc('light pool',{radius:4,tessellation:24},scene);pool.rotation.x=Math.PI/2;pool.position.set(x,.03,20);const pm=material('#a28c63');pool.material=pm;pm.alpha=.2;pool.isPickable=false;}
 for(let i=0;i<20;i++){const x=-90+i*9;const height=7+(Math.sin(i*3.7)+1)*8;box('skyline',x,height/2,100+(i%3)*6,6,height,7,'#1a2c39');for(let j=0;j<3;j++)box('distant light',x+j*1.5-1.5,height*.7,96.4,.35,.45,.05,'#978c70',true);}
 for(const x of [-10,10]){
   const lamp=new SpotLight('dock floodlight',new Vector3(x,9,-1),new Vector3(-x*.07,-1,.6),1.55,28,scene);
   lamp.diffuse=Color3.FromHexString('#ffe0b0');lamp.intensity=2.5;lamp.range=35;
 }
 // Grounded details: mooring bollards, seams and recessed dock markings.
 for(let i=0;i<12;i++){
   const x=-30+i*5.5;
   box('bollard',x,.3,31,.35,.6,.4,'#273139');box('bollard cap',x,.62,31,.6,.12,.4,'#697076');
 }
 for(let i=0;i<14;i++)box('concrete joint',-34+i*5,.012,13,.012,.014,40,'#37464d');
 for(let i=0;i<8;i++)box('cross joint',0,.013,-7+i*5,68,.015,.012,'#37464d');
 if(mission.environment!=='port'){
   const hidden=/^(cargo hull|hull stripe|ship deck|bridge|mast|ship freight|crane|gantry|cable|hook|diagonal|water)/;
   scene.meshes.filter(m=>hidden.test(m.name)).forEach(m=>m.setEnabled(false));
   box('district ground',0,-.65,65,180,1,100,'#41444a');
   for(let i=0;i<7;i++){const x=-36+i*12;const h=mission.environment==='city'?12+(i%3)*7:6;box('district building',x,h/2,42,9,h,12,mission.environment==='city'?'#515466':'#595247');for(let y=3;y<h;y+=3)for(let w=-2;w<=2;w+=2)box('district window',x+w,y,35.9,1,1.4,.06,'#aa946c',true);}
 }
 if([3,7].includes(mission.id)){
   for(const x of [-15,16]){box('transport body',x,1.5,17,3,2.5,7,'#555944');for(const z of [14.5,19.5]){box('transport tire',x-1.5,.55,z,.35,1.1,1.1,'#15191a');box('transport tire',x+1.5,.55,z,.35,1.1,1.1,'#15191a');}}
 }
 scene.fogDensity=mission.id===8?.018:.006+mission.id*.0004;
 sky.diffuse=Color3.FromHexString(mission.environment==='city'?'#b7c3e8':mission.environment==='industrial'?'#d4bb92':'#9bc2e8');
 const transports=scene.meshes.filter(m=>m.name.startsWith('transport'));const transportOrigins=transports.map(m=>m.position.z);
 if([2,4,5,6,9,10].includes(mission.id)){
   for(const [x,z] of [[-11,8],[5,16],[13,13]]){box('checkpoint barrier',x,.55,z,2.8,1.1,.65,'#4b4b42');box('barrier stripe',x,.7,z-.34,2.6,.18,.03,'#b29249');}
 }
 if(mission.id>=6){for(const x of [-17,18]){box('sentry bunker',x,1.1,23,3,2.2,2,'#343a36');box('bunker slit',x,1.5,21.98,2,.3,.05,'#090f10');}}
 const characters=createCharacters(scene,shadow,mission);
 const sparks=Array.from({length:8},(_,i)=>{const m=CreateSphere('impact '+i,{diameter:.09,segments:6},scene);m.material=material('#f4d5a2',true);m.isPickable=false;m.setEnabled(false);return {mesh:m,life:0};});
 let impactIndex=0;
 function impact(point:Vector3){const p=sparks[impactIndex++%sparks.length];p.mesh.position.copyFrom(point);p.life=.3;p.mesh.setEnabled(true);}
 let lastTime=0;
 function animate(time:number,scan:boolean){const dt=Math.max(0,time-lastTime);lastTime=time;characters.animate(time,scan);transports.forEach((m,i)=>m.position.z=transportOrigins[i]+Math.sin(time*.24)*5);water.update(time,camera.position);for(const p of sparks){if(p.life>0){p.life-=dt;p.mesh.scaling.setAll(1+(.3-p.life)*8);p.mesh.visibility=Math.max(0,p.life/.3);if(p.life<=0)p.mesh.setEnabled(false);}}}
 return {engine,scene,camera,npcs:characters.npcs,animate,ready:characters.ready,hit:characters.hit,impact};
}
