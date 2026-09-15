import React from 'react';

export const StatusTabs = ({ activeStatus, onSelectStatus }) => {
  const statuses = [
    { id: 'all', label: 'All' },
    { id: 'new', label: 'New' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'deadline-approaching', label: 'Closing Soon' },
    { id: 'missed', label: 'Missed' },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
      {statuses.map((status) => {
        const isActive = activeStatus === status.id;
        return (
          <button
            key={status.id}
            id={`status-tab-${status.id}`}
            onClick={() => onSelectStatus(status.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 touch-scale ${
              isActive
                ? 'bg-primary text-white shadow-sm shadow-primary/25'
                : 'bg-surface text-slate-600 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            {status.label}
          </button>
        );
      })}
    </div>
  );
};

export default StatusTabs;
