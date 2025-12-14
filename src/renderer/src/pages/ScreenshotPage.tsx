import React, { useState } from 'react'
import { Button, Box, Typography, Paper, CircularProgress, Alert } from '@mui/material'
import { GeminiService } from '../services/ai/GeminiService'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function ScreenshotPage(): React.JSX.Element {
  const [image, setImage] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleScreenshot = async (): Promise<void> => {
    try {
      setError(null);
      // @ts-ignore (electronAPI is exposed in preload)
      const imgData = await window.electron.ipcRenderer.invoke('screen-shot')
      setImage(imgData)
      setAnalysis(null) // Reset previous analysis
    } catch (error) {
      console.error('Failed to take screenshot:', error)
      setError('Failed to capture screenshot.')
    }
  }

  const handleAnalyze = async (): Promise<void> => {
    if (!image || !API_KEY) {
      setError('No image to analyze or API Key missing.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const service = new GeminiService(API_KEY)
      const result = await service.analyzeImage(image)
      setAnalysis(result.text)
    } catch (err) {
      console.error(err)
      setError('Analysis failed. Please check your API key and connection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h4">Screen Shot & AI Analysis</Typography>
      
      {!API_KEY && (
        <Alert severity="warning">
          Gemini API Key is missing. Please check your .env file.
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={handleScreenshot}>
          Take Screenshot
        </Button>
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={handleAnalyze} 
          disabled={!image || loading || !API_KEY}
        >
          {loading ? <CircularProgress size={24} /> : 'Analyze with AI'}
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, overflow: 'hidden' }}>
        {/* Image Preview */}
        {image && (
          <Paper elevation={3} sx={{ p: 1, flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
            <img src={image} alt="Screenshot" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </Paper>
        )}

        {/* Analysis Result */}
        {analysis && (
          <Paper elevation={3} sx={{ p: 2, flex: 1, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>Analysis Result:</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
              {analysis}
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  )
}
