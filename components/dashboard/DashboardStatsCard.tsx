
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { cn } from '../../lib/utils';

interface DashboardStatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: any;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export const DashboardStatsCard: React.FC<DashboardStatsCardProps> = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  trendUp,
  className 
}) => (
  <Card className={cn("relative overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-1 rounded-3xl border-none shadow-sm bg-white", className)}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-6 pt-6">
      <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">{title}</CardTitle>
      <div className="h-11 w-11 rounded-xl bg-slate-50 flex items-center justify-center text-ueu-blue shadow-inner transition-all duration-300 group-hover:bg-ueu-blue group-hover:text-white group-hover:rotate-6">
        <Icon className="h-5 w-5" />
      </div>
    </CardHeader>
    <CardContent className="px-6 pb-6 mt-1">
      <div className="text-3xl font-bold text-ueu-navy tracking-tight">{value}</div>
      {(description || trend) && (
        <p className="text-[11px] font-bold text-slate-500 mt-2 flex items-center gap-2">
          {trend && (
             <span className={cn("flex items-center gap-1", trendUp ? "text-emerald-500" : "text-amber-500")}>
               {trend}
             </span>
          )}
          <span className="opacity-60">{description}</span>
        </p>
      )}
    </CardContent>
  </Card>
);
