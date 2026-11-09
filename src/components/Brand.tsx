import {Link} from 'react-router-dom';
import mark from '../assets/zhixun-mark.svg?url';

export function BrandMark({size = 32}: {size?: number}) {
  return <img src={mark} alt="" width={size} height={size}/>;
}

export default function Brand() {
  return <Link to="/" className="brand-lockup" aria-label="智巡 Copilot · 返回起始页">
    <BrandMark/>
    <span>智巡 <small>SITEGUARD COPILOT</small></span>
  </Link>;
}
