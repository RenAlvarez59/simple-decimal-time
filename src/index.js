// Public entry point for simple-decimal-time.
// Re-exporting from core keeps the public surface small and stable.
export {
  parseTime,
  formatTime,
  toDecimalHours,
  fromDecimalHours,
  decimalHoursBetween,
  DecimalTimeError,
} from "./core.js";
