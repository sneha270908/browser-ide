const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Detect language from file extension
const getLanguage = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  const map = {
    js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
    html: 'html', css: 'css', scss: 'scss', json: 'json',
    md: 'markdown', py: 'python', sh: 'shell', yml: 'yaml', yaml: 'yaml',
    rs: 'rust', go: 'go', java: 'java', cpp: 'cpp', c: 'c',
  };
  return map[ext] || 'plaintext';
};

// POST /api/files/:projectId - create file or folder
router.post('/:projectId', protect, async (req, res) => {
  try {
    const { name, type, parentId } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type are required' });

    const project = await Project.findOne({ _id: req.params.projectId, owner: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Build path from parent
    let parentPath = '';
    if (parentId) {
      const parent = project.files.find(f => f.id === parentId);
      if (parent) parentPath = parent.path;
    }

    const newFile = {
      id: uuidv4(),
      name,
      type,
      path: `${parentPath}/${name}`,
      parentId: parentId || null,
      content: '',
      language: type === 'file' ? getLanguage(name) : 'plaintext',
      isOpen: false,
    };

    project.files.push(newFile);
    await project.save();

    // Emit real-time update to other clients in this project room
    req.io.to(`project:${project._id}`).emit('file:created', { file: newFile });

    res.status(201).json({ file: newFile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/files/:projectId/:fileId - update file content or rename
router.patch('/:projectId/:fileId', protect, async (req, res) => {
  try {
    const { content, name, isOpen } = req.body;

    const project = await Project.findOne({ _id: req.params.projectId, owner: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const file = project.files.find(f => f.id === req.params.fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });

    if (content !== undefined) file.content = content;
    if (isOpen !== undefined) file.isOpen = isOpen;
    if (name) {
      // Rename: update this file and all children paths
      const oldPath = file.path;
      const newPath = file.path.replace(file.name, name);
      file.name = name;
      file.path = newPath;
      if (file.type === 'file') file.language = getLanguage(name);

      // Update all children paths
      project.files.forEach(f => {
        if (f.path.startsWith(oldPath + '/')) {
          f.path = f.path.replace(oldPath, newPath);
        }
      });
    }

    file.updatedAt = new Date();
    await project.save();

    // Emit real-time update (only for content changes, to avoid flooding)
    if (content !== undefined) {
      req.io.to(`project:${project._id}`).emit('file:updated', {
        fileId: file.id,
        content,
      });
    }

    res.json({ file });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/files/:projectId/:fileId
router.delete('/:projectId/:fileId', protect, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.projectId, owner: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const file = project.files.find(f => f.id === req.params.fileId);
    if (!file) return res.status(404).json({ error: 'File not found' });

    // Delete file and all children if folder
    const toDelete = new Set([file.id]);
    if (file.type === 'folder') {
      project.files.forEach(f => {
        if (f.path.startsWith(file.path + '/')) toDelete.add(f.id);
      });
    }

    project.files = project.files.filter(f => !toDelete.has(f.id));

    // Clean up open tabs
    project.editorState.openTabs = project.editorState.openTabs.filter(
      id => !toDelete.has(id)
    );
    if (toDelete.has(project.editorState.activeTabId)) {
      project.editorState.activeTabId =
        project.editorState.openTabs[project.editorState.openTabs.length - 1] || null;
    }

    await project.save();

    req.io.to(`project:${project._id}`).emit('file:deleted', {
      fileIds: [...toDelete],
    });

    res.json({ deleted: [...toDelete] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/files/:projectId/editor-state - save editor state (tabs, cursor, etc.)
router.patch('/:projectId/state/editor', protect, async (req, res) => {
  try {
    const { openTabs, activeTabId, cursorPositions } = req.body;
    const project = await Project.findOne({ _id: req.params.projectId, owner: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (openTabs !== undefined) project.editorState.openTabs = openTabs;
    if (activeTabId !== undefined) project.editorState.activeTabId = activeTabId;
    if (cursorPositions) {
      project.editorState.cursorPositions = new Map(Object.entries(cursorPositions));
    }

    await project.save();
    res.json({ editorState: project.editorState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
