import React, { useEffect, useState } from 'react'
import { 
  Button, Box, Typography, Paper, CircularProgress, Alert, MenuItem, Select, InputLabel, FormControl,
  Card, CardContent, CardActions, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Divider, Chip
} from '@mui/material'
import { GeminiService } from '../services/ai/GeminiService'
import { useScreenshot, DetectedWord } from '../context/ScreenshotContext'
import ReactMarkdown from 'react-markdown'
import { Prompt, VocabularyBook } from '../../../preload/index'
import { useTranslation } from 'react-i18next'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const VOCAB_INSTRUCTION = `

---
**INSTRUCTION FOR AI:**
Please output the response in two parts:
1. The analysis as requested above (in Markdown).
2. A structured list of key vocabulary found in the text, in JSON format.

Separate the two parts with this exact marker:
---VOCAB-JSON-START---

The JSON should be a list of objects with these keys: "word", "reading", "meaning", "note".
The "note" should be the sentence where the word appears or any other context.
Example:
[
  {"word": "猫", "reading": "neko", "meaning": "Cat", "note": "猫がいます"}
]
`;

export default function ScreenshotPage(): React.JSX.Element {
  const { t } = useTranslation()
  const { 
    image, setImage, 
    analysis, setAnalysis, 
    detectedWords, setDetectedWords,
    loading, setLoading, 
    error, setError 
  } = useScreenshot()

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<number | ''>('');
  
  const [vocabBooks, setVocabBooks] = useState<VocabularyBook[]>([]);
  const [defaultBookId, setDefaultBookId] = useState<number | ''>('');

  // Manual Add Dialog State
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualData, setManualData] = useState({ 
    word: '', reading: '', meaning: '', note: '', bookId: '' as number | '' 
  });

  useEffect(() => {
    const initData = async () => {
      try {
        const [promptsData, booksData] = await Promise.all([
          window.api.getPrompts(),
          window.api.getBooks()
        ]);
        
        setPrompts(promptsData);
        if (promptsData.length > 0) setSelectedPromptId(promptsData[0].id);

        setVocabBooks(booksData);
        if (booksData.length > 0) setDefaultBookId(booksData[0].id);

      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };
    initData();
  }, []);

  const handleScreenshot = async (): Promise<void> => {
    try {
      setError(null);
      // @ts-ignore
      const imgData = await window.electron.ipcRenderer.invoke('screen-shot')
      setImage(imgData)
      setAnalysis(null) 
      setDetectedWords([])
    } catch (error) {
      console.error('Failed to take screenshot:', error)
      setError(t('screenshot.errorCaptureFailed'))
    }
  }

  const handleAnalyze = async (): Promise<void> => {
    if (!image || !API_KEY) {
      setError(t('screenshot.errorNoImage'))
      return
    }

    setLoading(true)
    setError(null)
    setDetectedWords([])
    
    try {
      const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
      const promptText = (selectedPrompt ? selectedPrompt.content : '') + VOCAB_INSTRUCTION;

      const service = new GeminiService(API_KEY)
      const result = await service.analyzeImage(image, promptText)
      
      console.log('Gemini Raw Result:', result.text); // Debug Log

      const parts = result.text.split('---VOCAB-JSON-START---');
      setAnalysis(parts[0]);

      if (parts[1]) {
        try {
          // Clean JSON string (remove markdown code blocks if present)
          const jsonStr = parts[1].replace(/```json/g, '').replace(/```/g, '').trim();
          const words = JSON.parse(jsonStr);
          if (Array.isArray(words)) {
            // Map 'context' to 'note' if AI still returns 'context'
            const mappedWords = words.map(w => ({
              ...w,
              note: w.note || w.context
            }));
            setDetectedWords(mappedWords);
          }
        } catch (e) {
          console.error('Failed to parse vocabulary JSON:', e);
        }
      }

    } catch (err) {
      console.error(err)
      setError(t('screenshot.errorAnalysisFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAdd = async (word: DetectedWord, bookId: number) => {
    try {
      await window.api.addWord(bookId, word.word, word.reading, word.meaning, word.note);
      // Optional: Show success feedback
    } catch (e) {
      console.error(e);
      setError(t('screenshot.errorAddFailed'));
    }
  }

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    const selection = window.getSelection()?.toString().trim();
    if (selection) {
      setManualData({
        word: selection,
        reading: '',
        meaning: '',
        note: '',
        bookId: defaultBookId
      });
      setManualDialogOpen(true);
    }
  };

  const handleManualSave = async () => {
    if (!manualData.bookId || !manualData.word) return;
    try {
      await window.api.addWord(
        manualData.bookId as number, 
        manualData.word, 
        manualData.reading, 
        manualData.meaning, 
        manualData.note
      );
      setManualDialogOpen(false);
    } catch (e) {
      console.error(e);
      setError(t('screenshot.errorSaveFailed'));
    }
  }

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h4">{t('sidebar.screenshot')} & {t('sidebar.aianalysis')}</Typography>
      
      {!API_KEY && (
        <Alert severity="warning">{t('screenshot.warningKeyMissing')}</Alert>
      )}

      {/* Top Section */}
      <Box sx={{ display: 'flex', gap: 2, minHeight: '150px', alignItems: 'flex-start' }}>
        <Paper elevation={3} sx={{ width: '200px', height: '150px', minWidth: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: image ? '#f5f5f5' : '#e0e0e0', overflow: 'hidden' }}>
          {image ? <img src={image} alt="Screenshot" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <Typography variant="body1" color="text.secondary">{t('screenshot.imagePreview')}</Typography>}
        </Paper>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: '200px', justifyContent: 'flex-start' }}>
          <Button variant="contained" size="large" onClick={handleScreenshot} fullWidth>{t('sidebar.screenshot')}</Button>
          <FormControl fullWidth size="small">
            <InputLabel id="prompt-select-label">{t('screenshot.selectPrompt')}</InputLabel>
            <Select labelId="prompt-select-label" value={selectedPromptId} label={t('screenshot.selectPrompt')} onChange={(e) => setSelectedPromptId(Number(e.target.value))}>
              {prompts.map((prompt) => <MenuItem key={prompt.id} value={prompt.id}>{prompt.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="contained" color="secondary" size="large" onClick={handleAnalyze} disabled={!image || loading || !API_KEY} fullWidth>
            {loading ? <CircularProgress size={24} color="inherit" /> : t('screenshot.analyze')}
          </Button>
          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </Box>

      {/* Analysis Result */}
      {analysis && (
        <Paper elevation={3} sx={{ p: 2, mt: 2, position: 'relative' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{t('screenshot.analysisResult')}</Typography>
            <Button variant="outlined" size="small" onClick={() => navigator.clipboard.writeText(analysis)}>{t('screenshot.copyMarkdown')}</Button>
          </Box>
          <Box 
            onContextMenu={handleContextMenu}
            sx={{ '& img': { maxWidth: '100%' }, cursor: 'text' }}
          > 
             <ReactMarkdown>{analysis}</ReactMarkdown>
          </Box>
        </Paper>
      )}

      {/* Detected Vocabulary */}
      {detectedWords.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>{t('screenshot.detectedVocabulary')}</Typography>
          <Grid container spacing={2}>
            {detectedWords.map((word, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div">
                      {word.word}
                    </Typography>
                    <Typography sx={{ mb: 1.5 }} color="text.secondary">
                      {word.reading}
                    </Typography>
                    <Typography variant="body2">
                      {word.meaning}
                    </Typography>
                    {word.note && (
                      <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic', bgcolor: '#f5f5f5', p: 0.5, borderRadius: 1 }}>
                        "{word.note}"
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <Select 
                      size="small" 
                      value={defaultBookId} 
                      onChange={(e) => setDefaultBookId(Number(e.target.value))}
                      sx={{ minWidth: 120, mr: 1 }}
                    >
                       {vocabBooks.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                    </Select>
                    <Button size="small" onClick={() => defaultBookId && handleQuickAdd(word, defaultBookId as number)}>{t('common.add')}</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Manual Add Dialog */}
      <Dialog open={manualDialogOpen} onClose={() => setManualDialogOpen(false)}>
        <DialogTitle>{t('screenshot.manualAdd')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: '300px' }}>
            <TextField label={t('screenshot.word')} fullWidth value={manualData.word} onChange={(e) => setManualData({...manualData, word: e.target.value})} />
            <TextField label={t('screenshot.reading')} fullWidth value={manualData.reading} onChange={(e) => setManualData({...manualData, reading: e.target.value})} />
            <TextField label={t('screenshot.meaning')} fullWidth value={manualData.meaning} onChange={(e) => setManualData({...manualData, meaning: e.target.value})} />
            <TextField label={t('screenshot.note')} fullWidth multiline rows={2} value={manualData.note} onChange={(e) => setManualData({...manualData, note: e.target.value})} />
            
            <FormControl fullWidth>
              <InputLabel>{t('screenshot.selectBook')}</InputLabel>
              <Select
                value={manualData.bookId}
                label={t('screenshot.selectBook')}
                onChange={(e) => setManualData({...manualData, bookId: Number(e.target.value)})}
              >
                {vocabBooks.map((book) => (
                  <MenuItem key={book.id} value={book.id}>{book.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleManualSave} disabled={!manualData.word || !manualData.bookId}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
