const express = require("express");
const router = express.Router();
const templateController = require("../controllers/templateController");

// Get all templates for a user (with optional filter)
router.get("/:userId", templateController.getUserTemplates);

// Get single template by ID
router.get("/:templateId", templateController.getTemplateById);

// Create a new template
router.post("/templates", templateController.createTemplate);

// Update template
router.put("/:templateId", templateController.updateTemplate);

// Delete template
router.delete("/:templateId", templateController.deleteTemplate);

// Use template (load for editing)
router.post("/:templateId/use", templateController.useTemplate);

// Duplicate template
router.post("/:templateId/duplicate", templateController.duplicateTemplate);

// Get template statistics
router.get("/:userId/templates/stats", templateController.getTemplateStats);


module.exports = router;