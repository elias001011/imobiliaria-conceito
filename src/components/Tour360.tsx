import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { IconClose } from './Icons';

export default function Tour360({onFechar}: {onFechar: () => void}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<{zoom: (delta: number) => void; reset: () => void} | null>(null);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
    document.body.classList.add('tour-aberto');
    return () => { document.body.classList.remove('tour-aberto'); };
  }, []);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let failed = false;
    let renderer: THREE.WebGLRenderer | undefined;
    let texture: THREE.Texture | undefined;
    let geometry: THREE.SphereGeometry | undefined;
    let material: THREE.MeshBasicMaterial | undefined;
    let resize: ResizeObserver | undefined;
    const cleanup: (() => void)[] = [];
    const fail = () => {
      if (disposed) return;
      failed = true;
      controls.current = null;
      setError(true);
    };
    try {
      const r = new THREE.WebGLRenderer({antialias:true, powerPreference:'low-power'});
      renderer = r;
      r.outputColorSpace = THREE.SRGBColorSpace;
      r.domElement.setAttribute('aria-hidden','true');
      el.append(r.domElement);
      const lost = (event: Event) => { event.preventDefault(); fail(); };
      r.domElement.addEventListener('webglcontextlost', lost);
      cleanup.push(() => r.domElement.removeEventListener('webglcontextlost', lost));
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75,1,0.1,30);
      let yaw = 0, pitch = 0;
      const render = () => {
        if(disposed || failed) return;
        camera.rotation.order = 'YXZ';
        camera.rotation.set(pitch,yaw,0);
        camera.updateProjectionMatrix();
        el.dataset.yaw = yaw.toFixed(3);
        r.render(scene,camera);
      };
      const measure = () => {
        const w = Math.max(1,el.clientWidth), h = Math.max(1,el.clientHeight);
        r.setPixelRatio(Math.min(devicePixelRatio || 1,1.5,Math.sqrt(1_200_000/(w*h))));
        r.setSize(w,h,false);
        camera.aspect = w/h; render();
      };
      geometry = new THREE.SphereGeometry(10,64,40);
      geometry.scale(-1,1,1);
      const panoramaMaterial = new THREE.MeshBasicMaterial();
      material = panoramaMaterial;
      scene.add(new THREE.Mesh(geometry,panoramaMaterial));
      texture = new THREE.TextureLoader().load('/panorama/interior-360.webp?v=2', loaded => {
        if(disposed || failed) { loaded.dispose(); return; }
        loaded.colorSpace = THREE.SRGBColorSpace;
        panoramaMaterial.map = loaded;
        panoramaMaterial.needsUpdate = true;
        setReady(true); render();
      },undefined,fail);
      resize = new ResizeObserver(measure); resize.observe(el); measure();
      const zoom = (delta: number) => {camera.fov = Math.max(40,Math.min(95,camera.fov+delta)); render();};
      controls.current = {zoom,reset: () => {yaw=0;pitch=0;camera.fov=75;render();}};
      let pointer: number | null = null, x=0,y=0;
      const down = (event: PointerEvent) => {
        if (failed || pointer !== null || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
        pointer=event.pointerId;x=event.clientX;y=event.clientY;el.setPointerCapture(pointer);el.classList.add('is-dragging');
      };
      const move = (event: PointerEvent) => {
        if(event.pointerId !== pointer) return;
        yaw -= (event.clientX-x)*0.004; pitch = Math.max(-1.35,Math.min(1.35,pitch-(event.clientY-y)*0.004));
        x=event.clientX;y=event.clientY;render();
      };
      const up = (event: PointerEvent) => {if(event.pointerId !== pointer)return;pointer=null;el.classList.remove('is-dragging');};
      const wheel = (event: WheelEvent) => {
        if (failed || event.ctrlKey || event.metaKey) return;
        event.preventDefault();
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? el.clientHeight : 1;
        zoom(event.deltaY * unit * 0.035);
      };
      const key = (event: KeyboardEvent) => {
        if (failed || event.ctrlKey || event.metaKey || event.altKey || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(event.key)) return;
        event.preventDefault();
        if(event.key==='ArrowLeft')yaw+=0.12;
        if(event.key==='ArrowRight')yaw-=0.12;
        if(event.key==='ArrowUp')pitch=Math.min(1.35,pitch+0.12);
        if(event.key==='ArrowDown')pitch=Math.max(-1.35,pitch-0.12);
        if(event.key==='+' || event.key==='='){zoom(-5);return;}
        if(event.key==='-'){zoom(5);return;}
        render();
      };
      el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);
      el.addEventListener('wheel',wheel,{passive:false});el.addEventListener('keydown',key);
      cleanup.push(() => {el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);el.removeEventListener('lostpointercapture',up);el.removeEventListener('wheel',wheel);el.removeEventListener('keydown',key);});
    } catch {fail();}
    return () => {disposed=true;controls.current=null;cleanup.forEach(fn=>fn());resize?.disconnect();texture?.dispose();geometry?.dispose();material?.dispose();renderer?.dispose();renderer?.forceContextLoss();renderer?.domElement.remove();};
  }, []);
  return <dialog className="tour" ref={dialog} onClose={onFechar} aria-labelledby="tour-titulo">
    <header className="tour-head"><div><p className="mono">DEMONSTRAÇÃO INTERATIVA</p><h2 id="tour-titulo">Um olhar em 360°.</h2></div><button type="button" className="icon-btn" aria-label="Fechar demonstração 360°" onClick={() => dialog.current?.close()}><IconClose /></button></header>
    <div className={`tour-view${ready && !error ? " is-ready" : ""}`} ref={host} tabIndex={0} role="region" aria-label="Panorama 360° interativo" aria-describedby="tour-instrucoes">
      {error ? <div className="tour-fallback" role="alert"><img src="/panorama/interior-360.webp?v=2" alt="Prévia panorâmica do interior demonstrativo"/><p>O visualizador 360° não pôde ser iniciado neste navegador. Esta é a prévia panorâmica.</p></div> : !ready && <p className="tour-loading" role="status">Carregando panorama…</p>}
    </div>
    <footer className="tour-foot"><div><p id="tour-instrucoes">Arraste para olhar ao redor. Use as setas do teclado ou os botões para explorar.</p><p className="nota">Panorâmica ilustrativa independente dos imóveis. <a href="https://polyhaven.com/a/glasshouse_interior" target="_blank" rel="noopener noreferrer">Glasshouse Interior · Dario Barresi / Poly Haven · CC0 ↗</a></p></div><div className="tour-controls"><button type="button" className="icon-btn" disabled={!ready || error} aria-label="Aproximar panorama" onClick={() => controls.current?.zoom(-8)}>+</button><button type="button" className="icon-btn" disabled={!ready || error} aria-label="Afastar panorama" onClick={() => controls.current?.zoom(8)}>−</button><button type="button" className="btn btn-secondary" disabled={!ready || error} onClick={() => controls.current?.reset()}>Reiniciar visão</button></div></footer>
  </dialog>;
}
