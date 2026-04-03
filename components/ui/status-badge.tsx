import { cn } from "@/lib/utils";
import {
  JOB_STATUS_COLORS,
  INVOICE_STATUS_COLORS,
  QUOTE_STATUS_COLORS,
  DUMPSTER_STATUS_COLORS,
  CONDITION_GRADE_COLORS,
} from "@/lib/constants";
import type { JobStatus } from "@/types/job";
import type { InvoiceStatus } from "@/types/invoice";
import type { QuoteStatus } from "@/types/quote";
import type { DumpsterStatus, ConditionGrade } from "@/types/dumpster";

type StatusType =
  | { variant: "job"; status: JobStatus }
  | { variant: "invoice"; status: InvoiceStatus }
  | { variant: "quote"; status: QuoteStatus }
  | { variant: "dumpster"; status: DumpsterStatus }
  | { variant: "condition"; status: ConditionGrade }
  | { variant: "custom"; status: string; bg?: string; text?: string; label?: string };

type StatusBadgeProps = StatusType & { className?: string };

export function StatusBadge(props: StatusBadgeProps) {
  let bg: string, text: string, label: string;

  switch (props.variant) {
    case "job": {
      const c = JOB_STATUS_COLORS[props.status];
      bg = c.bg; text = c.text; label = c.label;
      break;
    }
    case "invoice": {
      const c = INVOICE_STATUS_COLORS[props.status];
      bg = c.bg; text = c.text; label = c.label;
      break;
    }
    case "quote": {
      const c = QUOTE_STATUS_COLORS[props.status];
      bg = c.bg; text = c.text; label = c.label;
      break;
    }
    case "dumpster": {
      const c = DUMPSTER_STATUS_COLORS[props.status];
      bg = c.bg; text = c.text; label = c.label;
      break;
    }
    case "condition": {
      const c = CONDITION_GRADE_COLORS[props.status];
      bg = c.bg; text = c.text; label = c.label;
      break;
    }
    case "custom": {
      bg = props.bg ?? "bg-gray-100";
      text = props.text ?? "text-gray-800";
      label = props.label ?? props.status;
      break;
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
        bg,
        text,
        props.className
      )}
    >
      {label}
    </span>
  );
}
