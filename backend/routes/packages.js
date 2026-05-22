const express = require('express');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/packages/:projectId/install - simulate npm install
router.post('/:projectId/install', protect, async (req, res) => {
  try {
    const { packageName } = req.body;
    if (!packageName) return res.status(400).json({ error: 'packageName is required' });

    const project = await Project.findOne({ _id: req.params.projectId, owner: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Check if already installed
    const exists = project.packages.find(p => p.name === packageName);
    if (exists) {
      return res.json({ message: `${packageName} already installed`, package: exists });
    }

    // Fetch package info from npm registry to get version
    let version = 'latest';
    try {
      const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`);
      if (response.ok) {
        const data = await response.json();
        version = data.version || 'latest';
      }
    } catch {
      // If registry unreachable, use 'latest'
    }

    const pkg = { name: packageName, version };
    project.packages.push(pkg);

    // Add terminal history entry
    project.terminalHistory.push({
      command: `npm install ${packageName}`,
      output: `added ${packageName}@${version} ✓`,
    });

    await project.save();

    // Emit real-time update
    req.io.to(`project:${project._id}`).emit('package:installed', { package: pkg });

    res.json({ package: pkg, message: `Successfully installed ${packageName}@${version}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/packages/:projectId/:packageName - uninstall package
router.delete('/:projectId/:packageName', protect, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.projectId, owner: req.user._id });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const { packageName } = req.params;
    project.packages = project.packages.filter(p => p.name !== packageName);

    project.terminalHistory.push({
      command: `npm uninstall ${packageName}`,
      output: `removed ${packageName} ✓`,
    });

    await project.save();
    res.json({ message: `Removed ${packageName}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/packages/:projectId - list installed packages
router.get('/:projectId', protect, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.projectId, owner: req.user._id })
      .select('packages');
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ packages: project.packages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
