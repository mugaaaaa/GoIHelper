import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, List, ListItem, ListItemButton, ListItemText, 
  IconButton, Button, Dialog, TextField, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, Grid, Divider, Paper, Collapse
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { VocabularyBook, VocabularyWord } from '../../../preload/index';
import { useTranslation } from 'react-i18next';

export default function VocabularyPage(): React.JSX.Element {
  const { t } = useTranslation();
  const [books, setBooks] = useState<VocabularyBook[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [words, setWords] = useState<VocabularyWord[]>([]);
  
  const [createBookOpen, setCreateBookOpen] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [newBookDesc, setNewBookDesc] = useState('');

  // Edit Word State
  const [editWordOpen, setEditWordOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<VocabularyWord | null>(null);
  const [editFormData, setEditFormData] = useState({
    word: '', reading: '', meaning: '', note: ''
  });

  const [expandedWordId, setExpandedWordId] = useState<number | null>(null);

  const fetchBooks = async () => {
    try {
      const data = await window.api.getBooks();
      setBooks(data);
      if (data.length > 0 && selectedBookId === null) {
        setSelectedBookId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWords = async () => {
    if (!selectedBookId) return;
    try {
      const data = await window.api.getWords(selectedBookId);
      setWords(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (selectedBookId) {
      fetchWords();
    }
  }, [selectedBookId]);

  const handleCreateBook = async () => {
    if (!newBookName) return;
    try {
      await window.api.createBook(newBookName, newBookDesc);
      setNewBookName('');
      setNewBookDesc('');
      setCreateBookOpen(false);
      fetchBooks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBook = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('vocabulary.deleteBookConfirm'))) {
      try {
        await window.api.deleteBook(id);
        if (selectedBookId === id) setSelectedBookId(null);
        fetchBooks();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteWord = async (id: number) => {
    try {
      await window.api.deleteWord(id);
      fetchWords();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditWord = (word: VocabularyWord) => {
    setEditingWord(word);
    setEditFormData({
      word: word.word,
      reading: word.reading || '',
      meaning: word.meaning || '',
      note: word.note || ''
    });
    setEditWordOpen(true);
  };

  const handleSaveWord = async () => {
    if (!editingWord) return;
    try {
      await window.api.updateWord(
        editingWord.id,
        editFormData.word,
        editFormData.reading,
        editFormData.meaning,
        editFormData.note
      );
      setEditWordOpen(false);
      setEditingWord(null);
      fetchWords();
    } catch (e) {
      console.error('Failed to update word:', e);
    }
  };

  const handleExportAnki = () => {
    if (words.length === 0) return;
    
    // Create CSV content (Tab separated is better for Anki actually, but let's stick to standard CSV or TSV)
    // Anki defaults to allowing HTML in fields, so we can keep it simple.
    // Format: Word <tab> Reading <tab> Meaning <tab> Note
    const header = '# Word\tReading\tMeaning\tNote\n';
    const content = words.map(w => {
      // Escape tabs and newlines within fields to avoid breaking the format
      const clean = (s?: string) => (s || '').replace(/\t/g, ' ').replace(/\n/g, '<br>');
      return `${clean(w.word)}\t${clean(w.reading)}\t${clean(w.meaning)}\t${clean(w.note)}`;
    }).join('\n');

    const blob = new Blob([header + content], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anki_export_${selectedBookId}_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleExpandWord = (id: number) => {
    if (expandedWordId === id) {
      setExpandedWordId(null);
    } else {
      setExpandedWordId(id);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2, p: 2 }}>
      {/* Sidebar: Books List */}
      <Paper elevation={2} sx={{ width: 250, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">{t('vocabulary.books')}</Typography>
          <IconButton size="small" onClick={() => setCreateBookOpen(true)}>
            <AddIcon />
          </IconButton>
        </Box>
        <Divider />
        <List sx={{ flexGrow: 1, overflow: 'auto' }}>
          {books.map((book) => (
            <ListItem 
              key={book.id} 
              disablePadding
              secondaryAction={
                <IconButton edge="end" size="small" onClick={(e) => handleDeleteBook(book.id, e)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemButton 
                selected={selectedBookId === book.id} 
                onClick={() => setSelectedBookId(book.id)}
              >
                <ListItemText primary={book.name} secondary={book.description} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Main Area: Words List */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            {books.find(b => b.id === selectedBookId)?.name || t('vocabulary.selectBook')}
          </Typography>
          {selectedBookId && (
            <Button 
              variant="outlined" 
              startIcon={<DownloadIcon />} 
              onClick={handleExportAnki}
              disabled={words.length === 0}
            >
              Export Anki
            </Button>
          )}
        </Box>
        
        {selectedBookId && (
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <Grid container spacing={2}>
              {words.map((word) => (
                // @ts-ignore
                <Grid item xs={12} sm={6} md={4} key={word.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                           <Typography variant="h6" component="div">
                             {word.word}
                           </Typography>
                           <Typography color="text.secondary">
                             {word.reading}
                           </Typography>
                        </Box>
                        <Box>
                          <IconButton size="small" onClick={() => handleEditWord(word)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => toggleExpandWord(word.id)}>
                             {expandedWordId === word.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteWord(word.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      <Typography variant="body1" sx={{ mt: 1, fontWeight: 'medium' }}>
                        {word.meaning}
                      </Typography>

                      <Collapse in={expandedWordId === word.id}>
                        {word.note && (
                          <Box sx={{ mt: 2, bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block">{t('vocabulary.note')}</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {word.note}
                            </Typography>
                          </Box>
                        )}
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                           {t('vocabulary.addedDate')} {new Date(word.created_at).toLocaleDateString()}
                        </Typography>
                      </Collapse>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {words.length === 0 && (
                <Box sx={{ p: 2, width: '100%', textAlign: 'center' }}>
                  <Typography color="text.secondary">{t('vocabulary.noWords')}</Typography>
                </Box>
              )}
            </Grid>
          </Box>
        )}
      </Box>

      {/* Create Book Dialog */}
      <Dialog open={createBookOpen} onClose={() => setCreateBookOpen(false)}>
        <DialogTitle>{t('vocabulary.createNewBookTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('vocabulary.bookName')}
            fullWidth
            value={newBookName}
            onChange={(e) => setNewBookName(e.target.value)}
          />
          <TextField
            margin="dense"
            label={t('vocabulary.description')}
            fullWidth
            value={newBookDesc}
            onChange={(e) => setNewBookDesc(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateBookOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleCreateBook} disabled={!newBookName}>{t('common.create')}</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Word Dialog */}
      <Dialog open={editWordOpen} onClose={() => setEditWordOpen(false)}>
        <DialogTitle>Edit Word</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: '300px' }}>
            <TextField 
              label={t('screenshot.word')} 
              fullWidth 
              value={editFormData.word} 
              onChange={(e) => setEditFormData({...editFormData, word: e.target.value})} 
            />
            <TextField 
              label={t('screenshot.reading')} 
              fullWidth 
              value={editFormData.reading} 
              onChange={(e) => setEditFormData({...editFormData, reading: e.target.value})} 
            />
            <TextField 
              label={t('screenshot.meaning')} 
              fullWidth 
              value={editFormData.meaning} 
              onChange={(e) => setEditFormData({...editFormData, meaning: e.target.value})} 
            />
            <TextField 
              label={t('screenshot.note')} 
              fullWidth 
              multiline 
              rows={2} 
              value={editFormData.note} 
              onChange={(e) => setEditFormData({...editFormData, note: e.target.value})} 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditWordOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSaveWord}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
