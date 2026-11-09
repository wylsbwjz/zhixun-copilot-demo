import type { ReactNode } from 'react';
import IndustrialArt from './IndustrialArt';

export default function SceneView({children,label,height}:{children?:ReactNode;label?:string;height?:number|string}) {
  return <div className="scene scene-illustrated" style={{height:height??'100%',minHeight:260}}>
    <IndustrialArt />
    <div className="scene-caption">{label ? <span>{label}</span> : null}<span>厂区示意 · 非实时画面</span></div>
    {children}
  </div>;
}
