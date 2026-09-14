import type { Language } from '../data/missions';
export interface Settings {language: Language; music: number; sfx: number; sensitivity: number; vibration: boolean; leftHanded: boolean; reducedShake: boolean; subtitles: boolean; quality:'AUTO'|'LOW'|'MEDIUM'|'HIGH'}
export interface Progress {stars: number; bestTime: number | null; bestAccuracy: number; credits: number; completed:Record<number,{stars:number;time:number;accuracy:number}>; settings: Settings}
export const defaults: Progress = {stars:0,bestTime:null,bestAccuracy:0,credits:0,completed:{},settings:{language:'it',music:0.2,sfx:0.6,sensitivity:1,vibration:true,leftHanded:false,reducedShake:false,subtitles:true,quality:'AUTO'}};
const key = 'capi-save-v1';
const clamp = (v:unknown,min:number,max:number,fallback:number) => typeof v === 'number' && Number.isFinite(v) ? Math.min(max,Math.max(min,v)):fallback;
export function load(): Progress {
 try { const p=JSON.parse(localStorage.getItem(key)||'null'); if(!p || typeof p !== 'object') return structuredClone(defaults); const s=p.settings||{}; const completed:Progress['completed']={}; for(let id=1;id<=10;id++){const r=p.completed?.[id];if(r&&typeof r.stars==='number'&&r.stars>=1)completed[id]={stars:Math.floor(clamp(r.stars,1,3,1)),time:clamp(r.time,0,90,90),accuracy:clamp(r.accuracy,0,100,0)};else break;} if(!p.completed&&p.stars>0)completed[1]={stars:Math.floor(clamp(p.stars,1,3,1)),time:clamp(p.bestTime,0,90,90),accuracy:clamp(p.bestAccuracy,0,100,0)};
 return {completed,stars:Object.values(completed).reduce((sum,r)=>sum+r.stars,0),bestTime:p.bestTime===null?null:clamp(p.bestTime,0,90,90),bestAccuracy:clamp(p.bestAccuracy,0,100,0),credits:clamp(p.credits,0,1000000,0),settings:{language:s.language==='en'?'en':'it',music:clamp(s.music,0,1,.2),sfx:clamp(s.sfx,0,1,.6),sensitivity:clamp(s.sensitivity,.3,2,1),vibration:typeof s.vibration==='boolean'?s.vibration:true,leftHanded:s.leftHanded===true,reducedShake:s.reducedShake===true,subtitles:s.subtitles!==false,quality:['LOW','MEDIUM','HIGH'].includes(s.quality)?s.quality:'AUTO'}};
 } catch {return structuredClone(defaults);}
}
export function save(progress:Progress): boolean {try {localStorage.setItem(key,JSON.stringify(progress));return true;}catch{return false;}}
