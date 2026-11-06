// Stroke icons at 1.6 (Entrance spec). Decorative: the control carries the accessible name.
const base = { 'aria-hidden': true, width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6 } as const;

export const SearchIcon = () => <svg {...base}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>;
export const MenuIcon = () => <svg {...base}><path d="M4 7h16M4 12h16M4 17h10" /></svg>;
export const HomeIcon = () => <svg {...base}><path d="M4 11l8-7 8 7v9H4z" /></svg>;
export const LabelsIcon = () => <svg {...base}><rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /><rect x="13" y="13" width="7" height="7" /></svg>;
export const SavedIcon = () => <svg {...base}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" /></svg>;
export const BagIcon = () => <svg {...base}><path d="M5 8h14l-1 12H6z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>;
export const FilterIcon = () => <svg {...base} width={16} height={16} strokeWidth={1.8}><path d="M4 6h16M7 12h10M10 18h4" /></svg>;
