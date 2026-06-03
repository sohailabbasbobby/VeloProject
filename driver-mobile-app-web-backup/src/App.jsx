import React, { useState, useEffect } from 'react';
import ShiftGatekeeper from './components/ShiftGatekeeper';
import MapWorkspace from './components/MapWorkspace';
import AssignmentModal from './components/AssignmentModal';
import ActiveRideModal from './components/ActiveRideModal';
import DigitalPagingBoard from './components/DigitalPagingBoard';
import SidebarDrawer from './components/SidebarDrawer';
import DefectReportForm from './components/DefectReportForm';
import PostJobExpenseModal from './components/PostJobExpenseModal';
import ShiftExpenseLog from './components/ShiftExpenseLog';
import JobHistory from './components/JobHistory';
import MyRoster from './components/MyRoster';
import Messaging from './components/Messaging';

// App States: OFFLINE, IDLE, ASSIGNMENT_PENDING, ON_TRIP
function App() {
  const [appState, setAppState] = useState('OFFLINE');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pagingBoardOpen, setPagingBoardOpen] = useState(false);
  const [defectModalOpen, setDefectModalOpen] = useState(false);
  
  const [postJobExpenseOpen, setPostJobExpenseOpen] = useState(false);
  const [shiftExpenseLogOpen, setShiftExpenseLogOpen] = useState(false);
  const [jobHistoryOpen, setJobHistoryOpen] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [messagingOpen, setMessagingOpen] = useState(false);

  // Dev trigger for assignment
  useEffect(() => {
    if (appState === 'IDLE') {
      const timer = setTimeout(() => {
        setAppState('ASSIGNMENT_PENDING');
      }, 3000); // Trigger assignment 3 seconds after going IDLE
      return () => clearTimeout(timer);
    }
  }, [appState]);

  return (
    <>
      {/* Background Map layer is always present to provide context underneath overlays */}
      <MapWorkspace 
        status={appState}
        onGoOnBreak={() => { alert('Going on break...') }}
        toggleSidebar={() => setSidebarOpen(true)}
      >
        {appState === 'ASSIGNMENT_PENDING' && (
          <AssignmentModal 
            onAccept={() => setAppState('ON_TRIP')}
          />
        )}

        {appState === 'ON_TRIP' && (
          <ActiveRideModal 
            onLaunchPagingBoard={() => setPagingBoardOpen(true)}
            onCompleteTrip={() => {
                setAppState('POST_TRIP_EXPENSE');
                setPostJobExpenseOpen(true);
            }}
          />
        )}
      </MapWorkspace>

      {/* Fullscreen Overlays */}
      {appState === 'OFFLINE' && (
        <ShiftGatekeeper 
          onGoOnline={() => setAppState('IDLE')} 
        />
      )}

      {pagingBoardOpen && (
        <DigitalPagingBoard onClose={() => setPagingBoardOpen(false)} />
      )}

      <SidebarDrawer 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onGoOffline={() => {
          setSidebarOpen(false);
          setAppState('OFFLINE');
        }}
        onReportDefect={() => setDefectModalOpen(true)}
        onLogShiftExpense={() => { setSidebarOpen(false); setShiftExpenseLogOpen(true); }}
        onViewJobHistory={() => { setSidebarOpen(false); setJobHistoryOpen(true); }}
        onViewRoster={() => setRosterOpen(true)}
        onViewMessaging={() => setMessagingOpen(true)}
      />

      {defectModalOpen && (
        <DefectReportForm onClose={() => setDefectModalOpen(false)} />
      )}

      {postJobExpenseOpen && (
        <PostJobExpenseModal onFinish={() => {
            setPostJobExpenseOpen(false);
            setAppState('IDLE');
        }} />
      )}

      {shiftExpenseLogOpen && (
        <ShiftExpenseLog onClose={() => setShiftExpenseLogOpen(false)} />
      )}

      {jobHistoryOpen && (
        <JobHistory onClose={() => setJobHistoryOpen(false)} />
      )}

      {rosterOpen && (
        <MyRoster onBack={() => setRosterOpen(false)} />
      )}

      {messagingOpen && (
        <Messaging onBack={() => setMessagingOpen(false)} />
      )}
    </>
  );
}

export default App;
