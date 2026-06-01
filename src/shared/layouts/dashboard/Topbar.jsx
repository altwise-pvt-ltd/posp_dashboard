import { useState } from 'react';
import SearchBar from '@/shared/components/SearchBar';
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';

function Topbar() {
  const [openMenu, setOpenMenu] = useState(null);
  const toggle = (menu) => setOpenMenu((prev) => (prev === menu ? null : menu));

  return (
    <div className="h-full flex items-center justify-between">
      {/* Left — search */}
      <SearchBar className="w-72" />

      {/* Right — actions */}
      <div className="flex items-center gap-2">
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
