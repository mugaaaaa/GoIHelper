import React from 'react'
import {
  Drawer,
  Toolbar,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import { useNavigate } from 'react-router-dom'

import CameraIcon from '@mui/icons-material/CameraAlt'
import BookIcon from '@mui/icons-material/Book'

const DRAW_WIDTH = 240

const MENU_ITEMS = [
  { text: 'Screen Shot', icon: <CameraIcon />, path: '/screenshot' },
  { text: 'About', icon: <BookIcon />, path: '/about' }
]


export default function Sidebar(): React.JSX.Element {
  const navigate = useNavigate()

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAW_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: DRAW_WIDTH, boxSizing: 'border-box' }
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {MENU_ITEMS.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton onClick={() => navigate(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  )
}
