import React from 'react'
import {
  Typography,
  useTheme,
  Box,
  IconButton
} from '@mui/material'
import RemoveIcon from '@mui/icons-material/Remove'
import CropSquareIcon from '@mui/icons-material/CropSquare'
import CloseIcon from '@mui/icons-material/Close'

const TITLEBAR_HEIGHT = 40
const TITLEBAR_WIDTH = 46

export default function TitleBar(): React.JSX.Element {
  const theme = useTheme()

  const handleMinimize = (): void => window.electronAPI.minimize()
  const handleMaximize = (): void => window.electronAPI.maximize()
  const handleClose = (): void => window.electronAPI.close()

  return (
    <Box
      component="header"
      sx={{
        height: TITLEBAR_HEIGHT,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.drawer + 1,  // Ensure it is above the drawer
        // backgroundColor: theme.palette.primary.main,
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 2,

        // 
        WebkitAppRegion: 'drag', // Make the title bar draggable
        userSelect: 'none' // Prevent text selection
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
        GoI Helper
      </Typography>

      <Box sx={{ display: 'flex', WebkitAppRegion: 'no-drag' }}>
        <IconButton
          onClick={handleMinimize}
          size="small"
          sx={{
            width: TITLEBAR_WIDTH,
            height: TITLEBAR_HEIGHT,
            borderRadius: 0,
            '&:hover': { backgroundColor: theme.palette.action.hover }
          }}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
        <IconButton
          onClick={handleMaximize}
          size="small"
          sx={{
            width: TITLEBAR_WIDTH,
            height: TITLEBAR_HEIGHT,
            borderRadius: 0,
            '&:hover': { backgroundColor: theme.palette.action.hover }
          }}
        >
          <CropSquareIcon fontSize="small" />
        </IconButton>

        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            width: TITLEBAR_WIDTH,
            height: TITLEBAR_HEIGHT,
            borderRadius: 0,
            '&:hover': { backgroundColor: theme.palette.action.hover }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  )
}
