const db = require('../config/database');
const { Op } = require('sequelize');

const projectNotesController = {
    // Get notes for a specific project and user
    getProjectNotes: async (req, res) => {
        try {
            const { parentId, userId } = req.query;
            // console.log("🚀 ~ file: privateNotesRoutes.js:13 ~ projectNotesController.getProjectNotes= ~ req.query:", req.query)
            if (!parentId || !userId) {
                return res.status(400).json({
                    success: false,
                    error: 'parentId and userId are required'
                });
            }

            const projectNote = await db.models.PrivateNotes.findOne({
                where: {
                    parentId,
                    userId
                },
                attributes: ['id', 'notes', 'updatedAt']
            });

            if (!projectNote) {
                // Return empty notes if not found
                return res.json({
                    success: true,
                    notes: '',
                    updatedAt: null
                });
            }

            res.json({
                success: true,
                notes: projectNote.notes,
                updatedAt: projectNote.updatedAt
            });
        } catch (error) {
            console.error('Error fetching project notes:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch project notes'
            });
        }
    },

    // Save or update project notes
    saveProjectNotes: async (req, res) => {
        const transaction = await db.sequelize.transaction();

        try {
            const { parentId, userId, notes } = req.body;

            if (!parentId || !userId) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    error: 'parentId and userId are required'
                });
            }

            // Check if notes exist for this parentId and userId
            let projectNote = await db.models.PrivateNotes.findOne({
                where: {
                    parentId,
                    userId
                },
                transaction
            });

            if (projectNote) {
                // Update existing note - call update() on the INSTANCE
                projectNote = await projectNote.update({
                    notes: notes || '',
                    updatedAt: new Date()
                }, { transaction });
            } else {
                // Create new note
                projectNote = await db.models.PrivateNotes.create({
                    parentId,
                    userId,
                    notes: notes || ''
                }, { transaction });
            }

            await transaction.commit();

            res.json({
                success: true,
                message: 'Notes saved successfully',
                data: {
                    id: projectNote.id,
                    notes: projectNote.notes,
                    updatedAt: projectNote.updatedAt
                }
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error saving project notes:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to save project notes'
            });
        }
    },

    // Get all notes for a project (admin view)
    getAllProjectNotes: async (req, res) => {
        try {
            const { parentId } = req.params;

            if (!parentId) {
                return res.status(400).json({
                    success: false,
                    error: 'parentId is required'
                });
            }

            const allNotes = await db.models.PrivateNotes.findAll({
                where: { parentId },
                include: [{
                    model: db.models.User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                }],
                order: [['updatedAt', 'DESC']]
            });

            res.json({
                success: true,
                data: allNotes
            });
        } catch (error) {
            console.error('Error fetching all project notes:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch project notes'
            });
        }
    },

    // Get notes by user ID (for user dashboard)
    getNotesByUser: async (req, res) => {
        try {
            const { userId } = req.params;
            const { limit = 10, offset = 0 } = req.query;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    error: 'userId is required'
                });
            }

            const userNotes = await db.models.PrivateNotes.findAndCountAll({
                where: { userId },
                include: [{
                    model: db.models.ProposalEmail,
                    as: 'project',
                    attributes: ['id', 'proposalName', 'link']
                }],
                order: [['updatedAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            res.json({
                success: true,
                data: userNotes.rows,
                count: userNotes.count
            });
        } catch (error) {
            console.error('Error fetching user notes:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch user notes'
            });
        }
    },

    // Delete project notes
    deleteProjectNotes: async (req, res) => {
        const transaction = await sequelize.transaction();

        try {
            const { id } = req.params;
            const { userId } = req.body;

            if (!id || !userId) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    error: 'id and userId are required'
                });
            }

            const projectNote = await db.models.PrivateNotes.findOne({
                where: {
                    id,
                    userId
                },
                transaction
            });

            if (!projectNote) {
                await transaction.rollback();
                return res.status(404).json({
                    success: false,
                    error: 'Notes not found or you do not have permission'
                });
            }

            await projectNote.destroy({ transaction });
            await transaction.commit();

            res.json({
                success: true,
                message: 'Notes deleted successfully'
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Error deleting project notes:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete project notes'
            });
        }
    },

    // Search notes content
    searchNotes: async (req, res) => {
        try {
            const { userId, searchTerm } = req.query;

            if (!userId || !searchTerm) {
                return res.status(400).json({
                    success: false,
                    error: 'userId and searchTerm are required'
                });
            }

            const searchResults = await db.models.PrivateNotes.findAll({
                where: {
                    userId,
                    notes: {
                        [Op.like]: `%${searchTerm}%`
                    }
                },
                include: [{
                    model: db.models.ProposalEmail,
                    as: 'project',
                    attributes: ['id', 'proposalName']
                }],
                order: [['updatedAt', 'DESC']],
                limit: 20
            });

            res.json({
                success: true,
                data: searchResults
            });
        } catch (error) {
            console.error('Error searching notes:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to search notes'
            });
        }
    }
};

module.exports = projectNotesController;