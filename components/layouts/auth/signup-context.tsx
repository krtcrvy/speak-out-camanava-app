import React, { createContext, useContext, useState } from 'react';

type SignUpData = {
  first_name?: string;
  last_name?: string;
  contact_no?: string;
  email?: string;
  address?: string;
  birthdate?: string;
  gender?: string;
  agreed_terms?: boolean;
  idPhoto?: string | null;
  facePhoto?: string | null;
  verification_status?: string;
};

type SignUpContextType = {
  data: SignUpData;
  setData: (values: Partial<SignUpData>) => void;
  resetData: () => void;
  appPin: string;
  setAppPin: (pin: string) => void;
};

const SignUpContext = createContext<SignUpContextType | undefined>(undefined);

export const SignUpProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setDataState] = useState<SignUpData>({});
  const [appPin, setAppPin] = useState<string>('');

  const setData = (values: Partial<SignUpData>) => {
    setDataState((prev) => ({ ...prev, ...values }));
  };

  const resetData = () => {
    setDataState({});
    setAppPin('');
  };

  return (
    <SignUpContext.Provider value={{ data, setData, resetData, appPin, setAppPin }}>
      {children}
    </SignUpContext.Provider>
  );
};

export const useSignUpContext = () => {
  const context = useContext(SignUpContext);
  if (!context) {
    throw new Error('useSignUpContext must be used within a SignUpProvider');
  }
  return context;
};
