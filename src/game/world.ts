import {Color3,Color4} from '@babylonjs/core/Maths/math.color';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {Engine} from '@babylonjs/core/Engines/engine';
import {Scene} from '@babylonjs/core/scene';
import {FreeCamera} from '@babylonjs/core/Cameras/freeCamera';
import {HemisphericLight} from '@babylonjs/core/Lights/hemisphericLight';
import {DirectionalLight} from '@babylonjs/core/Lights/directionalLight';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode';
import {CreateBox} from '@babylonjs/core/Meshes/Builders/boxBuilder';
import {CreateSphere} from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import {CreateDisc} from '@babylonjs/core/Meshes/Builders/discBuilder';
import '@babylonjs/core/Culling/ray';
import '@babylonjs/core/Rendering/outlineRenderer';
const MeshBuilder={CreateBox,CreateSphere,CreateDisc};
import type { NPCType } from './rules';
import type { Settings } from '../services/save';
export interface NPC {id:string;type:NPCType;root:TransformNode;parts:Mesh[];origin:Vector3;health:number;alive:boolean;behavior:string;animationState:string}
export function createWorld(canvas:HTMLCanvasElement,settings:Settings){
 const engine=new Engine(canvas,true,{stencil:true,preserveDrawingBuffer:false});
 engine.setHardwareScalingLevel(settings.quality==='LOW'?2:settings.quality==='HIGH'?1:Math.max(1,window.devicePixelRatio/1.5));
 const scene=new Scene(engine);scene.clearColor=new Color4(.035,.065,.095,1);scene.fogMode=Scene.FOGMODE_EXP2;scene.fogDensity=.008;scene.fogColor=new Color3(.055,.095,.13);
 const camera=new FreeCamera('sniper',new Vector3(0,7,-24),scene);camera.minZ=.1;camera.maxZ=250;camera.fov=.72;camera.setTarget(new Vector3(0,1.3,9));
 const sky=new HemisphericLight('moon',new Vector3(.3,1,-.4),scene);sky.intensity=.8;sky.diffuse=new Color3(.61,.76,.91);sky.groundColor=new Color3(.24,.27,.29);
 const sun=new DirectionalLight('rim',new Vector3(-.4,-1,.6),scene);sun.intensity=.7;sun.diffuse=new Color3(1,.72,.4);
 const materials=new Map<string,StandardMaterial>();
 function material(hex:string,emission=false){const key=hex+emission;if(materials.has(key))return materials.get(key)!;const m=new StandardMaterial(key,scene);m.diffuseColor=Color3.FromHexString(hex);m.specularColor=new Color3(.08,.08,.08);if(emission)m.emissiveColor=m.diffuseColor;materials.set(key,m);return m;}
 function box(name:string,x:number,y:number,z:number,w:number,h:number,d:number,color:string,glow=false){const m=MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.position.set(x,y,z);m.material=material(color,glow);return m;}
 box('quay',0,-.5,12,70,1,44,'#48545c');
 const water=box('sea',0,-1,74,220,.2,90,'#123e50');water.material!.alpha=.94;
 for(let i=0;i<35;i++){const line=box('water glint',Math.sin(i*9)*65,-.88,38+i*2,3+(i%7),.018,.08,i%3?'#245265':'#6b7771');line.isPickable=false;}
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
 const npcs:NPC[]=[];
 function npc(id:string,type:NPCType,x:number,z:number,color:string){const root=new TransformNode(id,scene);root.position.set(x,0,z);const parts:Mesh[]=[];function part(name:string,px:number,py:number,pz:number,w:number,h:number,d:number,c:string){const p=box(name,px,py,pz,w,h,d,c);p.parent=root;p.metadata={npcId:id,type};parts.push(p);return p;}
 part('torso',0,1.27,0,.62,.85,.36,color);part('leg L',-.18,.45,0,.23,.9,.26,'#202b35');part('leg R',.18,.45,0,.23,.9,.26,'#202b35');const head=MeshBuilder.CreateSphere('head',{diameter:.42,segments:8},scene);head.position.y=1.93;head.parent=root;head.material=material('#c29678');head.metadata={npcId:id,type};parts.push(head);part('arm L',-.4,1.25,0,.18,.76,.2,color);const arm=part('arm R',.4,1.42,-.04,.18,.65,.2,color);if(type==='TARGET'){arm.rotation.x=-1.1;part('phone',.4,1.73,-.32,.13,.22,.05,'#192833');}if(type==='CIVILIAN'){part('hardhat',0,2.1,0,.49,.15,.46,'#e3c572');part('safety stripe',0,1.28,-.19,.64,.09,.02,'#f1d697');}if(type==='HOSTILE')part('equipment',.26,1.05,-.28,.12,.6,.12,'#0b151c');npcs.push({id,type,root,parts,origin:root.position.clone(),health:100,alive:true,behavior:type==='TARGET'?'phone':type==='CIVILIAN'?'carrying':'guard',animationState:'idle'});}
 npc('coordinator','TARGET',-1,9,'#be3e43');npc('guard-west','HOSTILE',-9,11,'#344355');npc('guard-east','HOSTILE',7,12,'#344355');npc('worker-west','CIVILIAN',-6,6,'#c79b45');npc('worker-east','CIVILIAN',8,5,'#c79b45');
 function animate(time:number,scan:boolean){for(let i=0;i<npcs.length;i++){const n=npcs[i];if(!n.alive)continue;const movement=Math.sin(time*.32+i);n.root.position.x=n.origin.x+movement*(n.type==='TARGET'?1.5:.8);n.root.rotation.y=Math.sin(time*.4+i)*.25;n.animationState=Math.abs(movement)<.8?'walking':'idle';n.parts.forEach(p=>{p.renderOverlay=scan&&n.type==='TARGET';p.overlayColor=new Color3(.4,.9,.7);p.overlayAlpha=.32;});}}
 return {engine,scene,camera,npcs,animate};
}
