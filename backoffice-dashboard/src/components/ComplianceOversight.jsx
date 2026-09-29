import React, { useCallback } from 'react';
import { fetchPlatformCompliance, usePolling } from '../utils/api';

const dateStr = (d) => (d ? new Date(d).toLocaleDateString() : '—');

const ComplianceOversight = () => {
    const load = useCallback(() => fetchPlatformCompliance(), []);
    const { data, loading, error } = usePolling(load, 60000);

    const drivers = data?.drivers || [];
    const vehicles = data?.vehicles || [];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 18 }}>
                <h2 style={{ margin: 0, color: '#fff', letterSpacing: '0.1em' }}>COMPLIANCE OVERSIGHT</h2>
                <span style={{ fontSize: 11, color: '#888' }}>
                    {loading ? 'Scanning…' : error ? `Feed error: ${error.message}` : `Cross-tenant view: ${drivers.length} driver + ${vehicles.length} vehicle documents expiring within 60 days`}
                </span>
            </div>

            <h3 style={{ color: '#D4AF37', fontSize: 12, letterSpacing: '0.15em' }}>DRIVER LICENCES & PCO BADGES</h3>
            <table className="sd-table" style={{ width: '100%', marginBottom: 24 }}>
                <thead><tr><th>TENANT</th><th>DRIVER</th><th>REF</th><th>LICENSE EXPIRY</th><th>PCO BADGE EXPIRY</th><th>COMPLIANCE STATE</th></tr></thead>
                <tbody>
                    {drivers.map((d, i) => (
                        <tr key={i}>
                            <td>{d.tenant_name}</td>
                            <td>{d.driver_name}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{d.reference_code}</td>
                            <td>{dateStr(d.license_expiry)}</td>
                            <td>{dateStr(d.pco_badge_expiry)}</td>
                            <td>
                                <span className={`fv-status ${d.compliance_status === 'VERIFIED' ? 'ok' : d.compliance_status === 'EXPIRING' ? 'warn' : 'critical'}`}>
                                    {d.compliance_status}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {!loading && drivers.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 14 }}>No driver documents expiring in the next 60 days.</td></tr>
                    )}
                </tbody>
            </table>

            <h3 style={{ color: '#D4AF37', fontSize: 12, letterSpacing: '0.15em' }}>VEHICLE MOT / PHV / INSURANCE</h3>
            <table className="sd-table" style={{ width: '100%' }}>
                <thead><tr><th>TENANT</th><th>VEHICLE</th><th>PLATE</th><th>MOT</th><th>PHV</th><th>INSURANCE</th><th>NEXT EXPIRY</th></tr></thead>
                <tbody>
                    {vehicles.map((v, i) => (
                        <tr key={i}>
                            <td>{v.tenant_name}</td>
                            <td>{v.vehicle_name}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{v.plate_number}</td>
                            <td>{dateStr(v.mot_expiry)}</td>
                            <td>{dateStr(v.phv_expiry)}</td>
                            <td>{dateStr(v.insurance_expiry)}</td>
                            <td>{dateStr(v.next_expiry)}</td>
                        </tr>
                    ))}
                    {!loading && vehicles.length === 0 && (
                        <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: 14 }}>No vehicle documents expiring in the next 60 days.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ComplianceOversight;
