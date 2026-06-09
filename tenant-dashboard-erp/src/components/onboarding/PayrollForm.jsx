import React, { useState, useEffect } from 'react';
import { Asterisk } from 'lucide-react';
import './PayrollForm.css'; // Ensure styling file exists

/**
 * PayrollForm – a clear, strategy‑driven compensation UI.
 * Allows admin staff to select a Pay Plan and only see the fields required for that plan.
 */
const PayrollForm = ({ onChange, initialData = {} }) => {
  // --- Pay Plan selection ---------------------------------------------------
  const [payPlan, setPayPlan] = useState(initialData.pay_plan || 'A'); // 'A', 'B', 'C'

  // --- Plan‑specific fields ------------------------------------------------
  // Plan A – Hourly + Trip Bonus
  const [baseHourlyRate, setBaseHourlyRate] = useState(initialData.base_hourly_rate || '');
  const [bonusPerTrip, setBonusPerTrip] = useState(initialData.bonus_per_trip || '');

  // Plan B – Revenue Share (Commission)
  const [commission, setCommission] = useState(initialData.commission_percentage || '');

  // Plan C – Fixed Rate
  const [fixedAmount, setFixedAmount] = useState(initialData.fixed_payment_amount || '');
  const [frequency, setFrequency] = useState(initialData.frequency || 'daily'); // daily | weekly | monthly

  // Helper text mapping for each plan
  const helperText = {
    A: 'Best for hourly drivers earning trip bonuses.',
    B: 'Best for independent contractors on a percentage split.',
    C: 'Best for drivers on a flat‑fee or daily contract.',
  };

  // --- Notify parent when any relevant data changes ------------------------
  const notify = () => {
    const payload = {
      PAYROLL_STRATEGY: payPlan,
      // Fields are only included when relevant to avoid undefined values
      ...(payPlan === 'A' && {
        base_hourly_rate: baseHourlyRate,
        bonus_per_trip: bonusPerTrip,
      }),
      ...(payPlan === 'B' && {
        commission_percentage: commission,
      }),
      ...(payPlan === 'C' && {
        fixed_payment_amount: fixedAmount,
        frequency,
      }),
    };
    onChange && onChange(payload);
  };

  // Call notify on any change to the form state
  useEffect(() => {
    notify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payPlan, baseHourlyRate, bonusPerTrip, commission, fixedAmount, frequency]);

  return (
    <div className="ob-section">
      {/* Pay Plan Selector */}
      <div className="ob-form-group">
        <label className="ob-form-label">Pay Plan</label>
        <select
          className="ob-input"
          value={payPlan}
          onChange={(e) => setPayPlan(e.target.value)}
        >
          <option value="A">Plan A: Hourly + Trip Bonus</option>
          <option value="B">Plan B: Revenue Share</option>
          <option value="C">Plan C: Fixed Rate</option>
        </select>
        <p className="helper-text" style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          {helperText[payPlan]}
        </p>
      </div>

      {/* Conditional fields based on selected plan */}
      {payPlan === 'A' && (
        <div className="ob-fields-col">
          <div className="ob-form-group">
            <label className="ob-form-label">Base Hourly Rate (£)</label>
            <div className="ob-input-with-btn">
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--color-text-muted)', paddingLeft: '12px' }}>£</span>
              <input
                type="text"
                className="ob-input"
                style={{ paddingLeft: '8px' }}
                value={baseHourlyRate}
                onChange={(e) => setBaseHourlyRate(e.target.value)}
                placeholder="e.g. 25.00"
              />
            </div>
          </div>
          <div className="ob-form-group">
            <label className="ob-form-label">Bonus Per Trip (£)</label>
            <div className="ob-input-with-btn">
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--color-text-muted)', paddingLeft: '12px' }}>£</span>
              <input
                type="text"
                className="ob-input"
                style={{ paddingLeft: '8px' }}
                value={bonusPerTrip}
                onChange={(e) => setBonusPerTrip(e.target.value)}
                placeholder="e.g. 2.50"
              />
            </div>
          </div>
        </div>
      )}

      {payPlan === 'B' && (
        <div className="ob-fields-col">
          <div className="ob-form-group">
            <label className="ob-form-label">Commission %</label>
            <div className="ob-input-with-btn">
              <input
                type="number"
                className="ob-input"
                min="0"
                max="100"
                placeholder="e.g. 45"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
              />
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>%</span>
            </div>
          </div>
        </div>
      )}

      {payPlan === 'C' && (
        <div className="ob-fields-col">
          <div className="ob-form-group">
            <label className="ob-form-label">Fixed Payment Amount (£)</label>
            <div className="ob-input-with-btn">
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--color-text-muted)', paddingLeft: '12px' }}>£</span>
              <input
                type="text"
                className="ob-input"
                style={{ paddingLeft: '8px' }}
                value={fixedAmount}
                onChange={(e) => setFixedAmount(e.target.value)}
                placeholder="e.g. 500"
              />
            </div>
          </div>
          <div className="ob-form-group">
            <label className="ob-form-label">Frequency</label>
            <select
              className="ob-input"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollForm;
