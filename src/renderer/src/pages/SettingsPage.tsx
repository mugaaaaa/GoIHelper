import React, { useEffect, useState } from 'react';
import { Box, Typography, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Paper, TextField, Button, Snackbar, Alert } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function SettingsPage(): React.JSX.Element {
  const { t, i18n } = useTranslation();
  
  // State
  const [proxyPort, setProxyPort] = useState('7897');
  const [geminiKey, setGeminiKey] = useState('');
  const [qwenKey, setQwenKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [globalShortcut, setGlobalShortcut] = useState('CommandOrControl+Q');
  const [recordingShortcut, setRecordingShortcut] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    const storedProxyPort = localStorage.getItem('proxy_port') || '7897';
    setProxyPort(storedProxyPort);

    const storedGeminiKey = localStorage.getItem('gemini_api_key') || '';
    setGeminiKey(storedGeminiKey);
    
    const storedQwenKey = localStorage.getItem('qwen_api_key') || '';
    setQwenKey(storedQwenKey);

    const storedModel = localStorage.getItem('selected_model') || 'gemini-2.5-flash';
    setSelectedModel(storedModel);

    const storedShortcut = localStorage.getItem('global_shortcut') || 'CommandOrControl+Q';
    setGlobalShortcut(storedShortcut);
  }, []);

  const handleLanguageChange = (event: SelectChangeEvent) => {
    i18n.changeLanguage(event.target.value as string);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recordingShortcut) return;
    
    e.preventDefault();
    
    const keys: string[] = [];
    if (e.ctrlKey) keys.push('CommandOrControl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    if (e.metaKey) keys.push('Super');
    
    // Key processing
    let key = e.key.toUpperCase();
    if (key === 'CONTROL' || key === 'ALT' || key === 'SHIFT' || key === 'META') return;
    
    keys.push(key);
    
    const shortcut = keys.join('+');
    setGlobalShortcut(shortcut);
    setRecordingShortcut(false);
  };

  const handleSave = async () => {
    localStorage.setItem('gemini_api_key', geminiKey);
    localStorage.setItem('qwen_api_key', qwenKey);
    localStorage.setItem('proxy_port', proxyPort);
    localStorage.setItem('selected_model', selectedModel);
    localStorage.setItem('global_shortcut', globalShortcut);
    
    // Apply proxy settings
    try {
      if (proxyPort) {
        await window.api.setProxy(proxyPort);
      }
      
      const success = await window.api.setGlobalShortcut(globalShortcut);
      if (!success) {
        // You might want to show a specific error message here if registration fails
        console.warn('Failed to register shortcut');
      }

      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto' }}>
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom>
          {t('settings.title')}
        </Typography>

        <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('settings.general')}
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

        <TextField
          label={t('settings.proxyPort')}
          fullWidth
          value={proxyPort}
          onChange={(e) => setProxyPort(e.target.value)}
          sx={{ mt: 3 }}
          helperText="Default: 7897"
        />

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            {t('settings.globalShortcut') || 'Global Shortcut'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              value={recordingShortcut ? 'Recording...' : globalShortcut}
              InputProps={{
                readOnly: true,
              }}
              onKeyDown={handleKeyDown}
              onClick={() => setRecordingShortcut(true)}
              onBlur={() => setRecordingShortcut(false)}
              placeholder="Click to record shortcut"
              helperText={recordingShortcut ? 'Press keys (e.g. Ctrl+Q)...' : 'Click to change'}
            />
            <Button 
              variant="outlined" 
              onClick={() => {
                setGlobalShortcut('CommandOrControl+Q');
                setRecordingShortcut(false);
              }}
            >
              Reset
            </Button>
          </Box>
        </Box>
      </Paper>

      <Paper elevation={1} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('settings.aiModel')}
        </Typography>
        
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="model-select-label">{t('settings.selectModel')}</InputLabel>
          <Select
            labelId="model-select-label"
            value={selectedModel}
            label={t('settings.selectModel')}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <MenuItem value="gemini-2.5-flash">Gemini 2.5 Flash</MenuItem>
            <MenuItem value="qwen3-vl-flash">Qwen3 VL Flash (Aliyun)</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label={t('settings.geminiKey')}
          fullWidth
          value={geminiKey}
          onChange={(e) => setGeminiKey(e.target.value)}
          sx={{ mt: 3 }}
          type="password"
          helperText="For Gemini Models"
        />

        <TextField
          label={t('settings.qwenKey')}
          fullWidth
          value={qwenKey}
          onChange={(e) => setQwenKey(e.target.value)}
          sx={{ mt: 3 }}
          type="password"
          helperText="For Qwen Models (Aliyun DashScope)"
        />

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" onClick={handleSave}>
            {t('common.save')}
          </Button>
        </Box>
      </Paper>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {t('settings.saveSuccess')}
        </Alert>
      </Snackbar>
      </Box>
    </Box>
  );
}
