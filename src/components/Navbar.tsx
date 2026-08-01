import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/ai-coding', label: 'AI & Coding' },
  { to: '/public-speaking', label: 'Public Speaking' },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="sticky top-0 z-50 border-b border-ink/10 bg-cream/90 backdrop-blur"
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-display text-lg font-black tracking-tight">
          Learning Sprouts
          <span className="ml-1 font-normal text-marigold">Programs</span>
        </Link>

        <ul className="flex items-center gap-6">
          {LINKS.map((link) => {
            const active = location.pathname === link.to;
            return (
              <li key={link.to} className="relative">
                <Link
                  to={link.to}
                  className={`text-sm font-semibold transition-colors ${
                    active ? 'text-marigold-dark' : 'text-ink hover:text-marigold-dark'
                  }`}
                >
                  {link.label}
                </Link>
                {active && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 h-0.5 w-full bg-marigold-dark"
                  />
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </motion.header>
  );
}