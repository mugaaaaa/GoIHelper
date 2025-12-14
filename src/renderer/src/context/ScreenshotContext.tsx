import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface DetectedWord {
  word: string;
  reading?: string;
  meaning?: string;
  note?: string;
}

export interface DetectedGrammar {
  grammar: string;
  reading?: string;
  structure?: string;
  meaning?: string;
  context?: string;
  examples?: string;
  note?: string;
}

interface ScreenshotState {
  image: string | null;
  analysis: string | null;
  detectedWords: DetectedWord[];
  detectedGrammar: DetectedGrammar[];
  loading: boolean;
  error: string | null;
  setImage: (image: string | null) => void;
  setAnalysis: (analysis: string | null) => void;
  setDetectedWords: (words: DetectedWord[]) => void;
  setDetectedGrammar: (grammar: DetectedGrammar[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const ScreenshotContext = createContext<ScreenshotState | undefined>(undefined);

export const ScreenshotProvider = ({ children }: { children: ReactNode }): React.JSX.Element => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [detectedWords, setDetectedWords] = useState<DetectedWord[]>([]);
  const [detectedGrammar, setDetectedGrammar] = useState<DetectedGrammar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <ScreenshotContext.Provider
      value={{
        image,
        analysis,
        detectedWords,
        detectedGrammar,
        loading,
        error,
        setImage,
        setAnalysis,
        setDetectedWords,
        setDetectedGrammar,
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
