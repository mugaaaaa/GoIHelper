import React from 'react'
import {
  Box,
  CssBaseline,
  Toolbar,
} from '@mui/material'

import TitleBar from './TitleBar'
import Sidebar from './Sidebar'

export default function MainLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <CssBaseline />

      <TitleBar />

      <Sidebar />

      <Box component="main" sx={{ flexGrow: 1, p: 3, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Toolbar />
        <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
