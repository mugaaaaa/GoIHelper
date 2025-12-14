import React from 'react'
import { Button, Box, Typography, Paper, CircularProgress, Alert } from '@mui/material'
import { GeminiService } from '../services/ai/GeminiService'
import { useScreenshot } from '../context/ScreenshotContext'
import ReactMarkdown from 'react-markdown'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function ScreenshotPage(): React.JSX.Element {
  const { 
    image, setImage, 
    analysis, setAnalysis, 
    loading, setLoading, 
    error, setError 
  } = useScreenshot()

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
    <Box sx={{ p: 2, height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h4">Screen Shot & AI Analysis</Typography>
      
      {!API_KEY && (
        <Alert severity="warning">
          Gemini API Key is missing. Please check your .env file.
        </Alert>
      )}

      {/* Top Section: Image + Buttons */}
      <Box sx={{ display: 'flex', gap: 2, minHeight: '100px', alignItems: 'center' }}>
        
        {/* Image Preview Area */}
        <Paper 
          elevation={3} 
          sx={{ 
            width: '200px',
            height: '100px',
            minWidth: '200px',
            minHeight: '100px',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            bgcolor: image ? '#f5f5f5' : '#e0e0e0',
            overflow: 'hidden',
          }}
        >
          {image ? (
            <img src={image} alt="Screenshot" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          ) : (
            <Typography variant="body1" color="text.secondary">No Image Captured</Typography>
          )}
        </Paper>

        {/* Buttons Area (Vertical) */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: '200px', justifyContent: 'flex-start' }}>
          <Button variant="contained" size="large" onClick={handleScreenshot} fullWidth>
            Take Screenshot
          </Button>
          <Button 
            variant="contained" 
            color="secondary"
            size="large"
            onClick={handleAnalyze} 
            disabled={!image || loading || !API_KEY}
            fullWidth
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Analyze with AI'}
          </Button>
          
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </Box>

      {/* Analysis Result */}
      {analysis && (
        <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>Analysis Result:</Typography>
          <Box sx={{ '& img': { maxWidth: '100%' } }}> 
             <ReactMarkdown>{analysis}</ReactMarkdown>
          </Box>
        </Paper>
      )}
    </Box>
  )
}
