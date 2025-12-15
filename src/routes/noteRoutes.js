// routes/noteRoutes.js
const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');

// Get all notes for user
router.get('/all', noteController.getNotes);

// Get note for specific date
router.get('/:userId/:date', noteController.getNoteByDate);

// Create new note
router.post('/new', noteController.createNote);

// Update note
router.put('/:id', noteController.updateNote);

// Delete note
router.delete('/:id', noteController.deleteNote);

// Get notes by date range
router.get('/range', noteController.getNotesByDateRange);

module.exports = router;