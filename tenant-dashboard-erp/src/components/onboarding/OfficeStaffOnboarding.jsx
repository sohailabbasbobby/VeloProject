import React, { useState } from 'react';
import { Asterisk } from 'lucide-react';
import PayrollForm from './PayrollForm';
import './OfficeStaffOnboarding.css';

/**
 * OfficeStaffOnboarding – a premium onboarding form for office staff.
 * Mirrors the existing PayrollForm UI with additional personal and bank details.
 */
const OfficeStaffOnboarding = ({ onSubmit, initialData = {} }) => {
  // Personal details
  const [fullName, setFullName] = useState(initialData.fullName || '');
  const [role, setRole] = useState(initialData.role || '');
  const [department, setDepartment] = useState(initialData.department || '');
  const [startDate, setStartDate] = useState(initialData.startDate || '');
  const [employeeId, setEmployeeId] = useState(initialData.employeeId || '');

  // Bank details
  const [sortCode, setSortCode] = useState(initialData.sortCode || '');
  const [accountNumber, setAccountNumber] = useState(initialData.accountNumber || '');

  // Payroll payload – delegated to PayrollForm component
  const [payrollData, setPayrollData] = useState(initialData.payroll || {});
  const handlePayrollChange = (payload) => {
    setPayrollData(payload);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      fullName,
      role,
      department,
      startDate,
      employeeId,
      sortCode,
      accountNumber,
      payroll: payrollData,
    };
    onSubmit && onSubmit(payload);
  };

  return (
    <form className="office-onboarding-card" onSubmit={handleSubmit}>
      <div className="ob-section-header">
        <Asterisk size={18} />
        <span>Office Staff Onboarding</span>
      </div>

      {/* Personal Details */}
      <div className="ob-fields-col">
        <div className="ob-form-group">
          <label className="ob-form-label">Full Name</label>
          <input
            type="text"
            className="ob-input"
            placeholder="e.g. Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div className="ob-form-group">
          <label className="ob-form-label">Role</label>
          <input
            type="text"
            className="ob-input"
            placeholder="e.g. Office Manager"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          />
        </div>
        <div className="ob-form-group">
          <label className="ob-form-label">Department</label>
          <input
            type="text"
            className="ob-input"
            placeholder="e.g. Operations"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            required
          />
        </div>
        <div className="ob-form-group">
          <label className="ob-form-label">Start Date</label>
          <input
            type="date"
            className="ob-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="ob-form-group">
          <label className="ob-form-label">Employee ID</label>
          <input
            type="text"
            className="ob-input"
            placeholder="e.g. OFF-00123"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Bank Details */}
      <div className="ob-section-header">
        <Asterisk size={18} />
        <span>Bank Details</span>
      </div>
      <div className="ob-fields-col">
        <div className="ob-form-group">
          <label className="ob-form-label">Sort Code</label>
          <input
            type="text"
            className="ob-input"
            placeholder="e.g. 12-34-56"
            value={sortCode}
            onChange={(e) => setSortCode(e.target.value)}
            required
          />
        </div>
        <div className="ob-form-group">
          <label className="ob-form-label">Account Number</label>
          <input
            type="text"
            className="ob-input"
            placeholder="e.g. 12345678"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Payroll Section – reuse existing component */}
      <PayrollForm onChange={handlePayrollChange} initialData={initialData.payroll || {}} />

      <div className="ob-submit-wrapper">
          <button type="submit" className="ob-btn-primary">
            {initialData && Object.keys(initialData).length > 0 ? 'UPDATE STAFF RECORD' : 'CREATE OFFICE STAFF'}
          </button>
      </div>
    </form>
  );
};

export default OfficeStaffOnboarding;
