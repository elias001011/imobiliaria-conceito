import type { SVGProps } from 'react';

const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;
type P = SVGProps<SVGSVGElement>;

export const IconArrow = (p: P) => <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
export const IconArrowUpRight = (p: P) => <svg {...base} {...p}><path d="M7 17 17 7M8 7h9v9" /></svg>;
export const IconSearch = (p: P) => <svg {...base} {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>;
export const IconClose = (p: P) => <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>;
export const IconMoon = (p: P) => <svg {...base} {...p}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>;
export const IconSun = (p: P) => <svg {...base} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
export const IconBed = (p: P) => <svg {...base} {...p}><path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 15h18M7 9V6h4v3" /></svg>;
export const IconBath = (p: P) => <svg {...base} {...p}><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2" /></svg>;
export const IconCar = (p: P) => <svg {...base} {...p}><path d="M5 16V11l2-5h10l2 5v5M5 16h14M5 16v2M19 16v2M7.5 13h.01M16.5 13h.01" /></svg>;
export const IconArea = (p: P) => <svg {...base} {...p}><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></svg>;
export const IconPin = (p: P) => <svg {...base} {...p}><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>;
export const IconHouse = (p: P) => <svg {...base} {...p}><path d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5M10 20v-5h4v5" /></svg>;
export const IconBuilding = (p: P) => <svg {...base} {...p}><path d="M5 21V4h10v17M15 9h4v12M3 21h18M8 8h4M8 12h4M8 16h4" /></svg>;
export const IconPlot = (p: P) => <svg {...base} {...p}><path d="M4 7l8-3 8 3-8 3zM4 7v10l8 3 8-3V7M12 10v10" /><path d="M8 8.5v3" strokeDasharray="1 2" /></svg>;
export const IconTree = (p: P) => <svg {...base} {...p}><path d="M12 21v-6M12 15c-4 0-6.5-2.5-6.5-5.5S8 3 12 3s6.5 3.5 6.5 6.5S16 15 12 15zM9 21h6" /></svg>;
export const IconField = (p: P) => <svg {...base} {...p}><path d="M3 20c3-4 6-6 9-6s6 2 9 6M3 15c3-2.5 6-3.5 9-3.5s6 1 9 3.5M12 11.5V4M12 7c-1.5-1.2-3-1.4-4-1M12 7c1.5-1.2 3-1.4 4-1" /></svg>;
export const IconKey = (p: P) => <svg {...base} {...p}><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8M16 7l2 2M14 9l2 2" /></svg>;
export const IconTag = (p: P) => <svg {...base} {...p}><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.3" /></svg>;
export const IconCalc = (p: P) => <svg {...base} {...p}><rect x="5" y="3" width="14" height="18" rx="3" /><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" /></svg>;
export const IconStamp = (p: P) => <svg {...base} {...p}><path d="M4 21h16M6 17h12v4H6zM9.5 17l-.5-5a3 3 0 1 1 6 0l-.5 5" /></svg>;
export const IconLeaf = (p: P) => <svg {...base} {...p}><path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15M5 19c3-4 6-7 10-9" /></svg>;
export const Icon360 = (p: P) => <svg {...base} {...p}><ellipse cx="12" cy="12" rx="9" ry="4" /><path d="M12 3c2.5 0 4.5 4 4.5 9S14.5 21 12 21 7.5 17 7.5 12 9.5 3 12 3z" /></svg>;
export const IconChevronDown = (p: P) => <svg {...base} {...p}><path d="m6 9 6 6 6-6" /></svg>;
export const IconWhatsApp = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5.1 5.2-1.4A9.9 9.9 0 1 0 12.04 2zm0 18.1a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3a8.2 8.2 0 1 1 7 3.9zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.2-.9.9-.9 2.2s.9 2.6 1.1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3z" />
  </svg>
);
