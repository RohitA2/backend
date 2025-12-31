// const db = require("../config/database");

// // Get all templates for a user
// exports.getUserTemplates = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { filter } = req.query;

//     if (!userId) {
//       return res.status(400).json({
//         success: false,
//         error: "User ID is required",
//       });
//     }

//     // Build where clause based on filter
//     let whereClause = {
//       userId,
//       isTemplate: true,
//     };

//     // Apply filters if specified
//     if (filter) {
//       switch (filter) {
//         case 'my':
//           // Only user's own templates (no shared flag or empty templates)
//           // Adjust based on your shared logic
//           break;
//         case 'shared':
//           // Templates shared with others
//           // You might need a separate shared_templates table for this
//           break;
//         case 'empty':
//           // Empty templates (no content)
//           whereClause.templateData = null;
//           break;
//         // No special filter for 'all'
//       }
//     }

//     const templates = await db.models.ProposalEmail.findAll({
//       where: whereClause,
//       order: [["createdAt", "DESC"]],
//       attributes: [
//         "id",
//         "templateName",
//         "link",
//         "proposalName",
//         "fromName",
//         "fromEmail",
//         "expirationDate",
//         "templateData",
//         "isTemplate",
//         "createdAt",
//         "updatedAt",
//       ],
//     });

//     // Format response
//     const formattedTemplates = templates.map(template => ({
//       id: template.id,
//       name: template.templateName || template.proposalName,
//       link:template.link,
//       category: template.templateData?.category || "general",
//       description: template.templateData?.description || "No description",
//       createdAt: template.createdAt,
//       uses: template.templateData?.uses || 0,
//       isFavorite: template.templateData?.isFavorite || false,
//       isShared: template.templateData?.isShared || false,
//       isEmpty: !template.templateData || Object.keys(template.templateData).length === 0,
//       thumbnail: template.templateData?.thumbnail || null,
//       // Include all template data
//       templateData: template.templateData,
//       originalName: template.proposalName,
//       from: {
//         name: template.fromName,
//         email: template.fromEmail,
//       }
//     }));

//     res.status(200).json({
//       success: true,
//       count: formattedTemplates.length,
//       data: formattedTemplates,
//     });
//   } catch (error) {
//     console.error("Error fetching templates:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to fetch templates",
//       message: error.message,
//     });
//   }
// };

// // Get single template by ID
// exports.getTemplateById = async (req, res) => {
//   try {
//     const { templateId } = req.params;
//     const { userId } = req.query;

//     const template = await db.models.ProposalEmail.findOne({
//       where: {
//         id: templateId,
//         isTemplate: true,
//         ...(userId && { userId }), // Optional user filter
//       },
//     });

//     if (!template) {
//       return res.status(404).json({
//         success: false,
//         error: "Template not found",
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: template,
//     });
//   } catch (error) {
//     console.error("Error fetching template:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to fetch template",
//       message: error.message,
//     });
//   }
// };

// // Create a new template
// exports.createTemplate = async (req, res) => {
//   try {
//     const {
//       userId,
//       name,
//       description,
//       templateData,
//       thumbnail,
//       category = "general",
//       isFavorite = false,
//       isShared = false,
//       // Original document data for reference
//       parentId,
//       proposalName,
//       fromName,
//       fromEmail,
//       expirationDate,
//       link,
//     } = req.body;

//     if (!userId || !name) {
//       return res.status(400).json({
//         success: false,
//         error: "User ID and template name are required",
//       });
//     }

//     // Check if template with same name already exists for this user
//     const existingTemplate = await db.models.ProposalEmail.findOne({
//       where: {
//         userId,
//         templateName: name,
//         isTemplate: true,
//       },
//     });

//     if (existingTemplate) {
//       return res.status(409).json({
//         success: false,
//         error: "A template with this name already exists",
//       });
//     }

//     // Prepare template data
//     const fullTemplateData = {
//       ...templateData,
//       name,
//       description: description || "No description",
//       thumbnail,
//       category,
//       isFavorite,
//       isShared,
//       uses: 0,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };

//     // Create the template
//     const newTemplate = await db.models.ProposalEmail.create({
//       userId,
//       parentId,
//       proposalName: name,
//       fromName,
//       fromEmail,
//       expirationDate,
//       link,
//       isTemplate: true,
//       templateName: name,
//       templateData: fullTemplateData,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Template created successfully",
//       data: {
//         id: newTemplate.id,
//         name: newTemplate.templateName,
//         description: fullTemplateData.description,
//         category: fullTemplateData.category,
//         createdAt: newTemplate.createdAt,
//       },
//     });
//   } catch (error) {
//     console.error("Error creating template:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to create template",
//       message: error.message,
//     });
//   }
// };

// // Update template
// exports.updateTemplate = async (req, res) => {
//   try {
//     const { templateId } = req.params;
//     const { userId } = req.query;
//     const updates = req.body;

//     // Find the template
//     const template = await db.models.ProposalEmail.findOne({
//       where: {
//         id: templateId,
//         isTemplate: true,
//         userId, // Ensure user owns the template
//       },
//     });

//     if (!template) {
//       return res.status(404).json({
//         success: false,
//         error: "Template not found or unauthorized",
//       });
//     }

//     // Handle template name change
//     if (updates.name) {
//       // Check if new name already exists (for this user)
//       const existingWithName = await db.models.ProposalEmail.findOne({
//         where: {
//           userId,
//           templateName: updates.name,
//           isTemplate: true,
//           id: { [Op.ne]: templateId }, // Not the current template
//         },
//       });

//       if (existingWithName) {
//         return res.status(409).json({
//           success: false,
//           error: "A template with this name already exists",
//         });
//       }

//       template.templateName = updates.name;
//       template.proposalName = updates.name;
//     }

//     // Update template data
//     if (updates.templateData) {
//       template.templateData = {
//         ...template.templateData,
//         ...updates.templateData,
//         updatedAt: new Date(),
//       };
//     }

//     // Update individual fields
//     if (updates.description !== undefined) {
//       template.templateData = {
//         ...template.templateData,
//         description: updates.description,
//         updatedAt: new Date(),
//       };
//     }

//     if (updates.category !== undefined) {
//       template.templateData = {
//         ...template.templateData,
//         category: updates.category,
//         updatedAt: new Date(),
//       };
//     }

//     if (updates.isFavorite !== undefined) {
//       template.templateData = {
//         ...template.templateData,
//         isFavorite: updates.isFavorite,
//         updatedAt: new Date(),
//       };
//     }

//     if (updates.isShared !== undefined) {
//       template.templateData = {
//         ...template.templateData,
//         isShared: updates.isShared,
//         updatedAt: new Date(),
//       };
//     }

//     await template.save();

//     res.status(200).json({
//       success: true,
//       message: "Template updated successfully",
//       data: template,
//     });
//   } catch (error) {
//     console.error("Error updating template:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to update template",
//       message: error.message,
//     });
//   }
// };

// // Delete template
// exports.deleteTemplate = async (req, res) => {
//   try {
//     const { templateId } = req.params;
//     const { userId } = req.query;

//     const template = await db.models.ProposalEmail.findOne({
//       where: {
//         id: templateId,
//         isTemplate: true,
//         userId, // Ensure user owns the template
//       },
//     });

//     if (!template) {
//       return res.status(404).json({
//         success: false,
//         error: "Template not found or unauthorized",
//       });
//     }

//     await template.destroy();

//     res.status(200).json({
//       success: true,
//       message: "Template deleted successfully",
//     });
//   } catch (error) {
//     console.error("Error deleting template:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to delete template",
//       message: error.message,
//     });
//   }
// };

// // Use template (increment usage count)
// exports.useTemplate = async (req, res) => {
//   try {
//     const { templateId } = req.params;
//     const { userId } = req.body;

//     const template = await db.models.ProposalEmail.findOne({
//       where: {
//         id: templateId,
//         isTemplate: true,
//       },
//     });

//     if (!template) {
//       return res.status(404).json({
//         success: false,
//         error: "Template not found",
//       });
//     }

//     // Increment usage count
//     const templateData = template.templateData || {};
//     templateData.uses = (templateData.uses || 0) + 1;
//     templateData.lastUsed = new Date();

//     template.templateData = templateData;
//     await template.save();

//     // Return the template data for use in editor
//     res.status(200).json({
//       success: true,
//       message: "Template loaded successfully",
//       data: {
//         ...template.toJSON(),
//         // Include any additional data needed for the editor
//         blocks: templateData.blocks || [],
//         settings: templateData.settings || {},
//       },
//     });
//   } catch (error) {
//     console.error("Error using template:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to load template",
//       message: error.message,
//     });
//   }
// };

// // Duplicate template
// exports.duplicateTemplate = async (req, res) => {
//   try {
//     const { templateId } = req.params;
//     const { userId, newName } = req.body;

//     const originalTemplate = await db.models.ProposalEmail.findOne({
//       where: {
//         id: templateId,
//         isTemplate: true,
//       },
//     });

//     if (!originalTemplate) {
//       return res.status(404).json({
//         success: false,
//         error: "Template not found",
//       });
//     }

//     // Generate new name if not provided
//     const templateName = newName || `${originalTemplate.templateName} (Copy)`;

//     // Check if duplicate name exists
//     const existingDuplicate = await db.models.ProposalEmail.findOne({
//       where: {
//         userId,
//         templateName,
//         isTemplate: true,
//       },
//     });

//     if (existingDuplicate) {
//       return res.status(409).json({
//         success: false,
//         error: "A template with this name already exists",
//       });
//     }

//     // Create duplicate
//     const duplicateData = {
//       ...originalTemplate.templateData,
//       name: templateName,
//       uses: 0,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };

//     const duplicateTemplate = await ProposalEmail.create({
//       userId,
//       parentId: originalTemplate.parentId,
//       proposalName: templateName,
//       fromName: originalTemplate.fromName,
//       fromEmail: originalTemplate.fromEmail,
//       expirationDate: originalTemplate.expirationDate,
//       link: originalTemplate.link,
//       isTemplate: true,
//       templateName,
//       templateData: duplicateData,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Template duplicated successfully",
//       data: duplicateTemplate,
//     });
//   } catch (error) {
//     console.error("Error duplicating template:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to duplicate template",
//       message: error.message,
//     });
//   }
// };

// // Get template statistics
// exports.getTemplateStats = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     if (!userId) {
//       return res.status(400).json({
//         success: false,
//         error: "User ID is required",
//       });
//     }

//     const templates = await db.models.ProposalEmail.findAll({
//       where: {
//         userId,
//         isTemplate: true,
//       },
//       attributes: [
//         "id",
//         "templateName",
//         "templateData",
//         "createdAt",
//       ],
//     });

//     const stats = {
//       totalTemplates: templates.length,
//       totalUses: templates.reduce((sum, template) => {
//         return sum + (template.templateData?.uses || 0);
//       }, 0),
//       favoritesCount: templates.filter(t => t.templateData?.isFavorite).length,
//       sharedCount: templates.filter(t => t.templateData?.isShared).length,
//       emptyCount: templates.filter(t => !t.templateData || Object.keys(t.templateData).length === 0).length,
//       recentlyCreated: templates
//         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
//         .slice(0, 5)
//         .map(t => ({
//           id: t.id,
//           name: t.templateName,
//           createdAt: t.createdAt,
//         })),
//       mostUsed: templates
//         .sort((a, b) => (b.templateData?.uses || 0) - (a.templateData?.uses || 0))
//         .slice(0, 5)
//         .map(t => ({
//           id: t.id,
//           name: t.templateName,
//           uses: t.templateData?.uses || 0,
//         })),
//     };

//     res.status(200).json({
//       success: true,
//       data: stats,
//     });
//   } catch (error) {
//     console.error("Error fetching template stats:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to fetch template statistics",
//       message: error.message,
//     });
//   }
// };