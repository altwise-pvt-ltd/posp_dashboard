function UserMenu({ isOpen, onToggle }) {
  const name = 'Rudra Indurkar';
  const initial = name[0].toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/30"
      >
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold">
          {initial}
        </div>
        <span className="text-sm font-medium text-slate-700 hidden sm:block">
          {name}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
            <p className="text-xs text-slate-500">Signed in</p>
          </div>
          <a
            href="#profile"
            className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Your profile
          </a>
          <a
            href="#settings"
            className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Change Password
          </a>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
