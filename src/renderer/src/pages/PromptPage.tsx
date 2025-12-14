import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';

interface Prompt {
  id: number;
  name: string;
  content: string;
}

export default function PromptPage(): React.JSX.Element {
  const { t } = useTranslation();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [open, setOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  const fetchPrompts = async () => {
    try {
      const data = await window.api.getPrompts();
      setPrompts(data);
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleOpen = (prompt?: Prompt) => {
    if (prompt) {
      setEditingPrompt(prompt);
      setName(prompt.name);
      setContent(prompt.content);
    } else {
      setEditingPrompt(null);
      setName('');
      setContent('');
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingPrompt(null);
    setName('');
    setContent('');
  };

  const handleSave = async () => {
    try {
      if (editingPrompt) {
        await window.api.updatePrompt(editingPrompt.id, name, content);
      } else {
        await window.api.addPrompt(name, content);
      }
      fetchPrompts();
      handleClose();
    } catch (error) {
      console.error('Failed to save prompt:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(t('prompts.deleteConfirm'))) {
      try {
        await window.api.deletePrompt(id);
        fetchPrompts();
      } catch (error) {
        console.error('Failed to delete prompt:', error);
      }
    }
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">{t('prompts.title')}</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          {t('prompts.newPrompt')}
        </Button>
      </Box>

      <Paper elevation={2}>
        <List>
          {prompts.map((prompt, index) => (
            <React.Fragment key={prompt.id}>
              <ListItem
                secondaryAction={
                  <Box>
                    <IconButton edge="end" aria-label="edit" onClick={() => handleOpen(prompt)} sx={{ mr: 1 }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(prompt.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={prompt.name}
                  secondary={
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {prompt.content}
                    </Typography>
                  }
                />
              </ListItem>
              {index < prompts.length - 1 && <Divider />}
            </React.Fragment>
          ))}
          {prompts.length === 0 && (
            <ListItem>
              <ListItemText primary={t('prompts.noPrompts')} />
            </ListItem>
          )}
        </List>
      </Paper>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>{editingPrompt ? t('prompts.editPrompt') : t('prompts.newPrompt')}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label={t('prompts.promptName')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label={t('prompts.promptContent')}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              fullWidth
              multiline
              rows={6}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave} variant="contained" disabled={!name.trim() || !content.trim()}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
