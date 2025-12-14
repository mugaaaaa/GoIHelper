import React, { useEffect, useState } from 'react'
import { 
  Button, Box, Typography, Paper, CircularProgress, Alert, MenuItem, Select, InputLabel, FormControl,
  Card, CardContent, CardActions, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Link
} from '@mui/material'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { GeminiService } from '../services/ai/GeminiService'
import { QwenService } from '../services/ai/QwenService'

import { useScreenshot, DetectedWord, DetectedGrammar } from '../context/ScreenshotContext'
import ReactMarkdown from 'react-markdown'
import { Prompt, VocabularyBook, GrammarBook } from '../../../preload/index'
import { useTranslation } from 'react-i18next'

const VOCAB_INSTRUCTION = `

---
**INSTRUCTION FOR AI:**
请翻译并分析这段文本
然后输出如下内容作为分隔符

---GRAMMAR-JSON-START---
请以JSON数组格式输出提取的语法点 (Grammar Items):
[
  {
    "grammar": "语法点 (e.g. ～ようとしている)",
    "reading": "读音 (e.g. ～ようとしている)",
    "structure": "接续/结构 (e.g. 动词意志形 + としている)",
    "meaning": "意义 (e.g. 表示正试图做某事...)",
    "context": "上下文分析 (e.g. 这里表示...)",
    "examples": "例句 (e.g. 必死に...)",
    "note": "笔记 (Optional)"
  }
]

---VOCAB-JSON-START---
请以JSON数组格式输出提取的生词 (Vocabulary Words):
[
  {
    "word": "单词 (e.g. 呟く)",
    "reading": "读音 (e.g. つぶやく)",
    "meaning": "意义 (e.g. 一个人喃喃自语...)",
    "note": "笔记/例句 (e.g. 自らの事情を...)"
  }
]
`;

export default function ScreenshotPage(): React.JSX.Element {
  const { t } = useTranslation()
  const location = useLocation()
  const { 
    image, setImage, 
    analysis, setAnalysis, 
    detectedWords, setDetectedWords,
    detectedGrammar, setDetectedGrammar,
    loading, setLoading, 
    error, setError 
  } = useScreenshot()

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<number | ''>('');
  
  const [vocabBooks, setVocabBooks] = useState<VocabularyBook[]>([]);
  const [grammarBooks, setGrammarBooks] = useState<GrammarBook[]>([]);
  const [defaultBookId, setDefaultBookId] = useState<number | ''>('');
  const [defaultGrammarBookId, setDefaultGrammarBookId] = useState<number | ''>('');

  // Manual Add Dialog State
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualData, setManualData] = useState({ 
    word: '', reading: '', meaning: '', note: '', bookId: '' as number | '' 
  });
  
  // Track added words to prevent duplicates
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());
  const [addedGrammar, setAddedGrammar] = useState<Set<string>>(new Set());

  // API Key state
  const [apiKey, setApiKey] = useState<string>('');
  const [qwenKey, setQwenKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');

  // Trigger analysis if navigated with state
  useEffect(() => {
    if (location.state && (location.state as any).autoAnalyze && image && !loading) {
       if (prompts.length > 0 && ((selectedModel.includes('gemini') && apiKey) || (!selectedModel.includes('gemini') && qwenKey))) {
          window.history.replaceState({}, document.title);
          handleAnalyze();
       }
    }
  }, [location.state, image, prompts, apiKey, qwenKey, selectedModel]);

  useEffect(() => {
    const initData = async () => {
      try {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) setApiKey(storedKey);

        const storedQwenKey = localStorage.getItem('qwen_api_key');
        if (storedQwenKey) setQwenKey(storedQwenKey);

        const storedModel = localStorage.getItem('selected_image_model');
        if (storedModel) setSelectedModel(storedModel);

        const [promptsData, booksData, grammarBooksData] = await Promise.all([
          window.api.getPrompts(),
          window.api.getBooks(),
          window.api.getGrammarBooks()
        ]);
        
        setPrompts(promptsData);
        if (promptsData.length > 0) setSelectedPromptId(promptsData[0].id);

        setVocabBooks(booksData);
        if (booksData.length > 0) setDefaultBookId(booksData[0].id);

        setGrammarBooks(grammarBooksData);
        if (grammarBooksData.length > 0) setDefaultGrammarBookId(grammarBooksData[0].id);

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
      setDetectedGrammar([])
    } catch (error) {
      console.error('Failed to take screenshot:', error)
      setError(t('screenshot.errorCaptureFailed'))
    }
  }

  const handleAnalyze = async (): Promise<void> => {
    const isGemini = selectedModel.includes('gemini');
    const hasKey = isGemini ? !!apiKey : !!qwenKey;

    if (!image || !hasKey) {
      setError(t('screenshot.errorNoImage'))
      return
    }

    setLoading(true)
    setError(null)
    setDetectedWords([])
    setDetectedGrammar([])
    setAddedWords(new Set())
    setAddedGrammar(new Set())
    
    try {
      const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
      const promptText = (selectedPrompt ? selectedPrompt.content : '') + VOCAB_INSTRUCTION;

      let service;
      if (isGemini) {
        service = new GeminiService(apiKey);
      } else {
        service = new QwenService(qwenKey, selectedModel);
      }

      const result = await service.analyzeImage(image, promptText)
      
      console.log('Analysis Raw Result:', result.text); 

      // Helper to robustly extract JSON array
      const extractJsonArray = (str: string): any[] | null => {
        try {
          let clean = str.replace(/```json/g, '').replace(/```/g, '').trim();
          // Try direct parse
          try {
             const parsed = JSON.parse(clean);
             if (Array.isArray(parsed)) return parsed;
          } catch (e) {
             // Continue to substring extraction
          }

          const firstBracket = clean.indexOf('[');
          const lastBracket = clean.lastIndexOf(']');
          if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
            const jsonStr = clean.substring(firstBracket, lastBracket + 1);
            const parsed = JSON.parse(jsonStr);
            if (Array.isArray(parsed)) return parsed;
          }
          return null;
        } catch (e) {
          console.warn('JSON extraction failed for chunk:', str.substring(0, 50) + '...', e);
          return null;
        }
      };

      // Parse result
      const grammarSplit = result.text.split('---GRAMMAR-JSON-START---');
      setAnalysis(grammarSplit[0]);

      if (grammarSplit[1]) {
        const vocabSplit = grammarSplit[1].split('---VOCAB-JSON-START---');
        const grammarJsonStr = vocabSplit[0];
        
        // Parse Grammar
        const grammarItems = extractJsonArray(grammarJsonStr);
        if (grammarItems) {
           setDetectedGrammar(grammarItems);
        }

        if (vocabSplit[1]) {
           const vocabJsonStr = vocabSplit[1];
           // Parse Vocab
           const vocabItems = extractJsonArray(vocabJsonStr);
           if (vocabItems) {
              const mappedWords = vocabItems.map(w => ({
                ...w,
                note: w.note || w.context
              }));
              setDetectedWords(mappedWords);
           }
        }
      } else {
        // Fallback for old format (just vocab) or AI error
        const vocabSplit = result.text.split('---VOCAB-JSON-START---');
        if (vocabSplit.length > 1) {
             setAnalysis(vocabSplit[0]);
             const vocabItems = extractJsonArray(vocabSplit[1]);
             if (vocabItems) {
                const mappedWords = vocabItems.map(w => ({
                  ...w,
                  note: w.note || w.context
                }));
                setDetectedWords(mappedWords);
             }
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
      setAddedWords(prev => new Set(prev).add(word.word));
    } catch (e) {
      console.error(e);
      setError(t('screenshot.errorAddFailed'));
    }
  }

  const handleQuickAddGrammar = async (item: DetectedGrammar, bookId: number) => {
    try {
      await window.api.addGrammarItem(
        bookId, 
        item.grammar, 
        item.reading, 
        item.structure, 
        item.meaning, 
        item.context, 
        item.examples, 
        item.note
      );
      setAddedGrammar(prev => new Set(prev).add(item.grammar));
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
      
      {/* Warning if key is missing for selected model */}
      {((selectedModel.includes('gemini') && !apiKey) || (!selectedModel.includes('gemini') && !qwenKey)) && (
        <Alert severity="warning">
          {selectedModel.includes('gemini') ? t('screenshot.warningKeyMissing') : t('settings.qwenKey') + ' Missing'} 
          <Link component={RouterLink} to="/settings" sx={{ ml: 1 }}>{t('sidebar.settings')}</Link>
        </Alert>
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
          <Button variant="contained" color="secondary" size="large" onClick={handleAnalyze} disabled={!image || loading || (selectedModel.includes('gemini') ? !apiKey : !qwenKey)} fullWidth>
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

      {/* Detected Grammar */}
      {detectedGrammar.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>{t('grammar.item')}</Typography>
          <Grid container spacing={2}>
            {detectedGrammar.map((item, index) => (
              // @ts-ignore
              <Grid item xs={12} key={index}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" component="div" color="primary">
                      {item.grammar}
                    </Typography>
                    <Typography sx={{ mb: 1 }} color="text.secondary">
                      {item.reading}
                    </Typography>
                    
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {item.meaning}
                    </Typography>
                    
                    {item.structure && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>{t('grammar.structure')}:</strong> {item.structure}
                      </Typography>
                    )}
                    
                    {item.context && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>{t('grammar.context')}:</strong> {item.context}
                      </Typography>
                    )}

                    {item.examples && (
                      <Box sx={{ mt: 1, bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                        <Typography variant="caption" display="block" color="text.secondary">{t('grammar.examples')}</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{item.examples}</Typography>
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <Select 
                      size="small" 
                      value={defaultGrammarBookId} 
                      onChange={(e) => setDefaultGrammarBookId(Number(e.target.value))}
                      sx={{ minWidth: 120, mr: 1 }}
                    >
                       {grammarBooks.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                    </Select>
                    <Button 
                      size="small" 
                      onClick={() => defaultGrammarBookId && handleQuickAddGrammar(item, defaultGrammarBookId as number)}
                      disabled={addedGrammar.has(item.grammar)}
                    >
                      {addedGrammar.has(item.grammar) ? t('common.added') : t('common.add')}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Detected Vocabulary */}
      {detectedWords.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>{t('screenshot.detectedVocabulary')}</Typography>
          <Grid container spacing={2}>
            {detectedWords.map((word, index) => (
              // @ts-ignore
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
                    <Button 
                      size="small" 
                      onClick={() => defaultBookId && handleQuickAdd(word, defaultBookId as number)}
                      disabled={addedWords.has(word.word)}
                    >
                      {addedWords.has(word.word) ? t('common.added') || 'Added' : t('common.add')}
                    </Button>
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
