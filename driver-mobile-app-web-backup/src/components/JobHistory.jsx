import React, { useState } from 'react';
import './JobHistory.css';
import PostJobExpenseModal from './PostJobExpenseModal';

const JobHistory = ({ onClose }) => {
    const [selectedJob, setSelectedJob] = useState(null);

    // Mock history ledger
    const mockJobs = [
        { id: 'JOB-9999', date: 'Today, 14:30', client: 'Goldman Sachs HQ', payout: '£70.00' },
        { id: 'JOB-9998', date: 'Today, 10:15', client: 'LHR T5 Drop-off', payout: '£95.00' },
        { id: 'JOB-9995', date: 'Yesterday, 18:00', client: 'The Savoy Hotel', payout: '£45.00' }
    ];

    return (
        <div className="fullscreen-overlay job-history">
            <div className="header-nav">
                <button className="back-btn" onClick={onClose}>← Back</button>
                <h2 className="text-gold">Job History & Ledger</h2>
            </div>
            
            <div className="history-content">
                <p className="text-muted mb-m">Review historical trips and retroactively append missing tolls or parking receipts.</p>

                <div className="history-list">
                    {mockJobs.map(job => (
                        <div key={job.id} className="history-card">
                            <div className="card-top">
                                <span className="job-id text-gold">{job.id}</span>
                                <span className="job-date text-muted">{job.date}</span>
                            </div>
                            <div className="card-mid">
                                <h3>{job.client}</h3>
                                <span className="payout">{job.payout}</span>
                            </div>
                            <div className="card-bottom">
                                <button 
                                    className="btn-retro-expense" 
                                    onClick={() => setSelectedJob(job.id)}
                                >
                                    + ADD / EDIT EXPENSES
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedJob && (
                <PostJobExpenseModal onFinish={() => setSelectedJob(null)} />
            )}
        </div>
    );
};

export default JobHistory;
