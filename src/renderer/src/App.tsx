import React from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import MainLayout from './components/Layout/MainLayout'
import ScreenshotPage from './pages/ScreenshotPage'
import AboutPage from './pages/AboutPage'
import PromptPage from './pages/PromptPage'
import VocabularyPage from './pages/VocabularyPage'
import GrammarPage from './pages/GrammarPage'
import SettingsPage from './pages/SettingsPage'
import TextAnalysisPage from './pages/TextAnalysisPage'
import { ScreenshotProvider, useScreenshot } from './context/ScreenshotContext'

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#dc004e'
    }
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif'
  }
})

// Component to handle global events that require navigation or context access
function GlobalEventHandler() {
  const navigate = useNavigate();
  const { setImage } = useScreenshot();

  React.useEffect(() => {
    // Listen for auto-analyze-screenshot event
    const removeListener = window.api.onAutoAnalyzeScreenshot((image) => {
      setImage(image);
      navigate('/screenshot', { state: { autoAnalyze: true } });
    });
    return removeListener;
  }, [navigate, setImage]);

  return null;
}

function App(): React.JSX.Element {
  React.useEffect(() => {
    const initProxy = async () => {
      const port = localStorage.getItem('proxy_port');
      if (port) {
        try {
          await window.api.setProxy(port);
          console.log('Proxy set to:', port);
        } catch (e) {
          console.error('Failed to set proxy on startup:', e);
        }
      }
      
      const shortcut = localStorage.getItem('global_shortcut') || 'CommandOrControl+Q';
      try {
        await window.api.setGlobalShortcut(shortcut);
        console.log('Global shortcut initialized:', shortcut);
      } catch (e) {
        console.error('Failed to set shortcut on startup:', e);
      }
    };
    initProxy();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <ScreenshotProvider>
        <HashRouter>
          <GlobalEventHandler />
          <MainLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/screenshot" replace />} />
              <Route path="/screenshot" element={<ScreenshotPage />} />
              <Route path="/text-analysis" element={<TextAnalysisPage />} />
              <Route path="/vocabulary" element={<VocabularyPage />} />
              <Route path="/grammar" element={<GrammarPage />} />
              <Route path="/prompts" element={<PromptPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </MainLayout>
        </HashRouter>
      </ScreenshotProvider>
    </ThemeProvider>
  )
}

export default App
