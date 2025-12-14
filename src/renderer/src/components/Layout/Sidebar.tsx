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
import { useTranslation } from 'react-i18next'

import CameraIcon from '@mui/icons-material/CameraAlt'
import BookIcon from '@mui/icons-material/Book'
import SettingsIcon from '@mui/icons-material/Settings'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import DescriptionIcon from '@mui/icons-material/Description'
import TextFieldsIcon from '@mui/icons-material/TextFields'
import AutoStoriesIcon from '@mui/icons-material/AutoStories'

const DRAW_WIDTH = 160

export default function Sidebar(): React.JSX.Element {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const MENU_ITEMS = [
    { text: t('sidebar.screenshot'), icon: <CameraIcon />, path: '/screenshot' },
    { text: t('sidebar.textAnalysis'), icon: <TextFieldsIcon />, path: '/text-analysis' },
    { text: t('sidebar.vocabulary'), icon: <MenuBookIcon />, path: '/vocabulary' },
    { text: t('sidebar.grammar'), icon: <AutoStoriesIcon />, path: '/grammar' },
    { text: t('sidebar.prompts'), icon: <DescriptionIcon />, path: '/prompts' },
    { text: t('sidebar.settings'), icon: <SettingsIcon />, path: '/settings' },
    { text: t('sidebar.about'), icon: <BookIcon />, path: '/about' }
  ]

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
