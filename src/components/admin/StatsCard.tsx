/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  colorClass?: string;
}

export default function StatsCard({ title, value, icon, subtitle, colorClass = "text-yellow-500" }: StatsCardProps) {
  return (
    <div className="relative overflow-hidden bg-[#111118] border border-[#1e1e2d] px-5 py-5 rounded-2xl flex items-center justify-between shadow-xl">
      <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-[0.03] scale-150 pointer-events-none">
        {icon}
      </div>

      <div className="flex flex-col">
        <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
          {title}
        </span>
        <span className="text-2xl sm:text-3xl font-black text-[#F8F8FF] font-mono tracking-tight mb-1">
          {value}
        </span>
        {subtitle && (
          <span className="text-gray-400 text-[10px] sm:text-xs">
            {subtitle}
          </span>
        )}
      </div>

      <div className={`p-3.5 rounded-xl bg-black/40 border border-[#1e1e2d] ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
}
