import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, List, ListItem, ListItemButton, ListItemText, 
  IconButton, Button, Dialog, TextField, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, Grid, Divider, Paper, Collapse
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import ImageIcon from '@mui/icons-material/Image';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { AnalysisSet, AnalysisRecord } from '../../../preload/index';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

const ImageViewer = ({ src }: { src: string }) => {
  const [scale, setScale] = useState(1);

  const handleZoomIn = () => setScale(s => Math.min(5, s + 0.2));
  const handleZoomOut = () => setScale(s => Math.max(0.2, s - 0.2));

  return (
    <Box sx={{ 
      position: 'relative', 
      overflow: 'auto', 
      height: '400px', 
      border: '1px solid #eee',
      bgcolor: '#f5f5f5',
      borderRadius: 1
    }}>
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10, bgcolor: 'rgba(255,255,255,0.8)', borderRadius: 1 }}>
        <IconButton size="small" onClick={handleZoomOut}><ZoomOutIcon /></IconButton>
        <Typography variant="caption" sx={{ mx: 1 }}>{Math.round(scale * 100)}%</Typography>
        <IconButton size="small" onClick={handleZoomIn}><ZoomInIcon /></IconButton>
      </Box>
      <Box sx={{ 
        width: '100%', 
        minHeight: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'flex-start',
        p: 2
      }}>
        <img 
          src={src} 
          style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: 'top center',
            maxWidth: '100%',
            transition: 'transform 0.2s ease-in-out'
          }} 
          alt="Analysis Source"
        />
      </Box>
    </Box>
  );
};

export default function AnalysisHistoryPage(): React.JSX.Element {
  const { t } = useTranslation();
  
  // State for Sets
  const [imageSets, setImageSets] = useState<AnalysisSet[]>([]);
  const [textSets, setTextSets] = useState<AnalysisSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<number | null>(null);
  const [selectedSetType, setSelectedSetType] = useState<'image' | 'text' | null>(null);
  
  // State for Records
  const [records, setRecords] = useState<AnalysisRecord[]>([]);

  // Dialog State
  const [createSetOpen, setCreateSetOpen] = useState(false);
  const [createSetType, setCreateSetType] = useState<'image' | 'text'>('text');
  const [newSetName, setNewSetName] = useState('');

  // Add Record Dialog State
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [newRecordTitle, setNewRecordTitle] = useState('');
  const [newRecordOriginal, setNewRecordOriginal] = useState('');
  const [newRecordResult, setNewRecordResult] = useState('');

  // Detail Dialog State
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);

  const fetchSets = async () => {
    try {
      const iSets = await window.api.getAnalysisSets('image');
      const tSets = await window.api.getAnalysisSets('text');
      setImageSets(iSets);
      setTextSets(tSets);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecords = async (setId: number) => {
    try {
      const data = await window.api.getAnalysisRecords(setId);
      setRecords(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSets();
  }, []);

  useEffect(() => {
    if (selectedSetId) {
      fetchRecords(selectedSetId);
    } else {
      setRecords([]);
    }
  }, [selectedSetId]);

  const handleCreateSet = async () => {
    if (!newSetName) return;
    try {
      const id = await window.api.createAnalysisSet(newSetName, createSetType);
      setNewSetName('');
      setCreateSetOpen(false);
      fetchSets();
      // Optionally select the new set
      setSelectedSetId(id);
      setSelectedSetType(createSetType);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddRecord = async () => {
    if (!selectedSetId || !newRecordOriginal) return;
    try {
      await window.api.addAnalysisRecord(selectedSetId, newRecordTitle || 'New Record', newRecordOriginal, newRecordResult);
      setNewRecordTitle('');
      setNewRecordOriginal('');
      setNewRecordResult('');
      setAddRecordOpen(false);
      fetchRecords(selectedSetId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSet = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('history.deleteSetConfirm'))) {
      try {
        await window.api.deleteAnalysisSet(id);
        if (selectedSetId === id) {
          setSelectedSetId(null);
          setSelectedSetType(null);
        }
        fetchSets();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteRecord = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('history.deleteRecordConfirm'))) {
      try {
        await window.api.deleteAnalysisRecord(id);
        if (selectedSetId) fetchRecords(selectedSetId);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleExport = (record: AnalysisRecord) => {
    let content = `# ${record.title}\n\n`;
    content += `**Date:** ${new Date(record.created_at).toLocaleString()}\n\n`;
    
    if (selectedSetType === 'text') {
       content += `## ${t('history.originalInput')}\n\n`;
       content += `${record.original_content}\n\n`;
    } else {
      // For images, we can't easily embed base64 in a user-downloadable markdown file that works everywhere,
      // but we can try to put it in an image tag or just skip it. 
      // User request: "原图就输出图片". 
      // Best effort: Embed as Data URI image.
      content += `## ${t('history.originalInput')}\n\n`;
      content += `![Original Image](${record.original_content})\n\n`;
    }

    content += `## ${t('history.analysisResult')}\n\n`;
    content += `${record.ai_result}\n`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openCreateDialog = (type: 'image' | 'text') => {
    setCreateSetType(type);
    setCreateSetOpen(true);
  };

  const openDetailDialog = (record: AnalysisRecord) => {
    setSelectedRecord(record);
    setDetailOpen(true);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 30px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        {/* Sidebar */}
        <Box sx={{ 
          width: '280px',
          minWidth: '280px',
          borderRight: 1, 
          borderColor: 'divider', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          bgcolor: 'background.paper'
        }}>
          {/* Image Sets Section */}
          <Box sx={{ flex: 1, overflow: 'auto', borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ImageIcon fontSize="small" /> {t('history.imageAnalysis')}
              </Typography>
              <IconButton size="small" onClick={() => openCreateDialog('image')}>
                <AddIcon />
              </IconButton>
            </Box>
            <List dense>
              {imageSets.map((set) => (
                <ListItem 
                  key={set.id}
                  disablePadding
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={(e) => handleDeleteSet(set.id, e)} size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemButton 
                    selected={selectedSetId === set.id}
                    onClick={() => { setSelectedSetId(set.id); setSelectedSetType('image'); }}
                  >
                    <ListItemText primary={set.name} secondary={new Date(set.created_at).toLocaleDateString()} />
                  </ListItemButton>
                </ListItem>
              ))}
              {imageSets.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  {t('history.noImageSets')}
                </Typography>
              )}
            </List>
          </Box>

          {/* Text Sets Section */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextFieldsIcon fontSize="small" /> {t('history.textAnalysis')}
              </Typography>
              <IconButton size="small" onClick={() => openCreateDialog('text')}>
                <AddIcon />
              </IconButton>
            </Box>
            <List dense>
              {textSets.map((set) => (
                <ListItem 
                  key={set.id}
                  disablePadding
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={(e) => handleDeleteSet(set.id, e)} size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemButton 
                    selected={selectedSetId === set.id}
                    onClick={() => { setSelectedSetId(set.id); setSelectedSetType('text'); }}
                  >
                    <ListItemText primary={set.name} secondary={new Date(set.created_at).toLocaleDateString()} />
                  </ListItemButton>
                </ListItem>
              ))}
              {textSets.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  {t('history.noTextSets')}
                </Typography>
              )}
            </List>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', bgcolor: '#fafafa', minWidth: 0 }}>
          {!selectedSetId ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography color="text.secondary">{t('history.selectOrCreate')}</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper' }}>
                <Typography variant="h6">
                  {selectedSetType === 'image' ? imageSets.find(s => s.id === selectedSetId)?.name : textSets.find(s => s.id === selectedSetId)?.name}
                </Typography>
                <Button startIcon={<AddIcon />} onClick={() => setAddRecordOpen(true)} variant="contained" size="small">
                  {t('common.add') || 'Add'}
                </Button>
              </Box>

              <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
                {records.length === 0 && (
                  <Typography color="text.secondary" sx={{ p: 2 }}>{t('history.noRecords')}</Typography>
                )}

                <List>
                  {records.map((record) => (
                    <Paper key={record.id} sx={{ mb: 1, overflow: 'hidden' }} variant="outlined">
                      <ListItem
                        secondaryAction={
                          <Box>
                            <IconButton edge="end" aria-label="export" onClick={() => handleExport(record)} size="small" sx={{ mr: 1 }}>
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                            <IconButton edge="end" aria-label="delete" onClick={(e) => handleDeleteRecord(record.id, e)} size="small">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        }
                      >
                         <ListItemButton onClick={() => openDetailDialog(record)}>
                            <ListItemText 
                              primary={record.title || 'Untitled Record'} 
                              secondary={new Date(record.created_at).toLocaleString()} 
                            />
                         </ListItemButton>
                      </ListItem>
                    </Paper>
                  ))}
                </List>
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* Create Set Dialog */}
      <Dialog open={createSetOpen} onClose={() => setCreateSetOpen(false)}>
        <DialogTitle>{createSetType === 'image' ? t('history.createImageSet') : t('history.createTextSet')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('history.setName')}
            fullWidth
            variant="outlined"
            value={newSetName}
            onChange={(e) => setNewSetName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateSetOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleCreateSet} variant="contained">{t('common.create')}</Button>
        </DialogActions>
      </Dialog>

      {/* Add Record Dialog */}
      <Dialog open={addRecordOpen} onClose={() => setAddRecordOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedSetType === 'image' ? t('history.addImageRecord') : t('history.addTextRecord')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('history.recordTitle')}
            fullWidth
            variant="outlined"
            value={newRecordTitle}
            onChange={(e) => setNewRecordTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          {selectedSetType === 'image' ? (
            <Box sx={{ mb: 2 }}>
               <Typography variant="caption" color="text.secondary">{t('history.enterImageUrl')}</Typography>
               <TextField
                  margin="dense"
                  label={t('history.imageUrlLabel')}
                  fullWidth
                  multiline
                  rows={4}
                  value={newRecordOriginal}
                  onChange={(e) => setNewRecordOriginal(e.target.value)}
               />
            </Box>
          ) : (
            <TextField
              margin="dense"
              label={t('history.originalTextLabel')}
              fullWidth
              multiline
              rows={6}
              variant="outlined"
              value={newRecordOriginal}
              onChange={(e) => setNewRecordOriginal(e.target.value)}
              sx={{ mb: 2 }}
            />
          )}
          <TextField
            margin="dense"
            label={t('history.aiResultLabel')}
            fullWidth
            multiline
            rows={10}
            variant="outlined"
            value={newRecordResult}
            onChange={(e) => setNewRecordResult(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddRecordOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleAddRecord} variant="contained">{t('common.add')}</Button>
        </DialogActions>
      </Dialog>

      {/* Record Detail Dialog */}
      <Dialog 
        open={detailOpen} 
        onClose={() => setDetailOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           {selectedRecord?.title}
           <IconButton onClick={() => setDetailOpen(false)}>
             <ExpandMoreIcon />
           </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedRecord && (
            <Grid container spacing={2} sx={{ height: '100%' }}>
              <Grid item xs={12} md={6} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle2" gutterBottom>{t('history.originalInput')}</Typography>
                {selectedSetType === 'image' ? (
                  <ImageViewer src={selectedRecord.original_content} />
                ) : (
                  <Paper variant="outlined" sx={{ p: 2, flex: 1, overflow: 'auto', bgcolor: '#f5f5f5' }}>
                    <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedRecord.original_content}
                    </Typography>
                  </Paper>
                )}
              </Grid>
              
              <Grid item xs={12} md={6} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle2" gutterBottom>{t('history.analysisResult')}</Typography>
                <Paper variant="outlined" sx={{ p: 2, flex: 1, overflow: 'auto' }}>
                  <ReactMarkdown>{selectedRecord.ai_result}</ReactMarkdown>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => selectedRecord && handleExport(selectedRecord)} startIcon={<DownloadIcon />}>
             {t('history.exportMarkdown')}
          </Button>
          <Button onClick={() => setDetailOpen(false)}>{t('common.cancel')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
