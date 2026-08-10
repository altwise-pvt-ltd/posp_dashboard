import React from 'react';

const ProfileCard = () => {
  const employee = {
    name: 'Rakesh Pawar',
    title: 'POSP Insurance Advisor',
    joinedDate: 'January 15, 2024',
    policies: 38,
    imageUrl: 'https://i.pravatar.cc/400?img=12',
  };

  return (
    <div className="card-lift w-full bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
      {/* ── Avatar: square crop keeps a headshot centered (no face clipping) ── */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        <img
          src={employee.imageUrl}
          alt={employee.name}
          width={400}
          height={400}
          className="w-full h-full object-cover"
        />
        {/* subtle fade so the image bleeds into the white content below */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-white to-transparent pointer-events-none" />
      </div>

      {/* ── Identity ── */}
      <div className="px-6 pb-6 pt-5 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-1">
          Joined {employee.joinedDate}
        </p>

        <h2 className="text-2xl font-bold text-slate-800 leading-tight">
          {employee.name}
        </h2>
        <p className="mt-1.5 text-sm text-slate-500 font-medium">
          {employee.title}
        </p>

        {/* ── Stats with vertical divider ── */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-around">
          <div className="text-center">
            <span className="block text-xl font-bold text-slate-700">{employee.policies}</span>
            <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wide">Policies</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <span className="block text-xl font-bold text-emerald-600">Active</span>
            <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wide">Status</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
