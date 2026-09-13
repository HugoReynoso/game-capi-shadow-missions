export class AudioManager {
 private context:AudioContext|null=null;
 private ambient:OscillatorNode|null=null;
 private gain:GainNode|null=null;
 constructor(private music:number,private sfx:number){}
 start(){try {this.context ||= new AudioContext(); void this.context.resume(); if(this.ambient)return; this.ambient=this.context.createOscillator();this.gain=this.context.createGain();this.ambient.type='sine';this.ambient.frequency.value=55;this.gain.gain.value=this.music*.05;this.ambient.connect(this.gain).connect(this.context.destination);this.ambient.start();}catch{}}
 play(kind:'shot'|'reload'|'scan'|'breath'|'success'|'failed'){try{this.start();const c=this.context!;const o=c.createOscillator();const g=c.createGain();o.type=kind==='shot'?'sawtooth':'sine';const f={shot:100,reload:440,scan:700,breath:220,success:880,failed:130}[kind];o.frequency.setValueAtTime(f,c.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(30,f/3),c.currentTime+.22);g.gain.setValueAtTime(this.sfx*(kind==='shot'?.22:.1),c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.3);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+.32);}catch{}}
 suspend(){void this.context?.suspend();}
 resume(){void this.context?.resume();}
 dispose(){void this.context?.close();this.context=null;}
}
