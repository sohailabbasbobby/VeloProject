// src/utils/payroll_engine.js
/**
 * Calculate an estimated net pay assuming a flat 22% tax and optional pension deduction.
 * @param {number} gross - Gross salary amount.
 * @param {number} pensionPct - Pension percentage (0‑100).
 * @returns {number} Estimated net pay.
 */
export function calculateEstimatedNetPay(gross, pensionPct = 0) {
  const taxRate = 0.22;
  const pensionDeduction = (pensionPct / 100) * gross;
  const net = gross - gross * taxRate - pensionDeduction;
  return Math.round(net * 100) / 100; // round to 2 decimals
}
