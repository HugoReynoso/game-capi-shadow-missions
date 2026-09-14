import {Vector3} from '@babylonjs/core/Maths/math.vector';
import type {FreeCamera} from '@babylonjs/core/Cameras/freeCamera';

export const MAX_ZOOM = 8;
export const clamp = (value:number,min:number,max:number) => Math.max(min,Math.min(max,value));

/** One camera controller owns mouse, multi-touch, joystick and keyboard aim. */
export class SniperAimController {
  yaw:number;
  pitch:number;
  zoom=1;
  private stick={x:0,y:0};
  private keys=new Set<string>();
  private pointers=new Map<number,{x:number;y:number}>();
  private start={x:0,y:0};
  private moved=false;
  private pinching=false;
  private pinchDistance=0;
  private recoil=0;
  private cleanups:Array<()=>void>=[];

  constructor(private canvas:HTMLCanvasElement,private camera:FreeCamera,private sensitivity:number,private playing:()=>boolean,private onZoom:()=>void) {
    this.yaw=camera.rotation.y;
    this.pitch=camera.rotation.x;
    const down=(event:PointerEvent)=>{
      if(!playing() || (event.pointerType==='mouse'&&event.button!==0))return;
      this.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      canvas.setPointerCapture(event.pointerId);
      if(this.pointers.size===1){this.start={x:event.clientX,y:event.clientY};this.moved=false;this.pinching=false;}
      if(this.pointers.size===2){this.pinching=true;this.pinchDistance=this.distance();}
    };
    const move=(event:PointerEvent)=>{
      const old=this.pointers.get(event.pointerId);
      if(!old||!playing())return;
      this.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if(this.pointers.size===2){
        const next=this.distance();
        if(this.pinchDistance>0)this.setZoom(this.zoom*next/this.pinchDistance);
        this.pinchDistance=next;
        return;
      }
      if(this.pinching)return;
      const dx=event.clientX-old.x,dy=event.clientY-old.y;
      if(Math.hypot(event.clientX-this.start.x,event.clientY-this.start.y)>4)this.moved=true;
      // Scale by the actual viewport and lens, so dragging works at every screen size.
      const scale=this.camera.fov/Math.max(180,canvas.clientHeight)*this.sensitivity;
      this.rotate(dx*scale,dy*scale);
    };
    const up=(event:PointerEvent)=>{
      if(!this.pointers.has(event.pointerId))return;
      if(playing()&&!this.moved&&!this.pinching&&event.type==='pointerup')this.pointAt(event.clientX,event.clientY);
      this.pointers.delete(event.pointerId);
    };
    const wheel=(event:WheelEvent)=>{event.preventDefault();if(playing())this.setZoom(this.zoom+(event.deltaY<0?1:-1));};
    const keyDown=(event:KeyboardEvent)=>{
      if(['KeyW','KeyA','KeyS','KeyD','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.code)){
        event.preventDefault();if(playing())this.keys.add(event.code);
      }
    };
    const keyUp=(event:KeyboardEvent)=>{this.keys.delete(event.code);};
    const blur=()=>this.clear();
    canvas.addEventListener('pointerdown',down);
    canvas.addEventListener('pointermove',move);
    canvas.addEventListener('pointerup',up);
    canvas.addEventListener('pointercancel',up);
    canvas.addEventListener('wheel',wheel,{passive:false});
    window.addEventListener('keydown',keyDown);
    window.addEventListener('keyup',keyUp);
    window.addEventListener('blur',blur);
    this.cleanups.push(()=>{
      canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);
      canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);
      canvas.removeEventListener('wheel',wheel);window.removeEventListener('keydown',keyDown);
      window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',blur);
    });
  }
  private distance(){const p=[...this.pointers.values()];return p.length===2?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0;}
  rotate(x:number,y:number){this.yaw=clamp(this.yaw+x,-1.25,1.25);this.pitch=clamp(this.pitch+y,-.4,.85);}
  pointAt(x:number,y:number){
    const r=this.canvas.getBoundingClientRect();
    const nx=(x-r.left)/r.width*2-1,ny=1-(y-r.top)/r.height*2;
    const lens=Math.tan(this.camera.fov/2);
    const direction=this.camera.getDirection(new Vector3(nx*lens*r.width/r.height,ny*lens,1)).normalize();
    this.yaw=clamp(Math.atan2(direction.x,direction.z),-1.25,1.25);
    this.pitch=clamp(-Math.atan2(direction.y,Math.hypot(direction.x,direction.z)),-.4,.85);
  }
  setZoom(value:number){this.zoom=clamp(value,1,MAX_ZOOM);this.onZoom();}
  setStick(x:number,y:number){this.stick={x:clamp(x,-1,1),y:clamp(y,-1,1)};}
  kick(){this.recoil=.012;}
  clear(){this.pointers.clear();this.keys.clear();this.stick={x:0,y:0};}
  update(dt:number,time:number,steady:boolean,reducedMotion:boolean){
    if(!this.playing())return;
    const horizontal=Number(this.keys.has('KeyD')||this.keys.has('ArrowRight'))-Number(this.keys.has('KeyA')||this.keys.has('ArrowLeft'));
    const vertical=Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'))-Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'));
    this.rotate((horizontal+this.stick.x)*dt*.5*this.sensitivity/this.zoom,(vertical+this.stick.y)*dt*.5*this.sensitivity/this.zoom);
    const smoothing=1-Math.exp(-dt*24);
    const sway=reducedMotion?0:steady?.00004:.0005;
    this.camera.rotation.y+=(this.yaw+Math.sin(time*1.3)*sway-this.camera.rotation.y)*smoothing;
    this.camera.rotation.x+=(this.pitch+Math.cos(time*1.7)*sway-this.recoil-this.camera.rotation.x)*smoothing;
    this.camera.fov+=(.72/this.zoom-this.camera.fov)*smoothing;
    this.recoil*=Math.exp(-dt*15);
  }
  dispose(){this.cleanups.forEach(f=>f());this.clear();}
}
