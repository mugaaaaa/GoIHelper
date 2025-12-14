import React from 'react'
import { Box, Typography } from '@mui/material'

export default function AboutPage(): React.JSX.Element {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4">About</Typography>
      <Typography variant="body1">
        This is the GoIHelper application.
      </Typography>
    </Box>
  )
}
