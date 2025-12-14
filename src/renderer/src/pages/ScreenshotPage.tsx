import React, { useState } from 'react'
import { Button, Box, Typography, Paper } from '@mui/material'

export default function ScreenshotPage(): React.JSX.Element {
  const [image, setImage] = useState<string | null>(null)

  const handleScreenshot = async (): Promise<void> => {
    try {
      // @ts-ignore (electronAPI is exposed in preload)
      const imgData = await window.electron.ipcRenderer.invoke('screen-shot')
      setImage(imgData)
    } catch (error) {
      console.error('Failed to take screenshot:', error)
    }
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Screen Shot & AI Analysis
      </Typography>
      <Button variant="contained" color="primary" onClick={handleScreenshot} sx={{ mb: 2 }}>
        Take Screenshot
      </Button>
      {image && (
        <Paper elevation={3} sx={{ p: 1, maxWidth: '100%', overflow: 'hidden' }}>
          <img src={image} alt="Screenshot" style={{ maxWidth: '100%', height: 'auto' }} />
        </Paper>
      )}
    </Box>
  )
}
