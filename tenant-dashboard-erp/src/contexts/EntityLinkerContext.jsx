import React, { createContext, useContext, useState, useCallback } from 'react';

// Import modals so we can render them globally here
import ChauffeurProfileModal from '../components/ChauffeurProfileModal';
import CorporateProfileModal from '../components/CorporateProfileModal';
import PrivateClientProfileModal from '../components/PrivateClientProfileModal';
import VehicleProfileModal from '../components/VehicleProfileModal';
import StaffProfileModal from '../components/StaffProfileModal';
import SummaryModal from '../components/SummaryModal';
import {
  fetchDrivers, fetchVehicles, fetchCorporateAccounts, fetchPrivateClients, fetchStaff,
  fetchDriver, fetchVehicle, fetchCorporateAccount, fetchPrivateClient, fetchStaffMember,
} from '../utils/api';

const EntityLinkerContext = createContext();

/**
 * ENTITY LINKER (Universal Cross-Linking, Global Rule 5)
 * Every driver name / vehicle ID / client name anywhere in the platform opens the
 * live profile modal: the linker resolves the entity against the DATABASE by
 * reference code first (VLO-XXXX / #V-XXXX) and name second, then fetches the full
 * live record. No dead text labels.
 */
export const EntityLinkerProvider = ({ children }) => {
  const [selectedChauffeur, setSelectedChauffeur] = useState(null);
  const [selectedCorporateClient, setSelectedCorporateClient] = useState(null);
  const [selectedPrivateClient, setSelectedPrivateClient] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  const openDriverProfile = useCallback(async (driverNameOrCode) => {
    if (!driverNameOrCode || driverNameOrCode === 'Unassigned' || driverNameOrCode === 'TBD') return;
    setSelectedChauffeur({ name: String(driverNameOrCode), loading: true });
    try {
      // Exact reference-code hit first
      const all = await fetchDrivers();
      const target = String(driverNameOrCode).trim();
      const match = all.find((d) => d.reference_code === target)
        || all.find((d) => d.full_name && d.full_name.toLowerCase() === target.toLowerCase())
        || all.find((d) => d.full_name && (d.full_name.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(d.full_name.toLowerCase().split(' ')[0].toLowerCase())));
      if (match) {
        const full = await fetchDriver(match.id);
        setSelectedChauffeur(full);
      } else {
        setSelectedChauffeur({ id: null, name: target, notFound: true });
      }
    } catch {
      setSelectedChauffeur({ id: null, name: String(driverNameOrCode), notFound: true });
    }
  }, []);

  const openClientProfile = useCallback(async (clientNameOrCode) => {
    if (!clientNameOrCode || clientNameOrCode === 'Private' || clientNameOrCode === 'TBD') return;
    const target = String(clientNameOrCode).trim();
    try {
      const corp = await fetchCorporateAccounts();
      const corpMatch = corp.find((c) => c.reference_code === target || c.company_name === target)
        || corp.find((c) => c.company_name && c.company_name.toLowerCase().includes(target.toLowerCase()));
      if (corpMatch) {
        const full = await fetchCorporateAccount(corpMatch.id);
        setSelectedCorporateClient(full);
        return;
      }
      const priv = await fetchPrivateClients();
      const privMatch = priv.find((c) => c.reference_code === target || c.full_name === target)
        || priv.find((c) => c.full_name && (c.full_name.toLowerCase().includes(target.toLowerCase()) || target.toLowerCase().includes(c.full_name.toLowerCase().split(' ')[0].toLowerCase())));
      if (privMatch) {
        const full = await fetchPrivateClient(privMatch.id);
        setSelectedPrivateClient(full);
        return;
      }
      setSelectedPrivateClient({ id: null, full_name: target, notFound: true });
    } catch {
      setSelectedPrivateClient({ id: null, full_name: target, notFound: true });
    }
  }, []);

  const openVehicleProfile = useCallback(async (vehicleLabelOrCode) => {
    if (!vehicleLabelOrCode || vehicleLabelOrCode === 'TBD') return;
    setSelectedVehicle({ name: String(vehicleLabelOrCode), loading: true });
    try {
      const all = await fetchVehicles();
      const target = String(vehicleLabelOrCode).trim().toLowerCase();
      const match = all.find((v) => v.reference_code?.toLowerCase() === target || v.plate_number?.toLowerCase() === target)
        || all.find((v) => target.includes((v.make || '').toLowerCase()) || target.includes((v.model || '').toLowerCase()) || target.includes((v.plate_number || '').toLowerCase()));
      if (match) {
        const full = await fetchVehicle(match.id);
        setSelectedVehicle(full);
      } else {
        setSelectedVehicle({ id: null, name: String(vehicleLabelOrCode), notFound: true });
      }
    } catch {
      setSelectedVehicle({ id: null, name: String(vehicleLabelOrCode), notFound: true });
    }
  }, []);

  const openStaffProfile = useCallback(async (staffNameOrCode) => {
    if (!staffNameOrCode || staffNameOrCode === 'TBD') return;
    try {
      const all = await fetchStaff();
      const target = String(staffNameOrCode).trim().toLowerCase();
      const match = all.find((s) => s.reference_code === String(staffNameOrCode).trim())
        || all.find((s) => `${s.first_name} ${s.last_name}`.toLowerCase().includes(target));
      if (match) {
        const full = await fetchStaffMember(match.id);
        setSelectedStaff(full);
      } else {
        setSelectedStaff({ id: null, name: String(staffNameOrCode), notFound: true });
      }
    } catch {
      setSelectedStaff({ id: null, name: String(staffNameOrCode), notFound: true });
    }
  }, []);

  const openSummaryModal = (data) => setSummaryData(data);
  const closeSummaryModal = () => setSummaryData(null);

  const value = {
    openDriverProfile,
    openClientProfile,
    openVehicleProfile,
    openStaffProfile,
    openSummaryModal,
    // allow hubs to re-open modals after CRUD saves with fresh data
    setSelectedChauffeur, setSelectedVehicle, setSelectedCorporateClient, setSelectedPrivateClient, setSelectedStaff,
  };

  return (
    <EntityLinkerContext.Provider value={value}>
      {children}

      {/* Global Modals */}
      <ChauffeurProfileModal isOpen={!!selectedChauffeur} onClose={() => setSelectedChauffeur(null)} chauffeur={selectedChauffeur} />
      <CorporateProfileModal isOpen={!!selectedCorporateClient} onClose={() => setSelectedCorporateClient(null)} client={selectedCorporateClient} />
      <PrivateClientProfileModal isOpen={!!selectedPrivateClient} onClose={() => setSelectedPrivateClient(null)} client={selectedPrivateClient} />
      <VehicleProfileModal isOpen={!!selectedVehicle} onClose={() => setSelectedVehicle(null)} vehicle={selectedVehicle} />
      <StaffProfileModal isOpen={!!selectedStaff} onClose={() => setSelectedStaff(null)} staff={selectedStaff} />
      <SummaryModal isOpen={!!summaryData} onClose={closeSummaryModal} data={summaryData} />
    </EntityLinkerContext.Provider>
  );
};

export const useEntityLinker = () => useContext(EntityLinkerContext);
