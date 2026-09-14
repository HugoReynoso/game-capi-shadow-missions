import {DynamicTexture} from '@babylonjs/core/Materials/Textures/dynamicTexture';
import {StandardMaterial} from '@babylonjs/core/Materials/standardMaterial';
import {Color3} from '@babylonjs/core/Maths/math.color';
import type {Scene} from '@babylonjs/core/scene';

export function createSurfaces(scene:Scene){
  let seed=419;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
  const texture=(kind:'concrete'|'metal'|'wood')=>{
    const map=new DynamicTexture(kind,{width:512,height:512},scene,true);
    const c=map.getContext();
    c.fillStyle=kind==='wood'?'#aea08c':'#a5aaad';c.fillRect(0,0,512,512);
    for(let i=0;i<42000;i++){
      const light=Math.floor(95+random()*125);
      c.fillStyle=`rgba(${light},${light},${light},${random()*.24})`;
      const x=random()*512,y=random()*512;c.fillRect(x,y,kind==='wood'?random()*65+1:2,1+random()*2);
    }
    for(let i=0;i<80;i++){
      c.fillStyle=kind==='metal'?'rgba(64,36,19,.13)':'rgba(32,37,40,.035)';
      c.beginPath();c.arc(random()*512,random()*512,random()*22+2,0,7);c.fill();
    }
    if(kind==='concrete'){
      c.strokeStyle='rgba(20,25,29,.3)';c.lineWidth=1;
      for(let i=0;i<7;i++){let x=random()*512,y=random()*512;c.beginPath();c.moveTo(x,y);for(let j=0;j<8;j++){x+=random()*45-20;y+=random()*22;c.lineTo(x,y);}c.stroke();}
    }else{
      c.strokeStyle=kind==='wood'?'#4f453750':'#ffffff22';c.lineWidth=1;
      for(let i=0;i<512;i+=kind==='wood'?64:37){c.beginPath();c.moveTo(i,0);c.lineTo(i,512);c.stroke();}
    }
    map.update();map.anisotropicFilteringLevel=4;return map;
  };
  const maps={concrete:texture('concrete'),metal:texture('metal'),wood:texture('wood')};
  const cache=new Map<string,StandardMaterial>();
  function material(hex:string,emission=false,kind?:keyof typeof maps){
    const key=hex+emission+(kind||'');const existing=cache.get(key);if(existing)return existing;
    const m=new StandardMaterial(key,scene);m.diffuseColor=Color3.FromHexString(hex);
    m.specularColor=kind==='metal'?new Color3(.3,.32,.35):new Color3(.035,.04,.05);
    m.specularPower=kind==='metal'?48:18;
    if(kind)m.diffuseTexture=maps[kind];
    if(emission){m.emissiveColor=m.diffuseColor;m.disableLighting=true;}
    cache.set(key,m);return m;
  }
  const ground=material('#737f88',false,'concrete');
  // DynamicTexture.clone creates an empty GPU texture; the ground owns this map.
  maps.concrete.uScale=9;maps.concrete.vScale=7;ground.diffuseTexture=maps.concrete;
  return {material,ground};
}

