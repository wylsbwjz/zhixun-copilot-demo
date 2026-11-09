import { useId } from 'react';

/** 自制工业场景示意。业务标签和可点击识别框由调用方渲染。 */
export default function IndustrialArt({ kind, safe = false }: { kind?: string; safe?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const viewBox = kind ? '195 185 640 430' : '0 0 1000 680';
  return <svg className="scene-art" viewBox={viewBox} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
<defs><linearGradient id={id+'bg'} x2="0" y2="100%"><stop stopColor="#172a38"/><stop offset="1" stopColor="#0b1520"/></linearGradient><linearGradient id={id+'tank'}><stop stopColor="#223a4a"/><stop offset=".45" stopColor="#6a8593"/><stop offset=".7" stopColor="#3d596c"/><stop offset="1" stopColor="#213645"/></linearGradient><pattern id={id+'grid'} width="60" height="35" patternUnits="userSpaceOnUse" patternTransform="skewY(-22)"><path d="M60 0H0V35" fill="none" stroke="#253e4e" strokeWidth="1"/></pattern></defs><rect width="1000" height="680" fill={'url(#'+id+'bg)'}/><rect width="1000" height="680" fill={'url(#'+id+'grid)'} opacity=".6"/><path d="M-80 530 900 165M100 720 1080 355" stroke="#354957" strokeWidth="74"/><path d="M-80 530 900 165M100 720 1080 355" stroke="#a4a26b" strokeWidth="2" strokeDasharray="16 12"/>
{[0,1,2].map((r)=><g key={r} transform={`translate(${90+r*242},${200-r*53})`}><path d="M0 55 112 13 214 52 103 96Z" fill="#3d596a" stroke="#7594a4"/><path d="M0 55V270L103 312V96Z" fill="#233b4a" stroke="#4b6574"/><path d="M103 96 214 52V266L103 312Z" fill="#172c3c" stroke="#496573"/>{[0,1,2,3,4].map(i=><g key={i}><path d={`M${15+i*17} ${72+i*7}V${258+i*7}`} stroke="#5a7584" strokeWidth="7"/><path d={`M116 ${117+i*32} 198 ${85+i*32}`} stroke="#486c80" strokeWidth="8"/></g>)}<path d="M12 270 100 306 207 265" fill="none" stroke="#83a2b2" strokeWidth="3"/></g>)}
{[0,1,2].map((n)=><g key={n} transform={`translate(${655+n*95},${255+n*38})`}><path d="M0 30V180C0 212 80 212 80 180V30Z" fill={'url(#'+id+'tank)'} stroke="#6a8b9c"/><ellipse cx="40" cy="30" rx="40" ry="18" fill="#6b8795" stroke="#a0b3bc"/><path d="M10 85Q40 102 70 85M10 148Q40 164 70 148" fill="none" stroke="#a1b1b5" strokeWidth="3"/><path d="M37 10V-40H-50" stroke="#859ead" strokeWidth="9" fill="none"/></g>)}
<g fill="none" strokeLinecap="round"><path d="M78 300V432L345 535 570 447V335" stroke="#638493" strokeWidth="15"/><path d="M100 280V408L346 504 549 427V310" stroke="#2e4a61" strokeWidth="12"/><path d="M128 315V385L345 472 518 402V335" stroke="#bd9b55" strokeWidth="7"/><path d="M0 585 255 485M540 680V555L949 400" stroke="#476a7b" strokeWidth="15"/></g>

    {[[200,330],[380,215],[696,280],[820,465]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r="6" fill="#97dd40"/><circle cx={x} cy={y} r="13" fill="none" stroke="#97dd40" opacity=".3"/></g>)}
    {kind && <Subject kind={kind} safe={safe}/>}
  </svg>;
}

function Subject({kind,safe}:{kind:string;safe:boolean}) {
  const signal = safe ? '#97dd40' : '#ffad6b';
  if (kind === 'intrusion') return <g transform="translate(520 449) scale(1.5)">
    <ellipse cy="38" rx="27" ry="10" fill="#101a22" opacity=".8"/>
    <g transform={safe?'translate(-31 -13)':undefined}><circle cy="-26" r="11" fill="#b5c8ce"/>
    {safe && <path d="M-14 -28Q0-48 14-28Z" fill="#e1c773"/>}
    <path d="M-13-14H13L20 14H9V35H1L-2 15-8 35H-16V13Z" fill={safe?'#4db1ff':'#c0cbd0'}/></g>
    <path d="M-50 9 48-27" stroke="#dcb973" strokeWidth="3" strokeDasharray="8 5"/>
  </g>;
  if (kind === 'obstacle' || kind === 'fire') return <g transform="translate(515 441)">
    <path d="M-55 20 49-18 95 0-13 42Z" fill="none" stroke="#dcb973" strokeWidth="3" strokeDasharray="9 5"/>
    {(!safe || kind==='fire') && <g transform={safe?'translate(78 -33)':undefined}>
    <path d="M-30 0 15-17 52-4 7 14Z" fill="#9b7859"/><path d="M-30 0V27L7 41V14Z" fill="#665443"/><path d="M7 14 52-4V24L7 41Z" fill="#483e36"/>
    {kind==='fire'&&<path d="M11 16 36 6" stroke={signal} strokeWidth="4"/>}</g>}
  </g>;
  if (kind === 'sensor') return <g transform="translate(516 416)">
    <path d="M-27 3 14-12 41-1 0 14Z" fill="#8aa3af"/><path d="M-27 3V39L0 50V14Z" fill="#3d5463"/><path d="M0 14 41-1V35L0 50Z" fill="#273b48"/>
    <circle cx="21" cy="25" r="6" fill={signal}/><path d="M4 49V69L52 87" fill="none" stroke="#91a4ad" strokeWidth="4"/>
  </g>;
  return <g transform="translate(521 435)">
    <path d="M-60 20 49-20" stroke="#829ca8" strokeWidth="18" strokeLinecap="round"/>
    <path d="M-12-2 4 5M-6-13 10-6" stroke="#c6d4d9" strokeWidth="10"/>
    <circle cx="5" cy="-18" r="15" fill="#253a49" stroke={signal} strokeWidth="3"/>
    <path d={safe?'M0-17 4-13 12-22':'M5-23V-16M5-12v1'} fill="none" stroke={signal} strokeWidth="2.5" strokeLinecap="round"/>
    {!safe && (kind==='leak'?<path d="M3 15Q-12 36 3 41Q18 36 3 15Z" fill="#64c9ed"/>:kind==='noise'?<path d="M35-24Q58-15 43 8M43-37Q76-22 58 14" fill="none" stroke={signal} strokeWidth="3"/>:null)}
  </g>;
}
