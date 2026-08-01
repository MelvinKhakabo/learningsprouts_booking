import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

type ButtonProps = {
  children: ReactNode;
  to?: string;
  href?: string;
  onClick?: () => void;
  variant?: 'marigold' | 'ink' | 'outline' | 'soft';
  className?: string;
};

const VARIANT_STYLES: Record<NonNullable<ButtonProps['variant']>, string> = {
  marigold: 'bg-marigold text-cream hover:bg-marigold-dark',
  ink: 'bg-ink text-cream hover:bg-ink/85',
  outline: 'border-2 border-ink text-ink hover:bg-ink hover:text-cream',
  soft: 'bg-ink/8 text-ink hover:bg-ink/15',
};

export default function Button({
  children,
  to,
  href,
  onClick,
  variant = 'marigold',
  className = '',
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold uppercase tracking-wide transition-colors ${VARIANT_STYLES[variant]} ${className}`;

  if (to) return <Link to={to} className={classes}>{children}</Link>;
  if (href) return <a href={href} className={classes}>{children}</a>;
  return <button onClick={onClick} className={classes}>{children}</button>;
}