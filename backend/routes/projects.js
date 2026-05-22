const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Default file templates for new projects
const getTemplateFiles = (template) => {
  const id1 = uuidv4();
  const id2 = uuidv4();
  const id3 = uuidv4();
  const id4 = uuidv4();

  const templates = {
    react: [
      {
        id: id1, name: 'src', type: 'folder', path: '/src',
        parentId: null, content: '', language: 'plaintext', isOpen: true,
      },
      {
        id: id2, name: 'App.jsx', type: 'file', path: '/src/App.jsx',
        parentId: id1, language: 'javascript',
        content: `import { useState } from 'react'\n\nfunction App() {\n  const [count, setCount] = useState(0)\n\n  return (\n    <div className="app">\n      <h1>CodeForge React App</h1>\n      <button onClick={() => setCount(c => c + 1)}>\n        Count: {count}\n      </button>\n    </div>\n  )\n}\n\nexport default App\n`,
      },
      {
        id: id3, name: 'main.jsx', type: 'file', path: '/src/main.jsx',
        parentId: id1, language: 'javascript',
        content: `import React from 'react'\nimport ReactDOM from 'react-dom/client'\nimport App from './App.jsx'\n\nReactDOM.createRoot(document.getElementById('root')).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n)\n`,
      },
      {
        id: id4, name: 'index.html', type: 'file', path: '/index.html',
        parentId: null, language: 'html',
        content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <title>CodeForge App</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.jsx"></script>\n</body>\n</html>\n`,
      },
    ],
    'vanilla-js': [
      {
        id: id1, name: 'index.html', type: 'file', path: '/index.html',
        parentId: null, language: 'html',
        content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <title>My App</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello, CodeForge!</h1>\n  <script src="app.js"></script>\n</body>\n</html>\n`,
      },
      {
        id: id2, name: 'style.css', type: 'file', path: '/style.css',
        parentId: null, language: 'css',
        content: `body {\n  font-family: sans-serif;\n  background: #0d0d0d;\n  color: #fff;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  margin: 0;\n}\n`,
      },
      {
        id: id3, name: 'app.js', type: 'file', path: '/app.js',
        parentId: null, language: 'javascript',
        content: `console.log('Hello from CodeForge!');\n`,
      },
    ],
    blank: [
      {
        id: id1, name: 'index.js', type: 'file', path: '/index.js',
        parentId: null, language: 'javascript',
        content: `// Welcome to CodeForge!\nconsole.log('Hello, World!');\n`,
      },
    ],
  };

  return templates[template] || templates.blank;
};

// GET /api/projects - list user's projects
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.user._id })
      .select('-files') // Don't send file content in list
      .sort({ lastAccessedAt: -1 });
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects - create project
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, template = 'blank' } = req.body;

    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const files = getTemplateFiles(template);
    const firstFile = files.find(f => f.type === 'file');

    const project = await Project.create({
      name,
      description,
      owner: req.user._id,
      template,
      files,
      editorState: {
        openTabs: firstFile ? [firstFile.id] : [],
        activeTabId: firstFile ? firstFile.id : null,
        cursorPositions: {},
      },
    });

    res.status(201).json({ project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id - get single project
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.lastAccessedAt = new Date();
    await project.save();

    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/projects/:id - update project metadata
router.patch('/:id', protect, async (req, res) => {
  try {
    const { name, description, editorState } = req.body;
    const project = await Project.findOne({ _id: req.params.id, owner: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (editorState) project.editorState = { ...project.editorState, ...editorState };

    await project.save();
    res.json({ project });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
