// Placeholders for stories. The design system ships no brand assets: a real app passes its own mark.
import type { NavGroup, NavItem } from './SidebarNav/SidebarNav';
import type { ProductMarkSource } from './ProductMark/ProductMark';

export const placeholderMark: ProductMarkSource = {
  name: 'Example product',
  node: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="6" style={{ fill: 'var(--syn-color-accent-fill)' }} />
    </svg>
  ),
};

export const navGroups: NavGroup[] = [
  { id: 'analyse', label: 'Analyse', items: [
    { id: 'overview', label: 'Overview', href: '#overview', icon: 'overview' },
    { id: 'country', label: 'Country profile', href: '#country', icon: 'country' },
    { id: 'historical', label: 'Historical trends', href: '#historical', icon: 'historical' },
    { id: 'forecasts', label: 'Forecasts', href: '#forecasts', icon: 'forecasts' },
    { id: 'scenarios', label: 'Scenarios', href: '#scenarios', icon: 'scenarios' },
  ] },
  { id: 'explore', label: 'Explore', items: [
    { id: 'explorer', label: 'Data explorer', href: '#explorer', icon: 'explorer' },
    { id: 'ask', label: 'Ask', href: '#ask', icon: 'ask', count: 2 },
  ] },
];

export const navFooter: NavItem[] = [{ id: 'about', label: 'About', href: '#about', icon: 'info' }];
