import type {Mission} from '../data/missions';
import {useEffect,useRef,useState} from 'react';
import {Crosshair,Pause,Play,RotateCcw,Volume2,Wind,PawPrint,Plus,Minus,House} from 'lucide-react';
import {MAX_ZOOM} from './aim';
import {createMissionRuntime,type Commands} from './runtime';
import {AimJoystick} from './AimJoystick';
import type {MissionState,MissionResult} from './rules';
import type {Settings} from '../services/save';
interface Props {mission:Mission;settings:Settings;onResult:(r:MissionResult)=>void;onExit:()=>void}
const initial={time:90,ammo:3,zoom:1,breath:0,scan:0,breathing:false,scanning:false,reloading:false,reloadSeconds:0,state:'LOADING' as MissionState,fps:0,distance:0,heading:270,models:false,remaining:1,muted:false,exposed:false};
export default function GameCanvas({settings,onResult,onExit,mission}:Props){
 const canvas=useRef<HTMLCanvasElement>(null);const commands=useRef<Commands|null>(null);const [hud,setHud]=useState(initial);const [error,setError]=useState(false);const [flash,setFlash]=useState(false);const [snapshot,setSnapshot]=useState('');const [feedback,setFeedback]=useState<'hit'|'miss'|'wounded'|null>(null);const language=settings.language;const t=(it:string,en:string)=>language==='it'?it:en;
 useEffect(()=>{
   let runtime:ReturnType<typeof createMissionRuntime>;
   try{runtime=createMissionRuntime(canvas.current!,settings,{hud:setHud,result:onResult,flash:setFlash,feedback:setFeedback,snapshot:setSnapshot},mission);commands.current=runtime.commands;}
   catch(error){if(import.meta.env.DEV)console.error(error);setError(true);return;}
   return()=>{commands.current=null;runtime.dispose();};
 },[settings,onResult,mission]);
 if(error)return <div className="modal"><h2>{t('3D non disponibile','3D unavailable')}</h2><p>{t('Attiva l’accelerazione hardware o prova un browser con WebGL.','Enable hardware acceleration or try a WebGL browser.')}</p><button onClick={onExit}>{t('Torna alla base','Back to base')}</button></div>;
 const playing=hud.state==='PLAYING';
 return <div className={`game ${settings.leftHanded?'left-handed':''}`}>
 <canvas ref={canvas} aria-label={t('Porto 3D. Tocca per puntare, trascina per esplorare.','3D harbor. Tap to aim, drag to look around.')}/>
 <div className="game-top"><div><span className="eyebrow">OP. {String(mission.id).padStart(2,'0')} / {mission.name[language]}</span><strong>{`${hud.remaining} ${t('obiettivi rimasti','targets remaining')}`}</strong></div><div className={hud.time<20?'timer danger':'timer'}>{Math.floor(hud.time/60).toString().padStart(2,'0')}:{Math.floor(hud.time%60).toString().padStart(2,'0')}</div><button className="icon-button" aria-label={t('Pausa','Pause')} onClick={()=>commands.current?.pause()}><Pause/></button></div>
 <button className="music-toggle" aria-label={t('Silenzia musica','Mute music')} aria-pressed={hud.muted} onClick={()=>commands.current?.mute()}><Volume2 size={15}/>{hud.muted?'MUSIC OFF':'MUSIC ON'}</button>{hud.exposed&&<div className="incoming-fire"><strong>{t('SCOPERTA · FUOCO NEMICO','EXPOSED · INCOMING FIRE')}</strong><span>{t('Sei stata colpita','You have been hit')}</span></div>}
 <div className="compass">{hud.heading-30} <span>│</span> {hud.heading-15} <span>│</span> <b>{hud.heading}°</b> <span>│</span> {hud.heading+15} <span>│</span> {hud.heading+30}</div>
 {hud.zoom>1&&<div className="scope-mask"/>}<div className={`crosshair ${flash?'shot':''}`}><i/><i/><span/></div>
 <div className="scope-info">SR-01 SCOUT <span>{hud.zoom.toFixed(1)}×</span><small>{hud.distance>0?`${hud.distance} m`:'— m'}</small></div>
 {feedback&&<div className={`shot-feedback ${feedback}`}>{snapshot&&<img src={snapshot} alt={t('Ultimo colpo','Last shot')}/>}<Crosshair size={28}/><span>{feedback==='hit'?t('BERSAGLIO ABBATTUTO','TARGET DOWN'):feedback==='wounded'?t('FERITO · ANCORA ATTIVO','WOUNDED · STILL ACTIVE'):t('COLPO A VUOTO','MISSED')}</span></div>}
 {hud.scanning&&<div className="scan-line"/>}
 {settings.subtitles&&<div className="game-hint">{hud.scanning?t('Docky: una traccia vicino alle casse…','Docky: a scent near the crates…'):hud.time>76?t('Tocca per puntare · Trascina o usa il joystick · Pizzica per zoom','Tap to aim · Drag or use the joystick · Pinch to zoom'):t('Cerca le fasce rosse. Proteggi i civili.','Find the red armbands. Protect civilians.')}</div>}
 <div className="aim-control"><AimJoystick key={hud.state} label={t('MIRA','AIM')} onMove={(x,y)=>commands.current?.stick(x,y)}/></div>
 <div className="utility"><button disabled={!playing||hud.breath>0} onClick={()=>commands.current?.breath()} className={hud.breathing?'active':''}><Wind/><span>{hud.breathing?t('STABILE','STEADY'):hud.breath>0?`${hud.breath}s`:t('RESPIRO','BREATH')}</span></button><button disabled={!playing||hud.scan>0} onClick={()=>commands.current?.scan()} className={hud.scanning?'active':''}><PawPrint/><span>{hud.scan>0?`${hud.scan}s`:'DOCKY SCAN'}</span></button></div>
 {hud.reloading&&<div className="reload-countdown" role="status"><strong>{hud.reloadSeconds}</strong><span>{t('RICARICA IN CORSO','RELOADING')}</span><small>{t('Il tempo missione continua','Mission timer keeps running')}</small></div>}<div className="fire-controls"><div className="zoom-controls"><button aria-label="Zoom +" disabled={!playing||hud.zoom>=MAX_ZOOM} onClick={()=>commands.current?.zoom(1)}><Plus/></button><span>{hud.zoom.toFixed(1)}×</span><button aria-label="Zoom −" disabled={!playing||hud.zoom<=1} onClick={()=>commands.current?.zoom(-1)}><Minus/></button></div><button className="fire" disabled={!playing||hud.ammo===0||hud.reloading} onClick={()=>commands.current?.fire()} aria-label={t('Spara','Fire')}><Crosshair size={30}/><span>{t('SPARA','FIRE')}</span></button><button className="reload" onClick={()=>commands.current?.reload()} disabled={!playing||hud.ammo===3||hud.reloading}><RotateCcw size={18}/>{hud.reloading?`${t('Ricarica','Reload')} ${hud.reloadSeconds}s`:`${hud.ammo} / 3`}</button></div>
 <div className="rotate-hint">{t('Ruota il dispositivo per una migliore esperienza','Rotate your device for a better experience')}</div>
 {import.meta.env.DEV&&<details className="debug"><summary>DEBUG</summary>{hud.fps} FPS · {hud.state} · {settings.quality}<br/>{hud.models?'GLB / skinned actors':'fallback / loading'} · {hud.distance} m</details>}
 {hud.state==='LOADING'&&<div className="modal"><div className="loading"><Crosshair className="spin"/><span>{t('Preparazione del porto e dei personaggi…','Preparing the harbor and characters…')}</span></div></div>}
 {hud.state==='PAUSED'&&<div className="modal"><div className="modal-card"><span className="eyebrow">ENCRYPTED CHANNEL / HOLD</span><h2>{t('Missione in pausa','Mission paused')}</h2><p>{t('Prenditi un respiro. Docky ti aspetta.','Take a breath. Docky is waiting.')}</p><button className="primary" onClick={()=>commands.current?.pause()}><Play size={18}/>{t('Riprendi missione','Resume mission')}</button><button onClick={onExit}><House size={18}/>{t('Torna alla base','Return to base')}</button></div></div>}
 <span className="sr-only"><Volume2/>Web Audio</span>
 </div>;
}
