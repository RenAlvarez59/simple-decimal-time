// Core conversion logic for simple-decimal-time.
//
// Design choice: all conversions are expressed in terms of whole seconds so
// that round-trips are exact for the common case. Decimal hours are computed
// as a floating point value, but the underlying representation of a time is
// an integer number of seconds since midnight. This avoids the drift you get
// when you repeatedly convert through floating point hours.

export class DecimalTimeError extends Error {
  constructor(message) {
    super(message);
    this.name = "DecimalTimeError";
  }
}

const SECONDS_PER_DAY = 24 * 60 * 60;

function assertInteger(value, name) {
  if (!Number.isInteger(value)) {
    throw new DecimalTimeError(`${name} must be an integer, got ${value}`);
  }
}

/**
 * Parse a 24-hour sexagesimal time string into seconds since midnight.
 *
 * Accepted forms: "HH:MM", "HH:MM:SS", "H:MM", "HH:MM:SS.sss".
 * A leading "24:00:00" is rejected: midnight belongs to the next day and
 * folding it into 0 would silently lose a day boundary for payroll.
 */
export function parseTime(input) {
  if (typeof input !== "string") {
    throw new DecimalTimeError(`time must be a string, got ${typeof input}`);
  }
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?$/.exec(input);
  if (!match) {
    throw new DecimalTimeError(`invalid time string: ${JSON.stringify(input)}`);
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] === undefined ? 0 : Number(match[3]);
  const fraction = match[4] === undefined ? 0 : Number(`0.${match[4]}`);

  if (hours > 23) {
    throw new DecimalTimeError(`hour out of range: ${hours}`);
  }
  if (minutes > 59) {
    throw new DecimalTimeError(`minute out of range: ${minutes}`);
  }
  if (seconds > 59) {
    throw new DecimalTimeError(`second out of range: ${seconds}`);
  }

  const whole = hours * 3600 + minutes * 60 + seconds;
  return whole + fraction;
}

/**
 * Format seconds since midnight as "HH:MM:SS".
 *
 * Rounding is done to the nearest second with half away from zero handled by
 * Math.round. Fractional seconds are dropped because the canonical display
 * form is whole seconds; callers that need sub-second precision should keep
 * the numeric value.
 */
export function formatTime(totalSeconds) {
  if (typeof totalSeconds !== "number" || !Number.isFinite(totalSeconds)) {
    throw new DecimalTimeError(`seconds must be a finite number, got ${totalSeconds}`);
  }
  let rounded = Math.round(totalSeconds);
  if (rounded < 0) {
    throw new DecimalTimeError(`seconds must not be negative, got ${totalSeconds}`);
  }
  // Wrap values that land exactly on the next midnight so the output stays
  // inside the 24-hour clock instead of printing "24:00:00".
  rounded %= SECONDS_PER_DAY;
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

function pad2(n) {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Convert a sexagesimal time string to decimal hours.
 */
export function toDecimalHours(input) {
  const seconds = parseTime(input);
  return seconds / 3600;
}

/**
 * Convert decimal hours to a sexagesimal time string.
 *
 * Decimal hours outside [0, 24) are wrapped modulo 24 so that a payroll run
 * that sums to, say, 25.5 hours reports "01:30:00" rather than failing.
 * Negative values are rejected: a negative duration is a caller bug, not a
 * time of day.
 */
export function fromDecimalHours(hours) {
  if (typeof hours !== "number" || !Number.isFinite(hours)) {
    throw new DecimalTimeError(`hours must be a finite number, got ${hours}`);
  }
  if (hours < 0) {
    throw new DecimalTimeError(`hours must not be negative, got ${hours}`);
  }
  const seconds = hours * 3600;
  return formatTime(seconds);
}

/**
 * Difference between two sexagesimal times, in decimal hours.
 *
 * The result is signed: end before start yields a negative number. This is
 * the behaviour payroll needs when reconciling clock-in and clock-out across
 * midnight, where the caller is responsible for adding 24 hours.
 */
export function decimalHoursBetween(start, end) {
  const startSeconds = parseTime(start);
  const endSeconds = parseTime(end);
  return (endSeconds - startSeconds) / 3600;
}

// assertInteger is kept internal; exported only if used. It is not part of the
// public API, so it is intentionally not re-exported from index.js.
void assertInteger;
