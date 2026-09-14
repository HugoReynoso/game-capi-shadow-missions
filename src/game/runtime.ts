import type {Mission} from '../data/missions';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {createWorld} from './world';
import {AudioManager} from './audio';
import {SniperAimController} from './aim';
import {MAGAZINE_SIZE,RELOAD_SECONDS,resultFor,hitOutcome,shotDamage,type MissionState,type MissionResult} from './rules';
import type {Settings} from '../services/save';

export interface GameHUD {time:number;ammo:number;zoom:number;breath:number;scan:number;breathing:boolean;scanning:boolean;reloading:boolean;reloadSeconds:number;state:MissionState;fps:number;distance:number;heading:number;targetHealth:{id:string;number:number;current:number;max:number}|null;models:boolean;remaining:number;muted:boolean;exposed:boolean}
export interface Commands {mute:()=>void;fire:()=>void;zoom:(d:number)=>void;reload:()=>void;breath:()=>void;scan:()=>void;pause:()=>void;stick:(x:number,y:number)=>void}
interface Callbacks {hud:(hud:GameHUD)=>void;result:(result:MissionResult)=>void;flash:(flash:boolean)=>void;feedback:(feedback:'hit'|'miss'|'wounded'|null)=>void;snapshot:(image:string)=>void}

export function createMissionRuntime(canvas:HTMLCanvasElement,settings:Settings,callbacks:Callbacks,mission:Mission){
  let disposed=false;let lastTargetId:string|null=null;
  const world=createWorld(canvas,settings,mission);
  const {engine,scene,camera,animate}=world;
  const audio=new AudioManager(settings.music,settings.sfx);audio.start();
  let muted=false;let exposed=false;let enemyShots=0;let capture=false;
  let state:MissionState='LOADING',time=0,ammo=MAGAZINE_SIZE,shots=0,hits=0;
  let reloadUntil=0,breathUntil=0,breathReady=0,scanUntil=0,scanReady=0,lastShot=-10,lastHUD=0;
  let cinematicTime=0,pendingResult:MissionResult|null=null;
  let flashTimer:ReturnType<typeof setTimeout>,feedbackTimer:ReturnType<typeof setTimeout>;
  const aim=new SniperAimController(canvas,camera,settings.sensitivity,()=>state==='PLAYING',update);
  const pick=()=>scene.pickWithRay(camera.getForwardRay(220),mesh=>mesh.isEnabled()&&mesh.isPickable&&(mesh.metadata?.hitbox===true||(mesh.isVisible&&mesh.visibility>0)));

  function finish(reason:MissionResult['reason']){
    if(state!=='PLAYING')return;
    state=reason==='target'?'SUCCESS':'FAILED';
    aim.clear();cinematicTime=0;pendingResult=resultFor(reason,Math.min(time,mission.timeLimit),shots,hits);pendingResult.reward=reason==='target'?mission.reward:0;exposed=reason==='timeout';
    audio.play(reason==='target'?'success':'failed');update();
  }
  function pause(){
    if(state==='PLAYING'){state='PAUSED';aim.clear();audio.suspend();}
    else if(state==='PAUSED'){state='PLAYING';audio.resume();}
    update();
  }
  function update(){
    if(disposed)return;
    const contact=state==='PLAYING'?pick():null;const distance=contact?.distance||0;
    const targets=world.npcs.filter(n=>n.type==='TARGET');const target=targets.find(n=>n.id===contact?.pickedMesh?.metadata?.npcId)||targets.find(n=>n.id===lastTargetId);
    const targetHealth=target?{id:target.id,number:targets.indexOf(target)+1,current:Math.max(0,target.health),max:target.maxHealth}:null;
    callbacks.hud({targetHealth,remaining:world.npcs.filter(n=>n.type==='TARGET'&&n.alive).length,muted,exposed,time:Math.max(0,mission.timeLimit-time),ammo,zoom:aim.zoom,breath:Math.ceil(Math.max(0,breathReady-time)),scan:Math.ceil(Math.max(0,scanReady-time)),breathing:time<breathUntil,scanning:time<scanUntil,reloading:reloadUntil>0,reloadSeconds:Math.ceil(Math.max(0,reloadUntil-time)),state,fps:Math.round(engine.getFps()),distance:Math.round(distance),heading:Math.round(270+camera.rotation.y*180/Math.PI),models:world.npcs.every(n=>n.modelLoaded)});
  }
  function fire(){
    if(state!=='PLAYING'||ammo<=0||reloadUntil||time-lastShot<.65)return;
    capture=true;lastShot=time;shots++;ammo--;audio.play('shot');
    if(settings.vibration)navigator.vibrate?.(35);
    callbacks.flash(true);clearTimeout(flashTimer);flashTimer=setTimeout(()=>!disposed&&callbacks.flash(false),110);
    const contact=pick();const npc=world.npcs.find(n=>n.id===contact?.pickedMesh?.metadata?.npcId);
    const damage=shotDamage(contact?.pickedMesh?.metadata?.zone);
    const wounded=!!npc&&npc.type==='TARGET'&&npc.health>damage;
    callbacks.feedback(wounded?'wounded':npc?'hit':'miss');clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>!disposed&&callbacks.feedback(null),1600);
    if(npc&&npc.alive){hits++;if(npc.type==='TARGET'){lastTargetId=npc.id;npc.health-=damage;if(npc.health<=0){world.hit(npc,time);if(world.npcs.every(n=>n.type!=='TARGET'||!n.alive))finish('target');}}else{world.hit(npc,time);finish(hitOutcome(npc.type));}}
    else if(contact?.pickedPoint)world.impact(contact.pickedPoint);
    if(ammo===0&&state==='PLAYING')reload();
    if(!settings.reducedShake)aim.kick();update();
  }
  function zoom(d:number){if(state==='PLAYING')aim.setZoom(aim.zoom+d);}
  function reload(){if(state!=='PLAYING'||ammo===MAGAZINE_SIZE||reloadUntil)return;reloadUntil=time+RELOAD_SECONDS;audio.play('reload');update();}
  function breath(){if(state!=='PLAYING'||time<breathReady)return;breathUntil=time+4;breathReady=time+8;audio.play('breath');update();}
  function scan(){if(state!=='PLAYING'||time<scanReady)return;scanUntil=time+5;scanReady=time+30;audio.play('scan');update();}
  const commands:Commands={mute:()=>{muted=!muted;audio.setMuted(muted);update();},fire,zoom,reload,breath,scan,pause,stick:(x,y)=>{if(state==='PLAYING')aim.setStick(x,y);}};
  function key(event:KeyboardEvent){
    if(['Space','KeyR','KeyB','KeyQ','Escape','Equal','Minus','NumpadAdd','NumpadSubtract'].includes(event.code))event.preventDefault();
    if(event.repeat)return;
    if(event.code==='Space')fire();if(event.code==='KeyR')reload();if(event.code==='KeyB')breath();if(event.code==='KeyQ')scan();if(event.code==='Escape')pause();
    if(event.code==='Equal'||event.code==='NumpadAdd')zoom(1);if(event.code==='Minus'||event.code==='NumpadSubtract')zoom(-1);
  }
  function visibility(){if(document.hidden&&state==='PLAYING')pause();}
  const resize=()=>engine.resize();
  window.addEventListener('keydown',key);window.addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);
  engine.runRenderLoop(()=>{
    const dt=Math.min(engine.getDeltaTime()/1000,.1);
    if(state==='PLAYING'){
      time+=dt;if(reloadUntil&&time>=reloadUntil){ammo=MAGAZINE_SIZE;reloadUntil=0;}
      aim.update(dt,time,time<breathUntil,settings.reducedShake);animate(time,time<scanUntil);
      if(time>=mission.timeLimit)finish('timeout');
    }else if(pendingResult){
      cinematicTime+=dt;animate(time+cinematicTime,false);if(exposed){camera.rotation.z=Math.sin(cinematicTime*23)*.018;if(cinematicTime>.25+enemyShots*.5&&enemyShots<3){audio.play('shot');enemyShots++;callbacks.flash(true);}camera.rotation.x+=dt*.07;}
      if(cinematicTime>(exposed?2.4:1.4)){const result=pendingResult;pendingResult=null;callbacks.result(result);return;}
    }
    scene.render();if(capture){capture=false;try{callbacks.snapshot(canvas.toDataURL('image/jpeg',.65));}catch{}}if(time-lastHUD>.12){update();lastHUD=time;}
  });
  world.ready.then(()=>{
    if(disposed)return;
    scene.executeWhenReady(()=>{if(!disposed){state=document.hidden?'PAUSED':'PLAYING';if(document.hidden)audio.suspend();update();}});
  });
  if(import.meta.env.DEV){
    Object.assign(window,{__capiDebug:{world,aim,expire:()=>{time=mission.timeLimit;},aimAt:(id:string)=>{
      const n=world.npcs.find(n=>n.id===id);if(n){camera.setTarget(n.root.position.add(new Vector3(0,1.35,0)));aim.yaw=camera.rotation.y;aim.pitch=camera.rotation.x;}
    },state:()=>({state,time,shots,ammo,reloadUntil}),pick:()=>{const p=pick();return {name:p?.pickedMesh?.name,metadata:p?.pickedMesh?.metadata,distance:p?.distance};}}});
  }
  function dispose(){
    disposed=true;clearTimeout(flashTimer);clearTimeout(feedbackTimer);aim.dispose();
    window.removeEventListener('keydown',key);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);
    audio.dispose();scene.dispose();engine.dispose();
    if(import.meta.env.DEV)delete (window as unknown as Record<string,unknown>).__capiDebug;
  }
  return {commands,dispose};
}
