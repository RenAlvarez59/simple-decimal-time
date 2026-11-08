import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseTime,
  formatTime,
  toDecimalHours,
  fromDecimalHours,
  decimalHoursBetween,
  DecimalTimeError,
} from "../src/index.js";

const EPS = 1e-9;

function closeTo(actual, expected, eps = EPS) {
  assert.ok(
    Math.abs(actual - expected) < eps,
    `expected ${actual} to be within ${eps} of ${expected}`,
  );
}

test("parseTime accepts HH:MM", () => {
  assert.equal(parseTime("09:30"), 9 * 3600 + 30 * 60);
});

test("parseTime accepts HH:MM:SS", () => {
  assert.equal(parseTime("23:59:59"), 23 * 3600 + 59 * 60 + 59);
});

test("parseTime accepts a single-digit hour", () => {
  assert.equal(parseTime("0:05"), 5 * 60);
});

test("parseTime accepts fractional seconds", () => {
  closeTo(parseTime("00:00:01.5"), 1.5);
});

test("parseTime rejects 24:00:00", () => {
  assert.throws(() => parseTime("24:00:00"), DecimalTimeError);
});

test("parseTime rejects out-of-range minutes", () => {
  assert.throws(() => parseTime("10:60"), DecimalTimeError);
});

test("parseTime rejects garbage", () => {
  assert.throws(() => parseTime("not a time"), DecimalTimeError);
});

test("parseTime rejects non-strings", () => {
  assert.throws(() => parseTime(12), DecimalTimeError);
});

test("formatTime pads to HH:MM:SS", () => {
  assert.equal(formatTime(5 * 60), "00:05:00");
  assert.equal(formatTime(9 * 3600 + 30 * 60), "09:30:00");
});

test("formatTime wraps a full day", () => {
  assert.equal(formatTime(24 * 3600), "00:00:00");
});

test("formatTime rounds to nearest second", () => {
  assert.equal(formatTime(59.6), "00:01:00");
});

test("formatTime rejects negative seconds", () => {
  assert.throws(() => formatTime(-1), DecimalTimeError);
});

test("toDecimalHours converts 90 minutes to 1.5", () => {
  closeTo(toDecimalHours("01:30"), 1.5);
});

test("toDecimalHours handles midnight", () => {
  closeTo(toDecimalHours("00:00"), 0);
});

test("fromDecimalHours converts 1.5 to 01:30:00", () => {
  assert.equal(fromDecimalHours(1.5), "01:30:00");
});

test("fromDecimalHours wraps values past midnight", () => {
  assert.equal(fromDecimalHours(25.5), "01:30:00");
});

test("fromDecimalHours rejects negative hours", () => {
  assert.throws(() => fromDecimalHours(-0.5), DecimalTimeError);
});

test("round-trip preserves whole-second times", () => {
  for (const t of ["00:00:00", "06:07:08", "12:34:56", "23:59:59"]) {
    assert.equal(fromDecimalHours(toDecimalHours(t)), t);
  }
});

test("decimalHoursBetween returns a signed difference", () => {
  closeTo(decimalHoursBetween("09:00", "17:30"), 8.5);
  closeTo(decimalHoursBetween("17:30", "09:00"), -8.5);
});

test("decimalHoursBetween is zero for identical times", () => {
  closeTo(decimalHoursBetween("10:00", "10:00"), 0);
});

test("DecimalTimeError has a useful name", () => {
  const err = new DecimalTimeError("boom");
  assert.equal(err.name, "DecimalTimeError");
  assert.equal(err.message, "boom");
});
