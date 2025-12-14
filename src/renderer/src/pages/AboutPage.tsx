import React from 'react'
import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

export default function AboutPage(): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Typography variant="h4">{t('about.title')}</Typography>
      <Typography variant="body1">
        {t('about.description')}
      </Typography>
    </Box>
  )
}
