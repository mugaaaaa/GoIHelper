import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DetectedWord {
  word: string;
  reading?: string;
  meaning?: string;
  note?: string;
}

interface ScreenshotState {
  image: string | null;
  analysis: string | null;
  detectedWords: DetectedWord[];
  loading: boolean;
  error: string | null;
  setImage: (image: string | null) => void;
  setAnalysis: (analysis: string | null) => void;
  setDetectedWords: (words: DetectedWord[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const ScreenshotContext = createContext<ScreenshotState | undefined>(undefined);

export const ScreenshotProvider = ({ children }: { children: ReactNode }): React.JSX.Element => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [detectedWords, setDetectedWords] = useState<DetectedWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <ScreenshotContext.Provider
      value={{
        image,
        analysis,
        detectedWords,
        loading,
        error,
        setImage,
        setAnalysis,
        setDetectedWords,
        setLoading,
        setError,
      }}
    >
      {children}
    </ScreenshotContext.Provider>
  );
};

export const useScreenshot = (): ScreenshotState => {
  const context = useContext(ScreenshotContext);
  if (!context) {
    throw new Error('useScreenshot must be used within a ScreenshotProvider');
  }
  return context;
};
