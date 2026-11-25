import type { ElementType } from 'react';
import './text-animate.css';

type Props = { children: string; as?: ElementType; className?: string; delay?: number };

export function TextAnimate({ children, as: Tag = 'span', className, delay = 0 }: Props) {
  const words = children.split(/(\s+)/);
  let index = 0;
  return <Tag className={className} aria-label={children}>
    {words.map((part, i) => part.trim() ? <span aria-hidden="true" className="kavu-blur-word" style={{ animationDelay: `${delay + index++ * 55}ms` }} key={i}>{part}</span> : part)}
  </Tag>;
}
