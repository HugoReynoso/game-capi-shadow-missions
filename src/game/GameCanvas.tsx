import {useEffect,useRef,useState} from 'react';
import {Vector3} from '@babylonjs/core/Maths/math.vector';
import {Crosshair,Pause,Play,RotateCcw,Volume2,Wind,PawPrint,Plus,Minus,House} from 'lucide-react';
import {createWorld} from './world';
import {AudioManager} from './audio';
import {resultFor,hitOutcome,type MissionState,type MissionResult} from './rules';
import type {Settings} from '../services/save';
interface Props {settings:Settings;onResult:(r:MissionResult)=>void;onExit:()=>void}
interface Commands {fire:()=>void;zoom:(d:number)=>void;reload:()=>void;breath:()=>void;scan:()=>void;pause:()=>void}
const initial={time:90,ammo:3,zoom:1,breath:0,scan:0,breathing:false,scanning:false,reloading:false,state:'LOADING' as MissionState,fps:0};
export default function GameCanvas({settings,onResult,onExit}:Props){
 const canvas=useRef<HTMLCanvasElement>(null);const commands=useRef<Commands|null>(null);const [hud,setHud]=useState(initial);const [error,setError]=useState(false);const [flash,setFlash]=useState(false);const language=settings.language;const t=(it:string,en:string)=>language==='it'?it:en;
 useEffect(()=>{let disposed=false;let world:ReturnType<typeof createWorld>;try{world=createWorld(canvas.current!,settings);}catch(error){if(import.meta.env.DEV)console.error(error);setError(true);return;}
 const {engine,scene,camera,animate}=world;const audio=new AudioManager(settings.music,settings.sfx);audio.start();let state:MissionState='PLAYING',time=0,ammo=3,shots=0,hits=0,zoom=1,reloadUntil=0,breathUntil=0,breathReady=0,scanUntil=0,scanReady=0,lastShot=-10,lastHUD=0;let flashTimer:ReturnType<typeof setTimeout>;let yaw=camera.rotation.y,pitch=camera.rotation.x;let dragging=false,lastX=0,lastY=0;
 function finish(reason:MissionResult['reason']){if(state!=='PLAYING')return;state=reason==='target'?'SUCCESS':'FAILED';audio.play(reason==='target'?'success':'failed');onResult(resultFor(reason,time,shots,hits));}
 function pause(){if(state==='PLAYING'){state='PAUSED';audio.suspend();}else if(state==='PAUSED'){state='PLAYING';audio.resume();}update();}
 function update(){if(!disposed)setHud({time:Math.max(0,90-time),ammo,zoom,breath:Math.ceil(Math.max(0,breathReady-time)),scan:Math.ceil(Math.max(0,scanReady-time)),breathing:time<breathUntil,scanning:time<scanUntil,reloading:reloadUntil>0,state,fps:Math.round(engine.getFps())});}
 function fire(){if(state!=='PLAYING'||ammo<=0||reloadUntil||time-lastShot<.65)return;lastShot=time;shots++;ammo--;audio.play('shot');if(settings.vibration)navigator.vibrate?.(35);setFlash(true);clearTimeout(flashTimer);flashTimer=setTimeout(()=>!disposed&&setFlash(false),110);
 const pick=scene.pickWithRay(camera.getForwardRay(200));if(pick?.hit&&pick.pickedMesh?.metadata?.npcId){const npc=world.npcs.find(n=>n.id===pick.pickedMesh!.metadata.npcId)!;hits++;npc.health=0;npc.alive=false;npc.root.rotation.x=Math.PI/2;finish(hitOutcome(npc.type));}
 if(!settings.reducedShake)pitch-=.004;update();}
 function doZoom(d:number){if(state!=='PLAYING')return;zoom=Math.max(1,Math.min(4,zoom+d));camera.fov=.72/zoom;update();}
 function reload(){if(state!=='PLAYING'||ammo===3||reloadUntil)return;reloadUntil=time+1.8;audio.play('reload');update();}
 function breath(){if(state!=='PLAYING'||time<breathReady)return;breathUntil=time+4;breathReady=time+8;audio.play('breath');update();}
 function scan(){if(state!=='PLAYING'||time<scanReady)return;scanUntil=time+5;scanReady=time+30;audio.play('scan');update();}
 commands.current={fire,zoom:doZoom,reload,breath,scan,pause};
 const el=canvas.current!;
 function down(e:PointerEvent){if(state!=='PLAYING')return;dragging=true;lastX=e.clientX;lastY=e.clientY;el.setPointerCapture(e.pointerId);audio.resume();}
 function move(e:PointerEvent){if(!dragging||state!=='PLAYING')return;const scale=.0018*settings.sensitivity/zoom;yaw=Math.max(-.65,Math.min(.65,yaw-(e.clientX-lastX)*scale));pitch=Math.max(-.12,Math.min(.5,pitch+(e.clientY-lastY)*scale));lastX=e.clientX;lastY=e.clientY;}
 function up(){dragging=false;}
 function wheel(e:WheelEvent){e.preventDefault();doZoom(e.deltaY<0?1:-1);}
 function key(e:KeyboardEvent){if(['Space','ArrowUp','ArrowDown','KeyR','KeyB','KeyQ','Escape'].includes(e.code))e.preventDefault();if(e.repeat)return;if(e.code==='Space')fire();if(e.code==='KeyR')reload();if(e.code==='KeyB')breath();if(e.code==='KeyQ')scan();if(e.code==='Escape')pause();if(e.code==='ArrowUp')doZoom(1);if(e.code==='ArrowDown')doZoom(-1);}
 function visibility(){if(document.hidden&&state==='PLAYING')pause();}
 const resize=()=>engine.resize();el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('wheel',wheel,{passive:false});window.addEventListener('keydown',key);window.addEventListener('resize',resize);document.addEventListener('visibilitychange',visibility);
 engine.runRenderLoop(()=>{const dt=Math.min(engine.getDeltaTime()/1000,.1);if(state==='PLAYING'){time+=dt;if(reloadUntil&&time>=reloadUntil){ammo=3;reloadUntil=0;}const sway=settings.reducedShake?0:time<breathUntil?.00008:.0007;camera.rotation.y=yaw+Math.sin(time*1.3)*sway;camera.rotation.x=pitch+Math.cos(time*1.7)*sway;animate(time,time<scanUntil);if(time>=90)finish('timeout');}scene.render();if(time-lastHUD>.1||state==='PAUSED'){update();lastHUD=time;}});
 update();
 if(import.meta.env.DEV){Object.assign(window,{__capiDebug:{world,aimAt:(id:string)=>{const n=world.npcs.find(n=>n.id===id);if(n){camera.setTarget(n.root.position.add(new Vector3(0,1.4,0)));yaw=camera.rotation.y;pitch=camera.rotation.x;}},state:()=>({state,time,shots,ammo})}});}
 return()=>{disposed=true;clearTimeout(flashTimer);commands.current=null;el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);el.removeEventListener('wheel',wheel);window.removeEventListener('keydown',key);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);audio.dispose();scene.dispose();engine.dispose();if(import.meta.env.DEV)delete (window as unknown as Record<string,unknown>).__capiDebug;};
 },[settings,onResult]);
 if(error)return <div className="modal"><h2>{t('3D non disponibile','3D unavailable')}</h2><p>{t('Attiva l’accelerazione hardware o prova un browser con WebGL.','Enable hardware acceleration or try a WebGL browser.')}</p><button onClick={onExit}>{t('Torna alla base','Back to base')}</button></div>;
 return <div className={`game ${settings.leftHanded?'left-handed':''}`}>
 <canvas ref={canvas} aria-label={t('Porto 3D. Trascina per mirare.','3D harbor. Drag to aim.')}/>
 <div className="game-top"><div><span className="eyebrow">OP. 01 / PORTO NERO</span><strong>{t('Identifica il responsabile','Identify the coordinator')}</strong></div><div className={hud.time<20?'timer danger':'timer'}>{Math.floor(hud.time/60).toString().padStart(2,'0')}:{Math.ceil(hud.time%60).toString().padStart(2,'0')}</div><button className="icon-button" aria-label={t('Pausa','Pause')} onClick={()=>commands.current?.pause()}><Pause/></button></div>
 <div className="compass">240 <span>│</span> 255 <span>│</span> <b>W</b> <span>│</span> 285 <span>│</span> 300</div>
 {hud.zoom>1&&<div className="scope-mask"/>}<div className={`crosshair ${flash?'shot':''}`}><i/><i/><span/></div>
 <div className="scope-info">SR-01 SCOUT <span>{hud.zoom}.0×</span></div>
 {hud.scanning&&<div className="scan-line"/>}
 {settings.subtitles&&<div className="game-hint">{hud.scanning?t('Docky: una traccia vicino alle casse…','Docky: a scent near the crates…'):hud.time>76?t('Trascina per mirare · Zoom per osservare · Giacca rossa, telefono.','Drag to aim · Zoom to observe · Red jacket, phone.'):t('Osserva prima di agire. Un solo bersaglio autorizzato.','Observe before acting. Only one authorized target.')}</div>}
 <div className="utility"><button disabled={hud.breath>0} onClick={()=>commands.current?.breath()} className={hud.breathing?'active':''}><Wind/><span>{hud.breathing?t('STABILE','STEADY'):hud.breath>0?`${hud.breath}s`:t('RESPIRO','BREATH')}</span></button><button disabled={hud.scan>0} onClick={()=>commands.current?.scan()} className={hud.scanning?'active':''}><PawPrint/><span>{hud.scan>0?`${hud.scan}s`:'DOCKY SCAN'}</span></button></div>
 <div className="fire-controls"><div className="zoom-controls"><button aria-label="Zoom +" disabled={hud.zoom===4} onClick={()=>commands.current?.zoom(1)}><Plus/></button><span>{hud.zoom}×</span><button aria-label="Zoom −" disabled={hud.zoom===1} onClick={()=>commands.current?.zoom(-1)}><Minus/></button></div><button className="fire" disabled={hud.ammo===0||hud.reloading} onClick={()=>commands.current?.fire()} aria-label={t('Spara','Fire')}><Crosshair size={30}/><span>{t('SPARA','FIRE')}</span></button><button className="reload" onClick={()=>commands.current?.reload()} disabled={hud.ammo===3||hud.reloading}><RotateCcw size={18}/>{hud.reloading?t('Ricarica…','Reloading…'):`${hud.ammo} / 3`}</button></div>
 <div className="rotate-hint">{t('Ruota il dispositivo per una migliore esperienza','Rotate your device for a better experience')}</div>
 {import.meta.env.DEV&&<details className="debug"><summary>DEBUG</summary>{hud.fps} FPS · {hud.state} · {settings.quality}<br/>coordinator / guards / workers</details>}
 {hud.state==='PAUSED'&&<div className="modal"><div className="modal-card"><span className="eyebrow">ENCRYPTED CHANNEL / HOLD</span><h2>{t('Missione in pausa','Mission paused')}</h2><p>{t('Prenditi un respiro. Docky ti aspetta.','Take a breath. Docky is waiting.')}</p><button className="primary" onClick={()=>commands.current?.pause()}><Play size={18}/>{t('Riprendi missione','Resume mission')}</button><button onClick={onExit}><House size={18}/>{t('Torna alla base','Return to base')}</button></div></div>}
 <span className="sr-only"><Volume2/>Web Audio</span>
 </div>;
}


