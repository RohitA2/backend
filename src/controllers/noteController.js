// controllers/noteController.js
const db = require('../config/database');

class NoteController {
    // Get all notes for a user
    async getNotes(req, res) {
        try {
            const { userId } = req.query;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required',
                });
            }

            const notes = await db.models.Note.findAll({
                where: { userId },
                order: [['date', 'DESC']],
            });

            res.json({
                success: true,
                data: notes,
                count: notes.length,
            });
        } catch (error) {
            console.error('Error fetching notes:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch notes',
                error: error.message,
            });
        }
    }

    // Get note for specific date
    async getNoteByDate(req, res) {
        try {
            const { userId, date } = req.params;

            const note = await db.models.Note.findOne({
                where: { userId, date },
            });

            if (!note) {
                return res.status(404).json({
                    success: false,
                    message: 'Note not found',
                });
            }

            res.json({
                success: true,
                data: note,
            });
        } catch (error) {
            console.error('Error fetching note:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch note',
                error: error.message,
            });
        }
    }

    // Create new note
    async createNote(req, res) {
        try {
            const { userId, date, title, content ,time } = req.body;

            if (!userId || !date || !content) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID, date, and content are required',
                });
            }

            // Check if note already exists for this date
            const existingNote = await db.models.Note.findOne({
                where: { userId, date },
            });

            //   if (existingNote) {
            //     return res.status(400).json({
            //       success: false,
            //       message: 'Note already exists for this date',
            //     });
            //   }

            const note = await db.models.Note.create({
                userId,
                date,
                title: title || `Note for ${date}`,
                content,
                time
            });

            res.status(201).json({
                success: true,
                message: 'Note created successfully',
                data: note,
            });
        } catch (error) {
            console.error('Error creating note:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create note',
                error: error.message,
            });
        }
    }

    // Update note
    async updateNote(req, res) {
        try {
            const { id } = req.params;
            const { title, content } = req.body;

            const note = await db.models.Note.findByPk(id);

            if (!note) {
                return res.status(404).json({
                    success: false,
                    message: 'Note not found',
                });
            }

            // Update note
            note.title = title || note.title;
            note.content = content;
            note.updatedAt = new Date();

            await note.save();

            res.json({
                success: true,
                message: 'Note updated successfully',
                data: note,
            });
        } catch (error) {
            console.error('Error updating note:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update note',
                error: error.message,
            });
        }
    }

    // Delete note
    async deleteNote(req, res) {
        try {
            const { id } = req.params;

            const note = await db.models.Note.findByPk(id);

            if (!note) {
                return res.status(404).json({
                    success: false,
                    message: 'Note not found',
                });
            }

            await note.destroy();

            res.json({
                success: true,
                message: 'Note deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting note:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete note',
                error: error.message,
            });
        }
    }

    // Get notes by date range
    async getNotesByDateRange(req, res) {
        try {
            const { userId, startDate, endDate } = req.query;

            if (!userId || !startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID, start date, and end date are required',
                });
            }

            const notes = await db.models.Note.findAll({
                where: {
                    userId,
                    date: {
                        [Sequelize.Op.between]: [startDate, endDate],
                    },
                },
                order: [['date', 'ASC']],
            });

            res.json({
                success: true,
                data: notes,
                count: notes.length,
            });
        } catch (error) {
            console.error('Error fetching notes by date range:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch notes',
                error: error.message,
            });
        }
    }
}

module.exports = new NoteController();