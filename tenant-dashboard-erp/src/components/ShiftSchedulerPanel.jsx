import React, { useState } from 'react';
import './ShiftSchedulerPanel.css';

const ShiftSchedulerPanel = ({ onBack }) => {
    // Generate a static 7-day grid starting from "Today"
    const days = ['Mon 12', 'Tue 13', 'Wed 14', 'Thu 15', 'Fri 16', 'Sat 17', 'Sun 18'];
    const vehicles = [
        { id: 'LN26 XAA', type: 'S-Class' },
        { id: 'LC24 ZBB', type: 'Range Rover' },
        { id: 'HQ POOL', type: 'V-Class' }
    ];

    const [schedule, setSchedule] = useState({
        'LN26 XAA-Mon 12': { driver: 'Mr. Bobby', shift: 'EARLY' },
        'LC24 ZBB-Mon 12': { driver: 'J. Smith', shift: 'LATE' },
        'HQ POOL-Mon 12': { driver: 'Unassigned', shift: 'STANDBY' }
    });

    const [saving, setSaving] = useState(false);

    const handleCellClick = (vehicleId, day) => {
        const key = `${vehicleId}-${day}`;
        const current = schedule[key]?.shift;
        let nextShift = 'EARLY';
        if (current === 'EARLY') nextShift = 'LATE';
        else if (current === 'LATE') nextShift = 'NIGHT';
        else if (current === 'NIGHT') nextShift = 'STANDBY';
        else if (current === 'STANDBY') nextShift = null;

        setSchedule(prev => ({
            ...prev,
            [key]: nextShift ? { driver: 'Pending', shift: nextShift } : null
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setTimeout(() => setSaving(false), 1500);
    };

    const getBadgeClass = (shiftType) => {
        if (!shiftType) return '';
        return `badge-${shiftType.toLowerCase()}`;
    };

    return (
        <div className="scheduler-panel">
            <div className="scheduler-header">
                <div>
                    <button className="btn-back" onClick={onBack}>← Back to Control Center</button>
                    <h2 className="text-gold mt-m">Weekly Shift Roster Visual Scheduler</h2>
                    <p className="text-muted text-sm">Assign chauffeurs to assets across a 7-day horizon. Changes sync directly to the mobile app.</p>
                </div>
                <button className="btn-save-schedule" onClick={handleSave} disabled={saving}>
                    {saving ? 'SYNCING...' : 'SAVE ROSTER TO CLOUD'}
                </button>
            </div>

            <div className="scheduler-grid-container">
                <table className="scheduler-grid">
                    <thead>
                        <tr>
                            <th className="grid-corner">Vehicle / Asset</th>
                            {days.map(day => <th key={day}>{day}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {vehicles.map(v => (
                            <tr key={v.id}>
                                <td className="vehicle-cell">
                                    <div className="text-white font-bold">{v.id}</div>
                                    <div className="text-muted text-xs">{v.type}</div>
                                </td>
                                {days.map(day => {
                                    const cellData = schedule[`${v.id}-${day}`];
                                    return (
                                        <td 
                                            key={day} 
                                            className={`schedule-cell ${cellData ? 'assigned' : 'empty'}`}
                                            onClick={() => handleCellClick(v.id, day)}
                                        >
                                            {cellData ? (
                                                <div className="cell-content">
                                                    <span className={`grid-badge ${getBadgeClass(cellData.shift)}`}>{cellData.shift}</span>
                                                    <span className="driver-name">{cellData.driver}</span>
                                                </div>
                                            ) : (
                                                <span className="add-shift-hint">+ ADD</span>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ShiftSchedulerPanel;
