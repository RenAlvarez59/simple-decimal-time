# simple-decimal-time

Convert between 24-hour sexagesimal clock times and decimal hours, for payroll and scientific time tracking.

```js
import {
  toDecimalHours,
  fromDecimalHours,
  decimalHoursBetween,
} from "simple-decimal-time";

toDecimalHours("01:30");        // => 1.5
fromDecimalHours(1.5);          // => "01:30:00"
decimalHoursBetween("09:00", "17:30"); // => 8.5
```

## Why this exists

Timesheets and lab logs are written on a 24-hour clock, but pay and rate math is
much easier in decimal hours. Converting by hand invites off-by-one errors at
midnight and rounding drift when the same interval is converted back and forth.
This library keeps one canonical representation — whole seconds since midnight —
and treats decimal hours as a derived view. The trade-off is that decimal-hour
round-trips are exact only for whole-second inputs; sub-second precision is
preserved when you keep the numeric value, but `formatTime` deliberately drops
it, because a timesheet that reports milliseconds is noise.

## The awkward edge

`fromDecimalHours` wraps values outside `[0, 24)` modulo 24, so `25.5` becomes
`"01:30:00"`. That is the right behaviour when you are summing a week of shifts,
but it means a caller who expected an error for an out-of-range value will not
get one. Negative decimal hours are still rejected, because a negative duration
is a bug on the caller's side, not a time of day.

## API

- `parseTime(input)` — string to seconds since midnight. Accepts `HH:MM`,
  `HH:MM:SS`, and fractional seconds. Rejects `24:00:00`.
- `formatTime(totalSeconds)` — seconds to `"HH:MM:SS"`, rounded to the nearest
  second and wrapped modulo 24 hours.
- `toDecimalHours(input)` — clock string to decimal hours.
- `fromDecimalHours(hours)` — decimal hours to clock string, wrapped modulo 24.
- `decimalHoursBetween(start, end)` — signed difference in decimal hours.
- `DecimalTimeError` — thrown for every invalid input above.
