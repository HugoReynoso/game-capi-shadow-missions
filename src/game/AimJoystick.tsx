import {useRef,useState} from 'react';
import {Move} from 'lucide-react';
export function AimJoystick({onMove,label}:{onMove:(x:number,y:number)=>void;label:string}){
  const pointer=useRef<number|null>(null);
  const [position,setPosition]=useState({x:0,y:0});
  function update(event:React.PointerEvent<HTMLDivElement>){
    if(pointer.current!==event.pointerId)return;
    const rect=event.currentTarget.getBoundingClientRect();
    const x=(event.clientX-rect.left-rect.width/2)/32,y=(event.clientY-rect.top-rect.height/2)/32;
    const length=Math.max(1,Math.hypot(x,y));
    const next={x:x/length,y:y/length};setPosition(next);onMove(next.x,next.y);
  }
  function reset(){pointer.current=null;setPosition({x:0,y:0});onMove(0,0);}
  return <div className="aim-joystick" aria-label={label} onPointerDown={e=>{if(pointer.current!==null)return;pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);update(e);}} onPointerMove={update} onPointerUp={reset} onPointerCancel={reset} onLostPointerCapture={reset}><div className="joystick-rings"/><div className="joystick-thumb" style={{transform:`translate(${position.x*30}px,${position.y*30}px)`}}><Move size={19}/></div><span>{label}</span></div>;
}
