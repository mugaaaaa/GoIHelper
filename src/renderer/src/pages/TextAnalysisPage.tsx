import React, { useEffect, useState } from 'react'
import { 
  Button, Box, Typography, Paper, CircularProgress, Alert, MenuItem, Select, InputLabel, FormControl,
  Card, CardContent, CardActions, Grid, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Link
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { GeminiService } from '../services/ai/GeminiService'
import { QwenService } from '../services/ai/QwenService'
import { DeepSeekService } from '../services/ai/DeepSeekService'
import ReactMarkdown from 'react-markdown'
import { Prompt, VocabularyBook } from '../../../preload/index'
import { useTranslation } from 'react-i18next'
import { DetectedWord } from '../context/ScreenshotContext' // Reusing type

const VOCAB_INSTRUCTION = `

---
**INSTRUCTION FOR AI:**
请翻译并分析这段文本
然后输出如下内容作为分隔符

---VOCAB-JSON-START---

之后, 以如下方式给出每一个你选择的有记录价值的语法:
[
  {"word": "～ようとしている", "reading": "～ようとしている", "meaning": "含义：表示正试图做某事，或某个动作即将发生。这里表示“正拼命地试图...”。", "note": "结构：动词意志形 + としている\n含义：表示正试图做某事，或某个动作即将发生。这里表示“正拼命地试图...”。\n例句：必死にやり過ごそうとしている。（正拼命地试图熬过去/忽略掉。）"}
]

之后, 以如下方式给出每一个生词:
[
  {"word": "呟く", "reading": "つぶやく", "meaning": "一个人喃喃自语, 碎碎念", "note": "自らの事情を呟きかけ慌てて誤魔化していたり（自言自语后慌忙掩饰）"}
]
`;

export default function TextAnalysisPage(): React.JSX.Element {
  const { t } = useTranslation()
  
  // State
  const [textInput, setTextInput] = useState(() => sessionStorage.getItem('text_analysis_input') || '');
  const [analysis, setAnalysis] = useState<string | null>(() => sessionStorage.getItem('text_analysis_result') || null);
  const [detectedWords, setDetectedWords] = useState<DetectedWord[]>(() => {
    const saved = sessionStorage.getItem('text_analysis_words');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedWords, setAddedWords] = useState<Set<string>>(new Set());

  // Save state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('text_analysis_input', textInput);
  }, [textInput]);

  useEffect(() => {
    if (analysis) {
      sessionStorage.setItem('text_analysis_result', analysis);
    } else {
      sessionStorage.removeItem('text_analysis_result');
    }
  }, [analysis]);

  useEffect(() => {
    sessionStorage.setItem('text_analysis_words', JSON.stringify(detectedWords));
  }, [detectedWords]);
  
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<number | ''>('');
  
  const [vocabBooks, setVocabBooks] = useState<VocabularyBook[]>([]);
  const [defaultBookId, setDefaultBookId] = useState<number | ''>('');

  // Manual Add Dialog State
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualData, setManualData] = useState({ 
    word: '', reading: '', meaning: '', note: '', bookId: '' as number | '' 
  });
  
  // API Key state
  const [apiKey, setApiKey] = useState<string>('');
  const [qwenKey, setQwenKey] = useState<string>('');
  const [deepseekKey, setDeepseekKey] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');

  // Save selected model to localStorage whenever it changes
  // Remove this since we only read from settings now
  // useEffect(() => {
  //   localStorage.setItem('selected_text_model', selectedModel);
  // }, [selectedModel]);

  useEffect(() => {
    const initData = async () => {
      try {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) setApiKey(storedKey);

        const storedQwenKey = localStorage.getItem('qwen_api_key');
        if (storedQwenKey) setQwenKey(storedQwenKey);

        const storedDeepseekKey = localStorage.getItem('deepseek_api_key');
        if (storedDeepseekKey) setDeepseekKey(storedDeepseekKey);

        const storedModel = localStorage.getItem('selected_text_model');
        if (storedModel) setSelectedModel(storedModel);

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

  const handleAnalyze = async (): Promise<void> => {
    // Check for appropriate key based on model
    const isGemini = selectedModel.includes('gemini');
    const isDeepSeek = selectedModel.includes('deepseek');
    const isQwen = selectedModel.includes('qwen');

    let hasKey = false;
    if (isGemini) hasKey = !!apiKey;
    else if (isDeepSeek) hasKey = !!deepseekKey;
    else if (isQwen) hasKey = !!qwenKey;

    if (!textInput.trim() || !hasKey) {
      setError(t('screenshot.errorNoImage') + ' (Text is empty or Key missing)');
      return
    }

    setLoading(true)
    setError(null)
    setDetectedWords([])
    setAddedWords(new Set())
    
    try {
      const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
      const promptText = (selectedPrompt ? selectedPrompt.content : '') + VOCAB_INSTRUCTION;

      let service;
      if (isGemini) {
        service = new GeminiService(apiKey);
      } else if (isDeepSeek) {
        service = new DeepSeekService(deepseekKey, selectedModel);
      } else {
        service = new QwenService(qwenKey, selectedModel);
      }

      // Check if service supports analyzeText
      if (!service.analyzeText) {
        throw new Error('Selected model does not support text analysis.');
      }

      const result = await service.analyzeText(textInput, promptText)
      
      console.log('Analysis Raw Result:', result.text); 

      const parts = result.text.split('---VOCAB-JSON-START---');
      setAnalysis(parts[0]);

      if (parts[1]) {
        try {
          // Clean JSON string
          const jsonStr = parts[1].replace(/```json/g, '').replace(/```/g, '').trim();
          const words = JSON.parse(jsonStr);
          if (Array.isArray(words)) {
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
      setAddedWords(prev => new Set(prev).add(word.word));
    } catch (e) {
      console.error(e);
      setError(t('screenshot.errorAddFailed'));
    }
  }

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    let selection = window.getSelection()?.toString().trim();

    // Support selection from TextField/TextArea
    if (!selection && (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement)) {
       const target = event.target as HTMLTextAreaElement | HTMLInputElement;
       if (target.selectionStart !== target.selectionEnd) {
         selection = target.value.substring(target.selectionStart!, target.selectionEnd!).trim();
       }
    }

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
    <Box sx={{ p: 2, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 2 }}>
      
      {/* Top Bar: Title, Prompt Select, Analyze Button */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h5" sx={{ mr: 2 }}>{t('sidebar.textAnalysis')}</Typography>
        
        {/* Model Display (Read-only) */}
        <Typography variant="body2" color="text.secondary">
          Model: {selectedModel}
        </Typography>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="prompt-select-label">{t('screenshot.selectPrompt')}</InputLabel>
          <Select labelId="prompt-select-label" value={selectedPromptId} label={t('screenshot.selectPrompt')} onChange={(e) => setSelectedPromptId(Number(e.target.value))}>
            {prompts.map((prompt) => <MenuItem key={prompt.id} value={prompt.id}>{prompt.name}</MenuItem>)}
          </Select>
        </FormControl>

        <Button 
          variant="contained" 
          color="secondary" 
          onClick={handleAnalyze} 
          disabled={!textInput || loading} 
          sx={{ minWidth: 100 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : t('screenshot.analyze')}
        </Button>
        {error && <Alert severity="error" sx={{ ml: 2 }}>{error}</Alert>}
      </Box>

      {/* Warning if key is missing */}
      {((selectedModel.includes('gemini') && !apiKey) || 
        (selectedModel.includes('deepseek') && !deepseekKey) || 
        (selectedModel.includes('qwen') && !qwenKey)) && (
        <Alert severity="warning">
           {t('screenshot.warningKeyMissing')}
          <Link component={RouterLink} to="/settings" sx={{ ml: 1 }}>{t('sidebar.settings')}</Link>
        </Alert>
      )}

      {/* Main Content Area: Split View */}
      <Box sx={{ flexGrow: 1, display: 'flex', gap: 2, overflow: 'hidden' }}>
        
        {/* Left Pane: Input (Fixed) */}
        <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column' }}>
          <TextField
              multiline
              fullWidth
              placeholder="Paste text here to analyze..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onContextMenu={handleContextMenu}
              sx={{ 
                flexGrow: 1, 
                height: '100%',
                '& .MuiInputBase-root': { 
                  height: '100%', 
                  alignItems: 'flex-start'
                },
                '& .MuiInputBase-input': {
                  height: '100% !important',
                  overflow: 'auto !important'
                }
              }}
          />
        </Box>

        {/* Right Pane: Output (Scrollable) */}
        <Box sx={{ width: '50%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Analysis Result */}
          {analysis && (
            <Paper elevation={3} sx={{ p: 2, position: 'relative' }}>
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
            <Box>
              <Typography variant="h6" gutterBottom>{t('screenshot.detectedVocabulary')}</Typography>
              <Grid container spacing={2}>
                {detectedWords.map((word, index) => (
                  // @ts-ignore
                  <Grid 
                    item 
                    xs={12} 
                    key={index}
                  >
                    <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column' }}>
                      <CardContent>
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
                            {addedWords.has(word.word) ? t('common.added') : t('common.add')}
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      </Box>

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
