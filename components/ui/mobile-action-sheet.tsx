"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface ActionItem {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

interface MobileActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  actions: ActionItem[];
}

export function MobileActionSheet({
  open,
  onOpenChange,
  title,
  actions,
}: MobileActionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-1 pb-4">
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                onClick={() => {
                  action.onClick();
                  onOpenChange(false);
                }}
                disabled={action.disabled}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-base font-medium transition-colors",
                  action.variant === "destructive"
                    ? "text-red-600 hover:bg-red-50 active:bg-red-100"
                    : "text-gray-900 hover:bg-gray-100 active:bg-gray-200",
                  action.disabled && "opacity-40 pointer-events-none"
                )}
              >
                {Icon && <Icon className="w-5 h-5" />}
                {action.label}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
