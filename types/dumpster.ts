export const DUMPSTER_STATUSES = [
  "available",
  "assigned",
  "deployed",
  "returning",
  "in_yard",
  "repair",
  "retired",
] as const;
export type DumpsterStatus = (typeof DUMPSTER_STATUSES)[number];

export const DUMPSTER_SIZES = ["10yd", "20yd", "30yd"] as const;
export type DumpsterSize = (typeof DUMPSTER_SIZES)[number];

export const CONDITION_GRADES = ["A", "B", "C", "D", "F"] as const;
export type ConditionGrade = (typeof CONDITION_GRADES)[number];

export interface Dumpster {
  id: string;
  operator_id: string;
  unit_number: string;
  size: DumpsterSize;
  condition_grade: ConditionGrade;
  status: DumpsterStatus;
  current_job_id: string | null;
  last_inspection_date: string | null;
  repair_notes: string | null;
  repair_cost_estimate: number | null;
  repair_return_date: string | null;
  created_at: string;
}

export interface DumpsterConditionLog {
  id: string;
  dumpster_id: string;
  job_id: string | null;
  previous_grade: ConditionGrade;
  new_grade: ConditionGrade;
  changed_by: string;
  notes: string | null;
  created_at: string;
}
