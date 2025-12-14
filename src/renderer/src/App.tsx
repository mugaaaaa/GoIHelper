import React from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/Layout/MainLayout'
import ScreenshotPage from './pages/ScreenshotPage'
import AboutPage from './pages/AboutPage'
import PromptPage from './pages/PromptPage'
import VocabularyPage from './pages/VocabularyPage'
import SettingsPage from './pages/SettingsPage'
import { ScreenshotProvider } from './context/ScreenshotContext'

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

function App(): React.JSX.Element {
  return (
    <ThemeProvider theme={theme}>
      <ScreenshotProvider>
        <HashRouter>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/screenshot" replace />} />
              <Route path="/screenshot" element={<ScreenshotPage />} />
              <Route path="/vocabulary" element={<VocabularyPage />} />
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
