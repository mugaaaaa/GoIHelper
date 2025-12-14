import React from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function SettingsPage(): React.JSX.Element {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (event: SelectChangeEvent) => {
    i18n.changeLanguage(event.target.value as string);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        {t('settings.title')}
      </Typography>

      <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('settings.language')}
        </Typography>
        
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="language-select-label">{t('settings.selectLanguage')}</InputLabel>
          <Select
            labelId="language-select-label"
            id="language-select"
            value={i18n.language}
            label={t('settings.selectLanguage')}
            onChange={handleLanguageChange}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="ja">日本語</MenuItem>
            <MenuItem value="zh">中文</MenuItem>
          </Select>
        </FormControl>
      </Paper>
    </Box>
  );
}
