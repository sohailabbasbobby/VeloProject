import React, { useState, useEffect } from 'react';
import './B2BPool.css';

const B2BPool = () => {
  const [jobs, setJobs] = useState([
    { id: 'V-8821', tier: 'Premium MPV', miles: 42.5, price: 90.00, status: 'open' },
    { id: 'V-8822', tier: 'Ultra-Luxury', miles: 12.0, price: 250.00, status: 'open' },
  ]);

  const [negotiatingId, setNegotiatingId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  useEffect(() => {
    let timer;
    if (negotiatingId && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && negotiatingId) {
      // Fast-Track Rule: Reset on expiration
      handleReject(negotiatingId);
    }
    return () => clearInterval(timer);
  }, [negotiatingId, timeLeft]);

  const startNegotiation = (id) => {
    setNegotiatingId(id);
    setTimeLeft(600);
    setJobs(jobs.map(j => j.id === id ? { ...j, status: 'negotiation' } : j));
  };

  const handleReject = (id) => {
    setNegotiatingId(null);
    setJobs(jobs.map(j => j.id === id ? { ...j, status: 'open' } : j));
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="b2b-pool">
      <div className="pool-header">
        <h2>B2B Open Pool Marketplace</h2>
        <p className="text-muted">Live ecosystem overflow trips.</p>
      </div>

      <div className="pool-table-container surface-panel">
        <table className="b2b-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Vehicle Tier</th>
              <th>Route Miles</th>
              <th>Payout Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <React.Fragment key={job.id}>
                <tr className={job.status === 'negotiation' ? 'row-locked' : ''}>
                  <td>{job.id}</td>
                  <td>{job.tier}</td>
                  <td>{job.miles} mi</td>
                  <td className="text-gold font-bold">£{job.price.toFixed(2)}</td>
                  <td>
                    {job.status === 'open' && (
                      <div className="action-buttons">
                        <button className="btn-primary btn-sm">Accept</button>
                        <button className="btn-outline btn-sm" onClick={() => startNegotiation(job.id)}>Counter Offer</button>
                      </div>
                    )}
                    {job.status === 'negotiation' && (
                      <span className="text-danger font-bold">LOCKED</span>
                    )}
                  </td>
                </tr>
                {job.status === 'negotiation' && (
                  <tr className="negotiation-row">
                    <td colSpan="5">
                      <div className="negotiation-console pulse">
                        <div className="timer text-danger font-bold">{formatTime(timeLeft)}</div>
                        <div className="counter-inputs">
                          <label>Propose Upgraded Rate:</label>
                          <div className="input-group-inline">
                            <span className="currency">£</span>
                            <input type="number" defaultValue={(job.price + 10).toFixed(2)} />
                          </div>
                          <button className="btn-primary btn-sm ml-4">Submit Counter</button>
                          <button className="btn-outline btn-sm" onClick={() => handleReject(job.id)}>Cancel</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default B2BPool;
