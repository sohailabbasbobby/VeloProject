import React, { useState, useEffect } from 'react';
import './VehicleFinancialPanel.css';

const VehicleFinancialPanel = ({ vehicleId, onBack }) => {
    const [productivity, setProductivity] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lightboxUrl, setLightboxUrl] = useState(null);

    useEffect(() => {
        const fetchProductivity = async () => {
            try {
                const response = await fetch(`http://localhost:8000/api/analytics/vehicle-productivity/${vehicleId}`, {
                    headers: { 'x-tenant-id': 'TENANT-CORP-001' }
                });
                const data = await response.json();
                if (response.ok) {
                    setProductivity(data.productivity);
                }
            } catch (error) {
                console.error("Failed to fetch vehicle productivity", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProductivity();
    }, [vehicleId]);

    if (isLoading) return <div className="p-xl text-gold">Crunching Vehicle Productivity Telemetry...</div>;
    if (!productivity) return <div className="p-xl text-danger">Failed to load analytics.</div>;

    const { expenses } = productivity;

    return (
        <div className="financial-panel">
            <div className="panel-header-nav">
                <button className="btn-back" onClick={onBack}>← Back to Fleet Vault</button>
                <div className="header-titles">
                    <h2 className="text-gold">Financial Productivity Engine</h2>
                    <p className="text-muted">Asset Analysis for {vehicleId}</p>
                </div>
            </div>

            <div className="metrics-grid">
                {/* REVENUE */}
                <div className="metric-card gross-card">
                    <h3>Gross Booking Revenue</h3>
                    <div className="metric-value text-gold">£{productivity.gross_revenue_pounds.toFixed(2)}</div>
                    <div className="metric-trend text-success">Mock 30-Day Trajectory</div>
                </div>

                {/* EXPENSES */}
                <div className="metric-card outlays-card">
                    <h3>Total Fleet Outlays</h3>
                    <div className="metric-value text-danger">£{expenses.total_outlays_pounds.toFixed(2)}</div>
                    <div className="outlay-breakdown">
                        <div className="outlay-row">
                            <span>Fixed Asset Burn (Finance/Ins)</span>
                            <span>£{(expenses.monthly_finance_fixed + expenses.monthly_insurance_fixed).toFixed(2)}</span>
                        </div>
                        <div className="outlay-row">
                            <span>Ride-Linked Tolls & Parking</span>
                            <span>£{expenses.booking_expenses.toFixed(2)}</span>
                        </div>
                        <div className="outlay-row">
                            <span>Shift Consumables (Fuel/Wash)</span>
                            <span>£{expenses.general_expenses.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* NET YIELD */}
                <div className="metric-card yield-card">
                    <h3>Net Asset Yield</h3>
                    <div className="metric-value text-success">£{productivity.net_yield_pounds.toFixed(2)}</div>
                    <div className="metric-trend text-success">▲ {productivity.trend} MoM</div>
                </div>
            </div>

            <div className="ledger-preview">
                <h3 className="ledger-title">Recent Ledger Postings</h3>
                <table className="ledger-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Evidence</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span className="badge-booking">RIDE-LINKED</span></td>
                            <td>Toll Charge - Job #JOB-9999</td>
                            <td className="text-danger">-£3.50</td>
                            <td>
                                <button className="badge-receipt" onClick={() => setLightboxUrl('https://cdn.velo.network/receipts/rec_TOLL999.jpg')}>
                                    [ View Receipt ]
                                </button>
                            </td>
                        </tr>
                        <tr>
                            <td><span className="badge-general">SHIFT OUTLAY</span></td>
                            <td>Fuel Top-up - Waitrose</td>
                            <td className="text-danger">-£80.00</td>
                            <td>
                                <button className="badge-receipt" onClick={() => setLightboxUrl('https://cdn.velo.network/receipts/rec_FUEL888.jpg')}>
                                    [ View Receipt ]
                                </button>
                            </td>
                        </tr>
                        <tr>
                            <td><span className="badge-fixed">OVERHEAD</span></td>
                            <td>Monthly Vehicle Insurance Premium</td>
                            <td className="text-danger">-£250.00</td>
                            <td><span className="text-muted text-sm">-</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {lightboxUrl && (
                <div className="receipt-lightbox" onClick={() => setLightboxUrl(null)}>
                    <div className="lightbox-content" onClick={e => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={() => setLightboxUrl(null)}>✖ CLOSE EVIDENCE</button>
                        <div className="mock-receipt-graphic">
                            <span className="text-gold text-lg font-bold">VELO NETWORK</span>
                            <span className="text-muted text-sm mt-xs">Receipt ID: {lightboxUrl.split('/').pop()}</span>
                            <div className="receipt-lines mt-l"></div>
                            <div className="receipt-lines"></div>
                            <div className="receipt-lines"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehicleFinancialPanel;
