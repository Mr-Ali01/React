import React from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';

export default function NotificationSummaryCards({
  counts = { all: 0, unread: 0, read: 0, deleted: 0 },
  activeFilter = 'ALL',
  onSelectFilter
}) {
  const cards = [
    {
      key: 'ALL',
      label: 'All Notifications',
      count: counts.all,
      icon: (
        <div className="w-10 h-10 rounded-xl bg-bg-sec border border-border flex items-center justify-center text-text-light">
          <Bell className="w-5 h-5" />
        </div>
      ),
      isActive: activeFilter === 'ALL'
    },
    {
      key: 'UNREAD',
      label: 'Unread',
      count: counts.unread,
      icon: (
        <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/10 border border-[#FF6B00]/25 flex items-center justify-center text-[#FF6B00]">
          <span className="w-3.5 h-3.5 rounded-full bg-[#FF6B00]" />
        </div>
      ),
      isActive: activeFilter === 'UNREAD',
      highlightBorder: true
    },
    {
      key: 'READ',
      label: 'Read',
      count: counts.read,
      icon: (
        <div className="w-10 h-10 rounded-xl bg-bg-sec border border-border flex items-center justify-center text-text-light">
          <Check className="w-5 h-5 stroke-[2.5]" />
        </div>
      ),
      isActive: activeFilter === 'READ'
    },
    {
      key: 'DELETED',
      label: 'Deleted',
      count: counts.deleted,
      icon: (
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 dark:text-rose-400">
          <Trash2 className="w-5 h-5" />
        </div>
      ),
      isActive: activeFilter === 'DELETED'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const isCurrent = card.isActive;
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelectFilter(card.key)}
            className={`p-4 sm:p-5 rounded-2xl bg-card border text-left transition-all cursor-pointer relative group ${
              isCurrent || (card.highlightBorder && activeFilter === 'ALL' && card.key === 'UNREAD')
                ? 'border-[#FF6B00] shadow-sm'
                : 'border-border hover:border-slate-300 dark:hover:border-[#2A374A]'
            }`}
          >
            <div className="flex items-center gap-3.5">
              {card.icon}
              <div>
                <span className="text-xl sm:text-2xl font-black text-text-h block tracking-tight">
                  {card.count}
                </span>
                <span className="text-xs font-semibold text-text-light block mt-0.5">
                  {card.label}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
