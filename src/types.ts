export interface WarmupPlan {
  /** Target warmup time in minutes from midnight (0-1439) */
  targetMinute: number;
  /** Median session start time in minutes from midnight */
  medianStartMinute: number;
  /** Median session duration in minutes */
  medianDurationMinutes: number;
  calculatedAt: string;
}
