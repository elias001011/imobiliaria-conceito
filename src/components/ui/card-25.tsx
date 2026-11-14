import { forwardRef, type CSSProperties, type MouseEventHandler, type ReactNode } from 'react';
import { IconArrow } from '../Icons';

export interface Stat { icon: ReactNode; label: string; }
export interface AnimatedHikeCardProps {
  title: string; images: string[]; stats: Stat[]; description: string; href: string;
  className?: string; label?: string; onClick?: MouseEventHandler<HTMLAnchorElement>;
}
// Componente do exemplo adaptado à tipografia, aos ícones e ao CSS nativo do projeto.
export const AnimatedHikeCard = forwardRef<HTMLAnchorElement, AnimatedHikeCardProps>(
  ({title,images,stats,description,href,className='',label,onClick},ref) => <a ref={ref} href={href} onClick={onClick} className={`property-link ${className}`} aria-label={`Ver imóvel: ${title}`}>
    {label && <p className="property-label mono">{label}</p>}
    <div className="property-heading"><h3>{title}</h3><span className="property-arrow" aria-hidden="true"><IconArrow /></span></div>
    <div className="property-images" role="group" aria-label="Fotografias ilustrativas do imóvel">
      {images.map((src,index) => <div key={`${src}-${index}`} className="property-image" style={{'--stack-x':`${index*13}%`,'--spread-x':`${index*53}%`,'--stack-r':`${index*7-3}deg`,'--spread-r':`${index*9-4}deg`,zIndex:images.length-index} as CSSProperties}>
        <img src={src} alt={`${title} — foto ${index+1}${index===0 && label?.includes('360') ? ', panorâmica 360°' : ''}`} loading="lazy" decoding="async" width="640" height="480"/>
      </div>)}
    </div>
    <div className="property-stats mono">{stats.map((stat,index) => <span key={index}>{stat.icon}{stat.label}</span>)}</div>
    <p className="property-description">{description}</p>
    <p className="property-location mono">Localização fica aqui</p>
  </a>,
);
AnimatedHikeCard.displayName = 'AnimatedHikeCard';
