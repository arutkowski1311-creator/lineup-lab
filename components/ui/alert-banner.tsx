import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Info, XCircle, X } from "lucide-react";

type Variant = "info" | "warning" | "error" | "success";

const VARIANT_STYLES: Record<Variant, { bg: string; text: string; icon: React.ElementType }> = {
  info: { bg: "bg-blue-50 border-blue-200", text: "text-blue-800", icon: Info },
  warning: { bg: "bg-amber-50 border-amber-200", text: "text-amber-800", icon: AlertTriangle },
  error: { bg: "bg-red-50 border-red-200", text: "text-red-800", icon: XCircle },
  success: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", icon: CheckCircle },
};

interface AlertBannerProps {
  variant?: Variant;
  title?: string;
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function AlertBanner({
  variant = "info",
  title,
  message,
  onDismiss,
  className,
}: AlertBannerProps) {
  const styles = VARIANT_STYLES[variant];
  const Icon = styles.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border",
        styles.bg,
        styles.text,
        className
      )}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-sm">{title}</p>}
        <p className="text-sm">{message}</p>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 hover:opacity-70">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
