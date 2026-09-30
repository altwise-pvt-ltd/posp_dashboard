import { useState } from 'react';
import logo from "@/assets/let'sInsuranceLogo.svg";
import NotificationBell from './NotificationBell';
import UserMenu from './UserMenu';

function Topbar() {
  const [openMenu, setOpenMenu] = useState(null);
  const toggle = (menu) => setOpenMenu((prev) => (prev === menu ? null : menu));

  return (
    <div className="h-full flex items-center justify-between gap-3">
      {/* Shown only while the sidebar (and its logo) is a hidden drawer. */}
      <img
        src={logo}
        alt="LetsInsurance"
        width={172}
        height={40}
        className="h-auto w-32 min-w-0 lg:hidden"
      />

      <div className="flex items-center gap-2 shrink-0 ml-auto">
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
