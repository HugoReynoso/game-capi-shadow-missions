import {LoadAssetContainerAsync} from '@babylonjs/core/Loading/sceneLoader';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
import {CreateCapsule} from '@babylonjs/core/Meshes/Builders/capsuleBuilder';
import {CreateSphere} from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import {CreateBox} from '@babylonjs/core/Meshes/Builders/boxBuilder';
import {Color3} from '@babylonjs/core/Maths/math.color';
import {Vector3,Quaternion} from '@babylonjs/core/Maths/math.vector';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {PBRMaterial} from '@babylonjs/core/Materials/PBR/pbrMaterial';
import type {AnimationGroup} from '@babylonjs/core/Animations/animationGroup';
import type {Scene} from '@babylonjs/core/scene';
import type {ShadowGenerator} from '@babylonjs/core/Lights/Shadows/shadowGenerator';
import type {NPCType} from './rules';
import '@babylonjs/loaders/glTF';

export interface NPC {
  id:string;type:NPCType;root:TransformNode;parts:Mesh[];colliders:Mesh[];origin:Vector3;
  health:number;alive:boolean;behavior:string;animationState:string;hitTime:number|null;
  groups:AnimationGroup[];pose:AnimationGroup|null;modelLoaded:boolean;joints:Map<string,TransformNode>;
}
const definitions:Array<{id:string;type:NPCType;x:number;z:number}>=[
  {id:'coordinator',type:'TARGET',x:-1,z:9},
  {id:'guard-west',type:'HOSTILE',x:-9,z:11},
  {id:'guard-east',type:'HOSTILE',x:7,z:12},
  {id:'worker-west',type:'CIVILIAN',x:-6,z:6},
  {id:'worker-east',type:'CIVILIAN',x:8,z:5},
];

export function createCharacters(scene:Scene,shadow:ShadowGenerator|null){
  const npcs:NPC[]=definitions.map(d=>{
    const root=new TransformNode(d.id,scene);root.position.set(d.x,0,d.z);
    return {...d,root,parts:[],colliders:[],origin:root.position.clone(),health:100,alive:true,behavior:d.type==='TARGET'?'phone':'patrol',animationState:'idle',hitTime:null,groups:[],pose:null,modelLoaded:false,joints:new Map()};
  });
  const yellow=new StandardMaterial('safety yellow',scene);yellow.diffuseColor=Color3.FromHexString('#efb735');yellow.specularColor=new Color3(.3,.3,.3);
  const phoneMat=new StandardMaterial('phone',scene);phoneMat.diffuseColor=new Color3(.018,.025,.03);
  const screenMat=new StandardMaterial('phone screen',scene);screenMat.emissiveColor=new Color3(.2,.55,.65);
  function tag(mesh:Mesh,npc:NPC,zone:string){mesh.metadata={npcId:npc.id,type:npc.type,zone,hitbox:true};mesh.visibility=0;mesh.isPickable=true;npc.colliders.push(mesh);}
  function fallback(n:NPC){
    const mat=new StandardMaterial(`${n.id}-fallback`,scene);mat.diffuseColor=Color3.FromHexString(n.type==='TARGET'?'#b63438':n.type==='CIVILIAN'?'#d5a343':'#3e4d59');
    const body=CreateCapsule('body',{height:1.35,radius:.24,tessellation:12},scene);body.parent=n.root;body.position.y=.9;body.material=mat;body.metadata={npcId:n.id,type:n.type,zone:'body'};
    const head=CreateSphere('head',{diameter:.27,segments:12},scene);head.parent=n.root;head.position.y=1.72;const skin=new StandardMaterial('skin',scene);skin.diffuseColor=new Color3(.63,.43,.31);head.material=skin;head.metadata={npcId:n.id,type:n.type,zone:'head'};
    n.parts.push(body,head);n.parts.forEach(m=>shadow?.addShadowCaster(m,false));
  }
  const ready=Promise.all(['remy','swat'].map(name=>LoadAssetContainerAsync(`${import.meta.env.BASE_URL}models/${name}.glb`,scene))).then(containers=>{
    if(scene.isDisposed){containers.forEach(c=>c.dispose());return;}
    for(const n of npcs){
      const container=containers[n.type==='HOSTILE'?1:0];
      const instance=container.instantiateModelsToScene(name=>`${n.id}:${name}`,true,{doNotInstantiate:true});
      instance.rootNodes.forEach(node=>{node.parent=n.root;});
      n.root.scaling.setAll(n.type==='HOSTILE'?1.08:.51);
      const unit=1/n.root.scaling.x;
      n.groups=instance.animationGroups;n.groups.forEach(g=>g.name=`${n.id}:Idle`);
      const descendants=n.root.getChildTransformNodes(false);
      n.joints=new Map(descendants.filter(node=>node.name.includes('mixamorig:')).map(node=>[node.name.split('mixamorig:').at(-1)!,node]));
      const joint=(name:string)=>n.joints.get(name);
      for(const m of n.root.getChildMeshes()){
        if(!(m instanceof Mesh)||!m.getTotalVertices())continue;
        m.isPickable=false;m.receiveShadows=true;m.alwaysSelectAsActiveMesh=true;
        m.metadata={npcId:n.id,type:n.type};
        if(m.material instanceof PBRMaterial){m.material.roughness=.85;m.material.metallic=.02;m.material.albedoColor=Color3.White();}
        if(m.material instanceof PBRMaterial && m.name.endsWith('Tops')){
          m.material.albedoColor=n.type==='TARGET'?new Color3(3,.4,.3):new Color3(2.6,1.85,.3);
        }
        n.parts.push(m);
      }
      // Bone-following collision shapes avoid picking the unanimated bind pose.
      const zones:Array<[string,number,number,string]>=[['Head',.22,.26,'head'],['Spine1',.34,.43,'body'],['LeftArm',.12,.31,'arm'],['RightArm',.12,.31,'arm'],['LeftForeArm',.10,.27,'arm'],['RightForeArm',.10,.27,'arm'],['LeftUpLeg',.18,.42,'leg'],['RightUpLeg',.18,.42,'leg'],['LeftLeg',.14,.40,'leg'],['RightLeg',.14,.40,'leg']];
      for(const [name,diameter,height,zone] of zones){const parent=joint(name);if(!parent)continue;const collider=CreateCapsule(`${n.id}-${name}-hitbox`,{height:height*unit,radius:diameter*unit/2,tessellation:8,subdivisions:1},scene);collider.parent=parent;collider.position.y=(name==='Spine1'?.04:height*.4)*unit;tag(collider,n,zone);}
      if(n.type==='CIVILIAN'){
        const head=joint('Head');if(head){const helmet=CreateSphere('hardhat',{diameter:.27*unit,segments:16},scene);helmet.parent=head;helmet.position.y=.19*unit;helmet.scaling.y=.43;helmet.material=yellow;helmet.isPickable=false;n.parts.push(helmet);}
      }
      if(n.type==='TARGET'){
        const hand=joint('RightHand');if(hand){const phone=CreateBox('phone',{width:.07*unit,height:.13*unit,depth:.012*unit},scene);phone.parent=hand;phone.position.set(0,.07*unit,.03*unit);phone.material=phoneMat;phone.isPickable=false;n.parts.push(phone);const screen=CreateBox('phone display',{width:.06*unit,height:.11*unit,depth:.001*unit},scene);screen.parent=phone;screen.position.z=-.007*unit;screen.material=screenMat;screen.isPickable=false;n.parts.push(screen);}
      }
      n.modelLoaded=true;
      n.parts.forEach(m=>shadow?.addShadowCaster(m,false));
      // Do not include the invisible hit shapes in the shadow map.
      n.colliders.forEach(m=>shadow?.removeShadowCaster(m));
    }
    // The source meshes stay disabled; instances share their immutable texture data.
    scene.onDisposeObservable.addOnce(()=>containers.forEach(c=>c.dispose()));
    animate(0,false);
  }).catch(error=>{if(scene.isDisposed)return;if(import.meta.env.DEV)console.warn('Character fallback',error);npcs.forEach(fallback);});

  function animate(time:number,scan:boolean){
    npcs.forEach((n,i)=>{
      if(!n.alive){
        const elapsed=Math.max(0,time-(n.hitTime??time));const amount=Math.min(1,elapsed/.65);
        n.root.rotation.z=-amount*1.45;n.root.position.y=-.15*amount;return;
      }
      const phase=(time+i*3.7)%18;
      const walking=phase<6||phase>=12;
      const progress=phase<6?phase/6:phase<12?1:1-(phase-12)/6;
      const travel=n.type==='TARGET'?1.8:2.2;
      n.root.position.x=n.origin.x+progress*travel-travel/2;
      const angle=walking?(phase<6?-Math.PI/2:Math.PI/2):Math.PI;
      // Blend orientation along the shortest arc, including at patrol turnarounds.
      const delta=Math.atan2(Math.sin(angle-n.root.rotation.y),Math.cos(angle-n.root.rotation.y));
      n.root.rotation.y+=delta*.06;
      const name=walking?'Walk':'Idle';n.animationState=name.toLowerCase();
      const group=n.groups[0];
      if(group){
        if(n.pose!==group){n.pose?.stop();group.start(true,.7);group.pause();n.pose=group;}
        const fps=group.targetedAnimations[0]?.animation.framePerSecond||30;
        group.goToFrame(group.from+(time*.72*fps+i*7)%(Math.max(1,group.to-group.from)));
      }
      if(walking&&n.modelLoaded){
        const stride=Math.sin(time*5+i*1.8);
        const bend=(name:string,angle:number)=>{const joint=n.joints.get(name);if(joint?.rotationQuaternion)joint.rotationQuaternion=joint.rotationQuaternion.multiply(Quaternion.RotationAxis(Vector3.Right(),angle));};
        bend('LeftUpLeg',stride*.32);bend('RightUpLeg',-stride*.32);
        bend('LeftLeg',Math.max(0,-stride)*.4);bend('RightLeg',Math.max(0,stride)*.4);
        bend('LeftArm',-stride*.14);bend('RightArm',stride*.14);
        n.root.position.y=Math.abs(Math.sin(time*5+i*1.8))*.018;
      }else{n.root.position.y=0;}
      n.parts.forEach(p=>{p.renderOverlay=scan&&n.type==='TARGET';p.overlayColor=new Color3(.4,.9,.7);p.overlayAlpha=.3;});
    });
  }
  function hit(n:NPC,time:number){n.health=0;n.alive=false;n.hitTime=time;n.pose?.pause();n.colliders.forEach(m=>m.isPickable=false);}
  return {npcs,ready,animate,hit};
}


