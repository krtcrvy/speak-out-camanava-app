import * as React from 'react';

type PhotoContextType = {
  idPhoto: string | null;
  facePhoto: string | null;
  setIdPhoto: (uri: string | null) => void;
  setFacePhoto: (uri: string | null) => void;
};

const PhotoContext = React.createContext<PhotoContextType | undefined>(undefined);

export function PhotoProvider({ children }: { children: React.ReactNode }) {
  const [idPhoto, setIdPhoto] = React.useState<string | null>(null);
  const [facePhoto, setFacePhoto] = React.useState<string | null>(null);

  return (
    <PhotoContext.Provider value={{ idPhoto, facePhoto, setIdPhoto, setFacePhoto }}>
      {children}
    </PhotoContext.Provider>
  );
}

export const usePhotoContext = () => {
  const context = React.useContext(PhotoContext);
  if (!context) {
    throw new Error('usePhotoContext must be used within a PhotoProvider');
  }
  return context;
};
