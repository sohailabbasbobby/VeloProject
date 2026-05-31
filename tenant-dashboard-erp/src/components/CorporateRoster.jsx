import React from 'react';
import './CorporateRoster.css';

const CorporateRoster = () => {
  return (
    <div className="corporate-roster">
      <div className="corp-header flex-row space-between">
        <div>
          <h2>Company Travel Roster</h2>
          <p className="text-muted">Manage authorized personnel for corporate travel booking.</p>
        </div>
        <button className="btn-outline">➕ Add Employee</button>
      </div>

      <div className="roster-table-wrapper surface-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Department</th>
              <th>Travel Limit Class</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Sarah Mitchell</td>
              <td>Executive Board</td>
              <td className="text-gold font-bold">Unrestricted (Ultra-Luxury)</td>
              <td><span className="badge badge-released">ACTIVE</span></td>
              <td><button className="btn-outline">Edit</button></td>
            </tr>
            <tr>
              <td>Robert Johnson</td>
              <td>Legal & Compliance</td>
              <td>Standard (Executive Tier)</td>
              <td><span className="badge badge-released">ACTIVE</span></td>
              <td><button className="btn-outline">Edit</button></td>
            </tr>
            <tr>
              <td>Emily Davis</td>
              <td>Client Relations</td>
              <td>Standard (Executive Tier)</td>
              <td><span className="badge badge-frozen">REVOKED</span></td>
              <td><button className="btn-outline">Edit</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CorporateRoster;
