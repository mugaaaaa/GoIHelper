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
import { GrammarBook, GrammarItem } from '../../../preload/index';
import { useTranslation } from 'react-i18next';

export default function GrammarPage(): React.JSX.Element {
  const { t } = useTranslation();
  const [books, setBooks] = useState<GrammarBook[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [items, setItems] = useState<GrammarItem[]>([]);
  
  const [createBookOpen, setCreateBookOpen] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [newBookDesc, setNewBookDesc] = useState('');

  // Edit Item State
  const [editItemOpen, setEditItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GrammarItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    grammar: '', reading: '', structure: '', meaning: '', context: '', examples: '', note: ''
  });

  // Add Item State
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    grammar: '', reading: '', structure: '', meaning: '', context: '', examples: '', note: ''
  });

  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);

  const fetchBooks = async () => {
    try {
      const data = await window.api.getGrammarBooks();
      setBooks(data);
      if (data.length > 0 && selectedBookId === null) {
        setSelectedBookId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchItems = async () => {
    if (!selectedBookId) return;
    try {
      const data = await window.api.getGrammarItems(selectedBookId);
      setItems(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (selectedBookId) {
      fetchItems();
    }
  }, [selectedBookId]);

  const handleCreateBook = async () => {
    if (!newBookName) return;
    try {
      await window.api.createGrammarBook(newBookName, newBookDesc);
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
    if (confirm(t('grammar.deleteBookConfirm'))) {
      try {
        await window.api.deleteGrammarBook(id);
        if (selectedBookId === id) setSelectedBookId(null);
        fetchBooks();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await window.api.deleteGrammarItem(id);
      fetchItems();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditItem = (item: GrammarItem) => {
    setEditingItem(item);
    setEditFormData({
      grammar: item.grammar,
      reading: item.reading || '',
      structure: item.structure || '',
      meaning: item.meaning || '',
      context: item.context || '',
      examples: item.examples || '',
      note: item.note || ''
    });
    setEditItemOpen(true);
  };

  const handleSaveItem = async () => {
    if (!editingItem) return;
    try {
      await window.api.updateGrammarItem(
        editingItem.id,
        editFormData.grammar,
        editFormData.reading,
        editFormData.structure,
        editFormData.meaning,
        editFormData.context,
        editFormData.examples,
        editFormData.note
      );
      setEditItemOpen(false);
      setEditingItem(null);
      fetchItems();
    } catch (e) {
      console.error('Failed to update grammar item:', e);
    }
  };

  const handleOpenAddItem = () => {
    setAddFormData({ grammar: '', reading: '', structure: '', meaning: '', context: '', examples: '', note: '' });
    setAddItemOpen(true);
  };

  const handleSaveNewItem = async () => {
    if (!selectedBookId || !addFormData.grammar) return;
    try {
      await window.api.addGrammarItem(
        selectedBookId,
        addFormData.grammar,
        addFormData.reading,
        addFormData.structure,
        addFormData.meaning,
        addFormData.context,
        addFormData.examples,
        addFormData.note
      );
      setAddItemOpen(false);
      fetchItems();
    } catch (e) {
      console.error('Failed to add grammar item:', e);
    }
  };

  const handleExportAnki = () => {
    if (items.length === 0) return;
    
    // Format: Grammar <tab> Reading <tab> Structure <tab> Meaning <tab> Context <tab> Examples <tab> Note
    const header = '# Grammar\tReading\tStructure\tMeaning\tContext\tExamples\tNote\n';
    const content = items.map(item => {
      const clean = (s?: string) => (s || '').replace(/\t/g, ' ').replace(/\n/g, '<br>');
      return `${clean(item.grammar)}\t${clean(item.reading)}\t${clean(item.structure)}\t${clean(item.meaning)}\t${clean(item.context)}\t${clean(item.examples)}\t${clean(item.note)}`;
    }).join('\n');

    const blob = new Blob([header + content], { type: 'text/tab-separated-values;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `grammar_anki_export_${selectedBookId}_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleExpandItem = (id: number) => {
    if (expandedItemId === id) {
      setExpandedItemId(null);
    } else {
      setExpandedItemId(id);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2, p: 2 }}>
      {/* Sidebar: Books List */}
      <Paper elevation={2} sx={{ width: 250, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">{t('grammar.books')}</Typography>
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

      {/* Main Area: Items List */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            {books.find(b => b.id === selectedBookId)?.name || t('grammar.selectBook')}
          </Typography>
          {selectedBookId && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAddItem}
              >
                {t('common.add')}
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />} 
                onClick={handleExportAnki}
                disabled={items.length === 0}
              >
                {t('grammar.exportAnki')}
              </Button>
            </Box>
          )}
        </Box>
        
        {selectedBookId && (
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <Grid container spacing={2}>
              {items.map((item) => (
                // @ts-ignore
                <Grid item xs={12} sm={6} md={4} key={item.id}>
                  <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                           <Typography variant="h6" component="div">
                             {item.grammar}
                           </Typography>
                           <Typography color="text.secondary">
                             {item.reading}
                           </Typography>
                        </Box>
                        <Box>
                          <IconButton size="small" onClick={() => handleEditItem(item)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => toggleExpandItem(item.id)}>
                             {expandedItemId === item.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDeleteItem(item.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      
                      <Typography variant="body1" sx={{ mt: 1, fontWeight: 'medium' }}>
                        {item.meaning}
                      </Typography>

                      <Collapse in={expandedItemId === item.id}>
                        {item.structure && (
                          <Box sx={{ mt: 1 }}>
                             <Typography variant="caption" color="text.secondary" display="block">{t('grammar.structure')}</Typography>
                             <Typography variant="body2">{item.structure}</Typography>
                          </Box>
                        )}
                        {item.context && (
                          <Box sx={{ mt: 1 }}>
                             <Typography variant="caption" color="text.secondary" display="block">{t('grammar.context')}</Typography>
                             <Typography variant="body2">{item.context}</Typography>
                          </Box>
                        )}
                         {item.examples && (
                          <Box sx={{ mt: 1 }}>
                             <Typography variant="caption" color="text.secondary" display="block">{t('grammar.examples')}</Typography>
                             <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{item.examples}</Typography>
                          </Box>
                        )}
                        {item.note && (
                          <Box sx={{ mt: 2, bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block">{t('grammar.note')}</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {item.note}
                            </Typography>
                          </Box>
                        )}
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                           {t('grammar.addedDate')} {new Date(item.created_at).toLocaleDateString()}
                        </Typography>
                      </Collapse>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {items.length === 0 && (
                <Box sx={{ p: 2, width: '100%', textAlign: 'center' }}>
                  <Typography color="text.secondary">{t('grammar.noItems')}</Typography>
                </Box>
              )}
            </Grid>
          </Box>
        )}
      </Box>

      {/* Create Book Dialog */}
      <Dialog open={createBookOpen} onClose={() => setCreateBookOpen(false)}>
        <DialogTitle>{t('grammar.createNewBookTitle')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('grammar.bookName')}
            fullWidth
            value={newBookName}
            onChange={(e) => setNewBookName(e.target.value)}
          />
          <TextField
            margin="dense"
            label={t('grammar.description')}
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

      {/* Edit Item Dialog */}
      <Dialog open={editItemOpen} onClose={() => setEditItemOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('grammar.editItem')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField 
              label={t('grammar.item')} 
              fullWidth 
              value={editFormData.grammar} 
              onChange={(e) => setEditFormData({...editFormData, grammar: e.target.value})} 
            />
            <TextField 
              label={t('grammar.reading')} 
              fullWidth 
              value={editFormData.reading} 
              onChange={(e) => setEditFormData({...editFormData, reading: e.target.value})} 
            />
            <TextField 
              label={t('grammar.structure')} 
              fullWidth 
              value={editFormData.structure} 
              onChange={(e) => setEditFormData({...editFormData, structure: e.target.value})} 
            />
            <TextField 
              label={t('grammar.meaning')} 
              fullWidth 
              value={editFormData.meaning} 
              onChange={(e) => setEditFormData({...editFormData, meaning: e.target.value})} 
            />
             <TextField 
              label={t('grammar.context')} 
              fullWidth 
              multiline
              rows={2}
              value={editFormData.context} 
              onChange={(e) => setEditFormData({...editFormData, context: e.target.value})} 
            />
             <TextField 
              label={t('grammar.examples')} 
              fullWidth 
              multiline
              rows={3}
              value={editFormData.examples} 
              onChange={(e) => setEditFormData({...editFormData, examples: e.target.value})} 
            />
            <TextField 
              label={t('grammar.note')} 
              fullWidth 
              multiline 
              rows={2} 
              value={editFormData.note} 
              onChange={(e) => setEditFormData({...editFormData, note: e.target.value})} 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditItemOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSaveItem}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={addItemOpen} onClose={() => setAddItemOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('grammar.addItem')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
             <TextField 
              label={t('grammar.item')} 
              fullWidth 
              autoFocus
              value={addFormData.grammar} 
              onChange={(e) => setAddFormData({...addFormData, grammar: e.target.value})} 
            />
            <TextField 
              label={t('grammar.reading')} 
              fullWidth 
              value={addFormData.reading} 
              onChange={(e) => setAddFormData({...addFormData, reading: e.target.value})} 
            />
            <TextField 
              label={t('grammar.structure')} 
              fullWidth 
              value={addFormData.structure} 
              onChange={(e) => setAddFormData({...addFormData, structure: e.target.value})} 
            />
            <TextField 
              label={t('grammar.meaning')} 
              fullWidth 
              value={addFormData.meaning} 
              onChange={(e) => setAddFormData({...addFormData, meaning: e.target.value})} 
            />
             <TextField 
              label={t('grammar.context')} 
              fullWidth 
              multiline
              rows={2}
              value={addFormData.context} 
              onChange={(e) => setAddFormData({...addFormData, context: e.target.value})} 
            />
             <TextField 
              label={t('grammar.examples')} 
              fullWidth 
              multiline
              rows={3}
              value={addFormData.examples} 
              onChange={(e) => setAddFormData({...addFormData, examples: e.target.value})} 
            />
            <TextField 
              label={t('grammar.note')} 
              fullWidth 
              multiline 
              rows={2} 
              value={addFormData.note} 
              onChange={(e) => setAddFormData({...addFormData, note: e.target.value})} 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddItemOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleSaveNewItem} disabled={!addFormData.grammar}>{t('common.add')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
