const express = require('express');
const router = express.Router();
const projectNotesController = require('../controllers/privateNotesController');

// GET /api/projectNotes - Get notes for a specific project and user
router.get('/notes', projectNotesController.getProjectNotes);

// POST /api/projectNotes - Save or update project notes
router.post('/save', projectNotesController.saveProjectNotes);

// GET /api/projectNotes/all/:parentId - Get all notes for a project (admin)
router.get('/all/:parentId', projectNotesController.getAllProjectNotes);

// GET /api/projectNotes/user/:userId - Get all notes by user
router.get('/user/:userId', projectNotesController.getNotesByUser);

// DELETE /api/projectNotes/:id - Delete specific notes
router.delete('/:id', projectNotesController.deleteProjectNotes);

// GET /api/projectNotes/search - Search notes content
router.get('/search', projectNotesController.searchNotes);

module.exports = router;