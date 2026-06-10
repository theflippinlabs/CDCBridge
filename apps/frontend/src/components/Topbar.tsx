import { useAuth } from '../context/AuthContext';

export function Topbar({ title, onMenu }: { title: string; onMenu?: () => void }) {
  const { user, signOut } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-obsidian-800 bg-obsidian-900/60 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          className="btn-ghost px-2 py-1 lg:hidden"
          onClick={onMenu}
          aria-label="Open menu"
        >
          ☰
        </button>
        <h1 className="text-lg font-semibold text-platinum-50">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-platinum-400 sm:inline">{user?.email}</span>
        <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => signOut()}>
          Sign out
        </button>
      </div>
    </header>
  );
}
