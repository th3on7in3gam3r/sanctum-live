import React from 'react';
import { Clock, Users, FileText, Radio } from 'lucide-react';
import { formatNumber } from '../../lib/utils';

interface OverviewMetricsProps {
  totalRooms: number;
  activeRequests: number;
  peopleReached: number;
  totalPrayerHours: number | string;
}

export const OverviewMetrics: React.FC<OverviewMetricsProps> = ({
  totalRooms,
  activeRequests,
  peopleReached,
  totalPrayerHours,
}) => {
  const metrics = [
    {
      label: 'Prayer Rooms',
      value: totalRooms,
      subtext: 'Active gathering altars',
      icon: Radio,
      color: 'text-[#203C32] dark:text-[#E8D8B2]',
      bg: 'bg-[#203C32]/10 dark:bg-[#203C32]/30',
    },
    {
      label: 'People Reached',
      value: formatNumber(peopleReached),
      subtext: 'Congregants praying together',
      icon: Users,
      color: 'text-[#C9A35A]',
      bg: 'bg-[#C9A35A]/15',
    },
    {
      label: 'Prayer Requests',
      value: activeRequests,
      subtext: 'Needs & praise reports',
      icon: FileText,
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    },
    {
      label: 'Prayer Time',
      value: `${totalPrayerHours}h`,
      subtext: 'Total duration of completed prayer sessions.',
      icon: Clock,
      color: 'text-[#3D6655] dark:text-[#E8D8B2]',
      bg: 'bg-[#3D6655]/10 dark:bg-[#3D6655]/25',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, i) => {
        const Icon = m.icon;
        return (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white dark:bg-[#17221D] border border-[#E5E6E1] dark:border-[#26362F] shadow-xs flex items-center justify-between"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#68736D] dark:text-[#96A39D]">
                {m.label}
              </p>
              <h3 className="text-2xl font-extrabold text-[#16251F] dark:text-[#F8F7F3] mt-1">
                {m.value}
              </h3>
              <p className="text-[11px] text-[#68736D] dark:text-[#96A39D] mt-0.5">
                {m.subtext}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${m.bg} ${m.color} flex items-center justify-center shrink-0`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
