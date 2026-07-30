import React from "react";

export default function ReviewCards({
  name,
  profile,
  review,
  details,
  earning,
  rating,
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-sm">
      <div className="flex items-center mb-4 border-gray-200 border-b pb-4">
        <img
          src={profile}
          alt={`${name}'s Review`}
          className="w-12 h-12 rounded-full object-cover mr-4 border-orange-300 pb-1"
        />
      </div>
    </div>
  );
}
