export class AudioManager {
 private context:AudioContext|null=null;
 private musicGain:GainNode|null=null;
 private timer:ReturnType<typeof setInterval>|null=null;
 private step=0;private muted=false;
 constructor(private music:number,private sfx:number){}
 start(){try{if(this.context){void this.context.resume();return;}const c=this.context=new AudioContext();void c.resume();this.musicGain=c.createGain();this.musicGain.gain.value=this.music*.75;this.musicGain.connect(c.destination);
 const sequence=[55,55,65.41,55,58.27,55,73.42,65.41];
 this.timer=setInterval(()=>{if(c.state!=='running')return;const t=c.currentTime;const note=sequence[this.step++%sequence.length];for(const [frequency,volume,duration] of [[note,.28,.65],[note*2.01,.09,1.1],[note*3,.055,.9]]){const o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=frequency;g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(volume,t+.035);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g).connect(this.musicGain!);o.start(t);o.stop(t+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};}},420);
 }catch{}}
 setMuted(muted:boolean){this.muted=muted;if(this.context&&this.musicGain)this.musicGain.gain.setTargetAtTime(muted?0:this.music*.75,this.context.currentTime,.03);}
 play(kind:'shot'|'reload'|'scan'|'breath'|'success'|'failed') {try{this.start();const c=this.context!,t=c.currentTime;
 if(kind==='shot'){
 const buffer=c.createBuffer(1,c.sampleRate*.65,c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(c.sampleRate*.09));
 const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();source.buffer=buffer;filter.type='lowpass';filter.frequency.setValueAtTime(8500,t);filter.frequency.exponentialRampToValueAtTime(500,t+.4);gain.gain.value=this.sfx*.8;source.connect(filter).connect(gain).connect(c.destination);source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
 const boom=c.createOscillator(),bg=c.createGain();boom.frequency.setValueAtTime(150,t);boom.frequency.exponentialRampToValueAtTime(35,t+.2);bg.gain.setValueAtTime(this.sfx*.45,t);bg.gain.exponentialRampToValueAtTime(.001,t+.3);boom.connect(bg).connect(c.destination);boom.start();boom.stop(t+.35);boom.onended=()=>{boom.disconnect();bg.disconnect();};return;
 }
 const o=c.createOscillator(),g=c.createGain();const f={reload:440,scan:700,breath:220,success:880,failed:130}[kind];o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(30,f/3),t+.22);g.gain.setValueAtTime(this.sfx*.1,t);g.gain.exponentialRampToValueAtTime(.001,t+.3);o.connect(g).connect(c.destination);o.start();o.stop(t+.32);o.onended=()=>{o.disconnect();g.disconnect();};}catch{}}
 suspend(){void this.context?.suspend();}
 resume(){void this.context?.resume();}
 dispose(){if(this.timer)clearInterval(this.timer);this.timer=null;void this.context?.close();this.context=null;}
}
