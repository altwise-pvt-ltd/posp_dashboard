import { useState } from 'react';
import SearchBar from '@/shared/components/SearchBar';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';

function Topbar() {
  const [openMenu, setOpenMenu] = useState(null);
  const toggle = (menu) => setOpenMenu((prev) => (prev === menu ? null : menu));

  return (
    <div className="h-full flex items-center justify-between gap-3">
      {/* Left — search. Caps at the old fixed 18rem but shrinks below it, so on
          a phone it yields room to the actions instead of pushing them out. */}
      <SearchBar className="min-w-0 flex-1 max-w-72" />

      {/* Right — actions */}
      <div className="flex items-center gap-2 shrink-0">
        <NotificationBell
          isOpen={openMenu === 'notif'}
          onToggle={() => toggle('notif')}
        />
        <UserMenu
          isOpen={openMenu === 'profile'}
          onToggle={() => toggle('profile')}
        />
      </div>
    </div>
  );
}

export default Topbar;
