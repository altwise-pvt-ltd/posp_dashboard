import React from 'react';

const ProfileCard = () => {
  // Example data — replace with the real employee record later
  const employee = {
    name: "Rudrankur Indurkar",
    title: "Full-Stack Developer",
    joinedDate: "January 15, 2024",
    // Temporary rectangular avatar. Swap for the real photo path later.
    imageUrl: "https://i.pravatar.cc/400?img=12",
  };

  return (
    // No min-h-screen / centering wrapper: the card flows from the top of its
    // column so it lines up with the sibling cards. w-full fits the column.
    <div className="w-full bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
      {/* Top: square (rectangular) avatar */}
      <div className="aspect-square w-full overflow-hidden bg-slate-100">
        <img
          src={employee.imageUrl}
          alt={employee.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content Area */}
      <div className="p-6 text-center">
        {/* Date of Joining / Notification */}
        <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-1">
          Joined {employee.joinedDate}
        </p>

        {/* Full Name */}
        <h2 className="text-2xl font-bold text-slate-800 leading-tight">
          {employee.name}
        </h2>

        {/* Role/Title */}
        <p className="mt-2 text-sm text-slate-500 font-medium">
          {employee.title}
        </p>

        <div className="mt-6 pt-6 border-t border-slate-100 flex justify-around">
          <div className="text-center">
            <span className="block text-lg font-bold text-slate-700">12</span>
            <span className="text-[10px] uppercase text-slate-400 font-semibold">Projects</span>
          </div>
          <div className="text-center">
            <span className="block text-lg font-bold text-slate-700">Active</span>
            <span className="text-[10px] uppercase text-slate-400 font-semibold">Status</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
