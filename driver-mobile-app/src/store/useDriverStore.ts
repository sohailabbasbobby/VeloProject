import { create } from 'zustand';

export interface DriverState {
  currentStage: 'STAGE1' | 'STAGE2_IDLE' | 'STAGE2_TAKEOVER' | 'STAGE3' | 'STAGE4_SUMMARY' | 'STAGE4_CANCELLED' | 'LANDSCAPE_PAGING';
  tripPhase: 1 | 2 | 3;
  tenantPayrollType: 'PERCENTAGE_SPLIT' | 'FIXED_WAGE';
  isSidebarOpen: boolean;
  sidebarActiveTab: 'NONE' | 'PROFILE' | 'HISTORY' | 'EARNINGS' | 'VEHICLE' | 'SETTINGS';
  odometerValue: string;
  hasCameraPayload: boolean;
  isAdminApprovalPending: boolean;
  compliance: {
    pristine: boolean;
    cabin: boolean;
    tyres: boolean;
    fuel: boolean;
  };
  countdownSeconds: number;
  starRating: number;
  summaryComments: string;
  cancelReason: string;
  customCancelReason: string;
  
  // Setters
  setCurrentStage: (stage: DriverState['currentStage']) => void;
  setTripPhase: (phase: DriverState['tripPhase']) => void;
  setSidebarOpen: (isOpen: boolean) => void;
  setSidebarActiveTab: (tab: DriverState['sidebarActiveTab']) => void;
  setOdometerValue: (val: string) => void;
  setHasCameraPayload: (val: boolean) => void;
  setIsAdminApprovalPending: (val: boolean) => void;
  toggleCompliance: (key: keyof DriverState['compliance']) => void;
  setCountdownSeconds: (seconds: number) => void;
  decrementCountdown: () => void;
  setStarRating: (val: number) => void;
  setSummaryComments: (val: string) => void;
  setCancelReason: (val: string) => void;
  setCustomCancelReason: (val: string) => void;
}

export const useDriverStore = create<DriverState>((set) => ({
  currentStage: 'STAGE1',
  tripPhase: 1,
  tenantPayrollType: 'PERCENTAGE_SPLIT',
  isSidebarOpen: false,
  sidebarActiveTab: 'NONE',
  odometerValue: '',
  hasCameraPayload: false,
  isAdminApprovalPending: false,
  compliance: {
    pristine: false,
    cabin: false,
    tyres: false,
    fuel: false
  },
  countdownSeconds: 120,
  starRating: 0,
  summaryComments: '',
  cancelReason: '',
  customCancelReason: '',

  setCurrentStage: (stage) => set({ currentStage: stage }),
  setTripPhase: (phase) => set({ tripPhase: phase }),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  setSidebarActiveTab: (tab) => set({ sidebarActiveTab: tab }),
  setOdometerValue: (val) => set({ odometerValue: val }),
  setHasCameraPayload: (val) => set({ hasCameraPayload: val }),
  setIsAdminApprovalPending: (val) => set({ isAdminApprovalPending: val }),
  toggleCompliance: (key) => set((state) => ({ 
    compliance: { ...state.compliance, [key]: !state.compliance[key] } 
  })),
  setCountdownSeconds: (seconds) => set({ countdownSeconds: seconds }),
  decrementCountdown: () => set((state) => ({ countdownSeconds: Math.max(0, state.countdownSeconds - 1) })),
  setStarRating: (val) => set({ starRating: val }),
  setSummaryComments: (val) => set({ summaryComments: val }),
  setCancelReason: (val) => set({ cancelReason: val }),
  setCustomCancelReason: (val) => set({ customCancelReason: val })
}));
