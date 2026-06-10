import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '◴' },
  { to: '/inventory', label: 'Inventory', icon: '▦' },
  { to: '/wallets', label: 'Wallets', icon: '◈' },
  { to: '/batches', label: 'Batches', icon: '⛁' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full w-64 flex-col border-r border-obsidian-800 bg-obsidian-900">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric-500 font-bold text-white">
          V
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-platinum-50">VaultBridge</p>
          <p className="text-[10px] uppercase tracking-widest text-platinum-400">Flipping Labs</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? 'bg-electric-500/10 text-electric-300'
                  : 'text-platinum-300 hover:bg-obsidian-800 hover:text-platinum-100'
              }`
            }
          >
            <span className="text-base" aria-hidden>
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 text-[11px] leading-relaxed text-platinum-400">
        Withdrawal workflow manager. VaultBridge never stores credentials or private keys.
      </div>
    </aside>
  );
}
