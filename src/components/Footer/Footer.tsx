import { useShell } from '../AppShell/ShellContext';
import styles from './Footer.module.css';

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterProps {
  copyright: string;
  links?: FooterLink[];
}

export function Footer({ copyright, links }: FooterProps) {
  const phone = useShell()?.compact === true;
  return (
    <footer className={[styles.footer, phone ? styles.phone : ''].filter(Boolean).join(' ')}>
      <p>{copyright}</p>
      {links?.length ? (
        <ul className={styles.links}>
          {links.map((link) => <li key={link.href}><a href={link.href} className={styles.link}>{link.label}</a></li>)}
        </ul>
      ) : null}
    </footer>
  );
}
