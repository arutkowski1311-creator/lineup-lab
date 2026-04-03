import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ background: "hsl(0 0% 12%)", border: "1px solid hsl(0 0% 18%)" }}
      >
        <Icon className="w-7 h-7" style={{ color: "hsl(40 5% 45%)" }} />
      </div>
      <p className="text-lg font-semibold" style={{ color: "hsl(40 20% 88%)" }}>{title}</p>
      {description && (
        <p className="text-sm mt-1 max-w-sm" style={{ color: "hsl(40 5% 50%)" }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
