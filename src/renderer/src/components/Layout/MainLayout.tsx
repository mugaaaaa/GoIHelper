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
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      <TitleBar />

      <Sidebar />

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}
