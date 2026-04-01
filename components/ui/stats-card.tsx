import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: React.ElementType;
  iconColor?: string;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
  className?: string;
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-tippd-blue",
  trend,
  trendValue,
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/10 bg-tippd-charcoal p-4",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-tippd-smoke">{label}</p>
        {Icon && <Icon className={cn("w-5 h-5", iconColor)} />}
      </div>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {trend && trendValue && (
        <div className="flex items-center gap-1 mt-1">
          {trend === "up" && (
            <TrendingUp className="w-3 h-3 text-emerald-400" />
          )}
          {trend === "down" && (
            <TrendingDown className="w-3 h-3 text-red-400" />
          )}
          {trend === "flat" && <Minus className="w-3 h-3 text-tippd-ash" />}
          <span
            className={cn(
              "text-xs",
              trend === "up" && "text-emerald-400",
              trend === "down" && "text-red-400",
              trend === "flat" && "text-tippd-ash"
            )}
          >
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
}

// Light variant for portal/public pages
export function StatsCardLight({
  label,
  value,
  icon: Icon,
  iconColor = "text-tippd-blue",
  className,
}: Omit<StatsCardProps, "trend" | "trendValue">) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white p-5",
        className
      )}
    >
      <div className="flex items-center gap-3 mb-2">
        {Icon && <Icon className={cn("w-5 h-5", iconColor)} />}
        <p className="text-sm text-gray-500">{label}</p>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
