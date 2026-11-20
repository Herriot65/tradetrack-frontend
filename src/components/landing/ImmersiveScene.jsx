import { useEffect, useRef, useState } from 'react';
import { BarChart3, BookOpen, Pause, Play, Sparkles } from 'lucide-react';
import { translate as t } from '@/i18n/language';

export default function ImmersiveScene() {
  const root = useRef(null);
  const frame = useRef(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const node = root.current;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true;
    const update = () => {
      node.dataset.running = String(visible && !document.hidden && !paused && !media.matches);
      node.style.setProperty('--look-x', '0deg');
      node.style.setProperty('--look-y', '0deg');
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(node);
    media.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    update();
    return () => { observer.disconnect(); media.removeEventListener('change', update); document.removeEventListener('visibilitychange', update); cancelAnimationFrame(frame.current); };
  }, [paused]);
  const reset = () => {
    cancelAnimationFrame(frame.current);
    root.current.style.setProperty('--look-x', '0deg');
    root.current.style.setProperty('--look-y', '0deg');
  };
  const move = event => {
    if (event.pointerType !== 'mouse' || root.current.dataset.running !== 'true') return;
    const bounds = root.current.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      root.current.style.setProperty('--look-x', `${-y * 12}deg`);
      root.current.style.setProperty('--look-y', `${x * 14}deg`);
    });
  };
  return <div ref={root} className="nx-immersive-scene" onPointerMove={move} onPointerLeave={reset}>
    <button type="button" className="nx-motion-toggle" aria-label={t(paused ? 'Play animation' : 'Pause animation')} aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={12} /> : <Pause size={12} />}<span>{t('Motion')}</span></button>
    <div className="nx-scene-art" aria-hidden="true">
      <div className="nx-orbit-glow" />
      <div className="nx-orbit-camera">
        <div className="nx-orbit-system">
          <div className="nx-orbit-ring nx-ring-one"><i /></div>
          <div className="nx-orbit-ring nx-ring-two"><i /></div>
          <div className="nx-orbit-ring nx-ring-three"><i /></div>
        </div>
        <div className="nx-core-float"><div className="nx-brand-core">
          <div className="nx-core-face nx-core-front"><img src="/nexora.png" alt="" /></div>
          <div className="nx-core-face nx-core-back" /><div className="nx-core-face nx-core-left" /><div className="nx-core-face nx-core-right" /><div className="nx-core-face nx-core-top" /><div className="nx-core-face nx-core-bottom" />
        </div></div>
        <div className="nx-float-panel nx-panel-chart"><span><BarChart3 size={14}/>{t('Performance analytics')}</span><svg viewBox="0 0 200 65" fill="none"><path d="M0 60H200M0 30H200" stroke="currentColor" opacity=".12"/><path className="nx-chart-trace" d="M0 53L18 48L34 54L52 34L70 40L90 22L112 30L130 19L145 26L165 9L180 16L200 2" stroke="currentColor" strokeWidth="2" pathLength="1"/></svg></div>
        <div className="nx-float-panel nx-panel-journal"><BookOpen size={17}/><div><strong>{t('Your trading workspace')}</strong><span>{t('Your process, connected')}</span></div><i /></div>
        <div className="nx-float-panel nx-panel-coach"><Sparkles size={15}/><span>{t('AI Coach')}</span></div>
      </div>
      <div className="nx-orbit-floor" />
    </div>
    <p className="nx-scene-caption">{t('Journal. Understand. Evolve.')}</p>
  </div>;
}
