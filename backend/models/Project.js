const mongoose = require('mongoose');

// Recursive file node schema for nested folder structure
const fileNodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['file', 'folder'], required: true },
  content: { type: String, default: '' },       // File content (code)
  language: { type: String, default: 'plaintext' },
  path: { type: String, required: true },        // Full path like /src/components/App.jsx
  parentId: { type: String, default: null },
  isOpen: { type: Boolean, default: false },     // Folder open/closed state
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    template: {
      type: String,
      enum: ['blank', 'react', 'vanilla-js', 'node', 'html'],
      default: 'blank',
    },
    // Flat array of all file nodes (easier to query/update)
    files: [fileNodeSchema],
    // Installed npm packages
    packages: [{
      name: String,
      version: String,
      installedAt: { type: Date, default: Date.now },
    }],
    // Active tabs and editor state (session persistence)
    editorState: {
      openTabs: [{ type: String }],          // Array of file IDs
      activeTabId: { type: String, default: null },
      cursorPositions: { type: Map, of: Object }, // fileId -> {line, col}
    },
    // Terminal history
    terminalHistory: [{
      command: String,
      output: String,
      timestamp: { type: Date, default: Date.now },
    }],
    isPublic: { type: Boolean, default: false },
    lastAccessedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Update lastAccessedAt on every save
projectSchema.pre('save', function (next) {
  this.lastAccessedAt = new Date();
  next();
});

module.exports = mongoose.model('Project', projectSchema);
