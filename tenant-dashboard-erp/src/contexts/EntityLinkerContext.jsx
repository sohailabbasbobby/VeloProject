import React, { createContext, useContext, useState } from 'react';
import { MOCK_CHAUFFEURS, MOCK_CORP_CLIENTS, MOCK_PRIV_CLIENTS, MOCK_VEHICLES, MOCK_STAFF } from '../data/mockDatabase';

// Import modals so we can render them globally here
import ChauffeurProfileModal from '../components/ChauffeurProfileModal';
import CorporateProfileModal from '../components/CorporateProfileModal';
import PrivateClientProfileModal from '../components/PrivateClientProfileModal';
import VehicleProfileModal from '../components/VehicleProfileModal';
import StaffProfileModal from '../components/StaffProfileModal';
import SummaryModal from '../components/SummaryModal';

const EntityLinkerContext = createContext();

const CORPORATE_KEYWORDS = [
  'morgan', 'goldman', 'jpmorgan', 'j.p.', 'barclays', 'hsbc', 'soho house',
  'morgan stanley', 'corporate', 'ltd', 'llc', 'inc', 'group', 'capital',
  'finance', 'bank', 'equity', 'partners', 'holdings'
];

export const EntityLinkerProvider = ({ children }) => {
  const [selectedChauffeur, setSelectedChauffeur] = useState(null);
  const [selectedCorporateClient, setSelectedCorporateClient] = useState(null);
  const [selectedPrivateClient, setSelectedPrivateClient] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  
  // Summary Modal state
  const [summaryData, setSummaryData] = useState(null); // { type, title, status, ...data }

  const openDriverProfile = (driverName) => {
    if (!driverName || driverName === 'Unassigned' || driverName === 'TBD') return;
    const match = MOCK_CHAUFFEURS.find(c =>
      c.name.toLowerCase().includes(driverName.toLowerCase()) ||
      driverName.toLowerCase().includes(c.name.toLowerCase().split(' ')[0].toLowerCase())
    ) || {
      id: 'VEO-XXXX', name: driverName, status: 'On Shift',
      image: null, rating: '4.9', jobsCompleted: 847, tenure: '2.1',
    };
    setSelectedChauffeur(match);
  };

  const openClientProfile = (clientName) => {
    if (!clientName || clientName === 'Private' || clientName === 'TBD') return;
    const lc = clientName.toLowerCase();
    const isCorporate = CORPORATE_KEYWORDS.some(kw => lc.includes(kw));
    if (isCorporate) {
      const match = (MOCK_CORP_CLIENTS || []).find(c =>
        c.name?.toLowerCase().includes(lc) || lc.includes(c.name?.toLowerCase())
      ) || { id: 'CORP-XXX', name: clientName, status: 'Active', account_status: 'Active' };
      setSelectedCorporateClient(match);
    } else {
      const match = (MOCK_PRIV_CLIENTS || []).find(c =>
        c.name?.toLowerCase().includes(lc) || lc.includes((c.name || '').toLowerCase())
      ) || { id: 'PVT-XXX', name: clientName, status: 'VIP', tier: 'Black' };
      setSelectedPrivateClient(match);
    }
  };

  const openVehicleProfile = (vehicleLabel) => {
    if (!vehicleLabel || vehicleLabel === 'TBD') return;
    const match = MOCK_VEHICLES.find(v => {
      return vehicleLabel.toLowerCase().includes(v.make.toLowerCase()) ||
             vehicleLabel.toLowerCase().includes(v.model.toLowerCase()) ||
             vehicleLabel.toLowerCase().includes((v.registration || '').toLowerCase());
    }) || {
      id: 'VLO-XXXX', make: vehicleLabel.split(' ')[0] || '', model: vehicleLabel.split(' ').slice(1).join(' '),
      registration: 'N/A', status: 'Active', mileage: 0, alerts: 0, complianceStatus: 'VERIFIED', faults: []
    };
    setSelectedVehicle(match);
  };

  const openSummaryModal = (data) => {
    setSummaryData(data);
  };

  const openStaffProfile = (staffName) => {
    if (!staffName || staffName === 'TBD') return;
    const match = MOCK_STAFF.find(s => 
      s.name.toLowerCase().includes(staffName.toLowerCase()) ||
      staffName.toLowerCase().includes(s.name.toLowerCase().split(' ')[0].toLowerCase())
    ) || {
      id: 'EMP-XXXX', name: staffName, role: 'Staff', status: 'Active', shiftAvailability: 'Flexible', image: null, schedule: []
    };
    setSelectedStaff(match);
  };

  const closeSummaryModal = () => {
    setSummaryData(null);
  };

  const value = {
    openDriverProfile,
    openClientProfile,
    openVehicleProfile,
    openStaffProfile,
    openSummaryModal,
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
