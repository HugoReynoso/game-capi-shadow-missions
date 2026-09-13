export type NPCType = 'TARGET'|'HOSTILE'|'CIVILIAN';
export type MissionState = 'LOADING'|'PLAYING'|'PAUSED'|'SUCCESS'|'FAILED';
export interface MissionResult {success:boolean; reason:'target'|'civilian'|'wrong'|'timeout'; time:number; shots:number; hits:number; accuracy:number; stars:number; reward:number}
export function resultFor(reason:MissionResult['reason'],time:number,shots:number,hits:number):MissionResult {
 const success=reason==='target'; const accuracy=shots?Math.round(hits/shots*100):0;
 const stars=success?(accuracy>=70&&time<90?3:accuracy>=60?2:1):0;
 return {success,reason,time,shots,hits,accuracy,stars,reward:success?1000:0};
}
export function hitOutcome(type:NPCType):MissionResult['reason'] {return type==='TARGET'?'target':type==='CIVILIAN'?'civilian':'wrong';}
