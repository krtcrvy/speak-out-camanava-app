import { createStore } from 'zustand';

type SignUpStoreState = {
  steps: string[];
  currentStep: number;
};

type SignUpStoreActions = {
  setCurrentStep: (currentStep: number) => void;
};

const initalState: SignUpStoreState = {
  steps: [
    'Personal Info',
    'Capture ID',
    'Face Verification',
    'OTP Verification',
    'Create PIN',
    'Confirm PIN',
  ],
  currentStep: 0,
};

type SignUpStore = SignUpStoreState & SignUpStoreActions;

export const signUpStore = createStore<SignUpStore>()((set) => ({
  ...initalState,
  setCurrentStep: (currentStep) => set({ currentStep }),
}));
