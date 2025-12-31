// const express = require("express");
// const router = express.Router();
// const templateController = require("../controllers/templateController");

// // Get all templates for a user (with optional filter)
// router.get("/:userId", templateController.getUserTemplates);

// // Get single template by ID
// router.get("/:templateId", templateController.getTemplateById);

// // Create a new template
// router.post("/templates", templateController.createTemplate);

// // Update template
// router.put("/:templateId", templateController.updateTemplate);

// // Delete template
// router.delete("/:templateId", templateController.deleteTemplate);

// // Use template (load for editing)
// router.post("/:templateId/use", templateController.useTemplate);

// // Duplicate template
// router.post("/:templateId/duplicate", templateController.duplicateTemplate);

// // Get template statistics
// router.get("/:userId/templates/stats", templateController.getTemplateStats);


// module.exports = router;

// routes/templates.js

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const authMiddleware = require("../middleware/authMiddleware");

const API_URL = process.env.API_URL || "http://localhost:5000";

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads/templates/previews");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for thumbnail upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Only image files (jpeg, jpg, png, webp) are allowed!"));
    },
});

// GET /api/templates - List all templates for the authenticated user
router.get("/all", authMiddleware, async (req, res) => {
    try {
        const templates = await db.models.ProposalTemplate.findAll({
            where: { userId: req.user.id },
            attributes: ["id", "name", "description", "previewUrl", "createdAt", "updatedAt", "data"],
            order: [["created_at", "DESC"]],
        });

        res.json({
            success: true,
            templates,
        });
    } catch (err) {
        console.error("Error fetching templates:", err);
        res.status(500).json({ success: false, error: "Failed to fetch templates" });
    }
});

// GET /api/templates/:id - Get single template details
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const template = await db.models.ProposalTemplate.findOne({
            where: { id: req.params.id, userId: req.user.id },
        });

        if (!template) {
            return res.status(404).json({ success: false, error: "Template not found" });
        }

        res.json({
            success: true,
            template,
        });
    } catch (err) {
        console.error("Error fetching template:", err);
        res.status(500).json({ success: false, error: "Failed to fetch template" });
    }
});

// POST /api/templates/:id/preview - Upload thumbnail for template
router.post("/:id/preview", authMiddleware, upload.single("preview"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: "No file uploaded" });
        }

        const template = await db.ProposalTemplate.findOne({
            where: { id: req.params.id, userId: req.user.id },
        });

        if (!template) {
            // Clean up uploaded file if template not found
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, error: "Template not found" });
        }

        // Delete old preview if exists
        if (template.previewUrl) {
            const oldPath = path.join(__dirname, "..", template.previewUrl.replace(API_URL, ""));
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        const previewUrl = `${API_URL}/uploads/templates/previews/${req.file.filename}`;

        template.previewUrl = previewUrl;
        await template.save();

        res.json({
            success: true,
            message: "Thumbnail uploaded successfully",
            previewUrl,
        });
    } catch (err) {
        console.error("Error uploading thumbnail:", err);
        if (req.file) {
            fs.unlinkSync(req.file.path); // Clean up on error
        }
        res.status(500).json({ success: false, error: "Failed to upload thumbnail" });
    }
});

// POST /api/templates/:id/load - Create a new proposal from a template
// router.post("/:id/load", authMiddleware, async (req, res) => {
//     try {
//         const template = await db.models.ProposalTemplate.findOne({
//             where: { id: req.params.id, userId: req.user.id },
//         });

//         if (!template) {
//             return res.status(404).json({ success: false, error: "Template not found" });
//         }

//         const templateData = template.data;

//         console.log("i am template data", templateData);

//         // 1. Create new parent
//         let company_id = null;
//         // Add your company_id logic if needed

//         const parentRes = await fetch(`${API_URL}/parents/CreateParent`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ user_id: req.user.id, company_id }),
//         });

//         if (!parentRes.ok) {
//             throw new Error("Failed to create new parent");
//         }

//         const { id: newParentId } = await parentRes.json();

//         // 2. Recreate blocks
//         const blockOrder = [];
//         let orderIndex = 0;

//         for (const savedBlock of templateData.blocks || []) {
//             const { type, settings = {}, data = {} } = savedBlock;

//             let endpoint = "";
//             switch (type) {
//                 case "header-1":
//                 case "header-2":
//                 case "header-3":
//                 case "header-4":
//                 case "header-5":
//                     endpoint = `${API_URL}/api/CreateHeaderBlock`;
//                     break;
//                 case "text":
//                     endpoint = `${API_URL}/text/createorupdatetextblock`;
//                     break;
//                 case "signature":
//                     endpoint = `${API_URL}/signatures/create`;
//                     break;
//                 case "video":
//                     endpoint = `${API_URL}/api/videoBlock`;
//                     break;
//                 case "pdf":
//                     endpoint = `${API_URL}/api/pdfBlock`;
//                     break;
//                 case "link":
//                     endpoint = `${API_URL}/api/attachmentBlock`;
//                     break;
//                 case "parties":
//                     endpoint = `${API_URL}/parties/block`;
//                     break;
//                 case "price":
//                 case "price-2":
//                 case "price-3":
//                     endpoint = `${API_URL}/api/pricingBlock`;
//                     break;
//                 case "terms":
//                     endpoint = `${API_URL}/api/termsBlock`;
//                     break;
//                 case "calender":
//                     endpoint = `${API_URL}/schedules/sign`;
//                     break;
//                 case "cover":
//                 case "cover-1":
//                 case "cover-2":
//                 case "cover-3":
//                 case "cover-4":
//                 case "cover-5":
//                     endpoint = `${API_URL}/cover/coverBlock`;
//                     break;
//                 default:
//                     console.warn(`Unsupported block type in template: ${type}`);
//                     continue;
//             }

//             const blockPayload = {
//                 type,
//                 settings,
//                 data,
//                 parentId: newParentId,
//             };
//             console.log(`Creating ${type} block → POST ${endpoint}`);
//             const blockRes = await fetch(endpoint, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(blockPayload),
//             });

//             console.log("i am from blockRes", blockRes);
//             if (blockRes.ok) {
//                 const newBlock = await blockRes.json();
//                 const blockId = newBlock.id || newBlock.blockId || uuidv4();
//                 blockOrder.push({
//                     id: blockId,
//                     type,
//                     orderIndex: orderIndex++,
//                 });
//             }
//         }

//         // 3. Save block order
//         if (blockOrder.length > 0) {
//             await fetch(`${API_URL}/parents/${newParentId}/blocks/order`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ blocks: blockOrder }),
//             });
//         }

//         res.json({
//             success: true,
//             message: "Template loaded successfully",
//             parentId: newParentId,
//         });
//     } catch (err) {
//         console.error("Error loading template:", err);
//         res.status(500).json({ success: false, error: "Failed to load template" });
//     }
// });


router.post("/:id/load", authMiddleware, async (req, res) => {
    try {
        const template = await db.models.ProposalTemplate.findOne({
            where: { id: req.params.id, userId: req.user.id },
        });

        if (!template) {
            return res.status(404).json({ success: false, error: "Template not found" });
        }

        const templateData = template.data;
        console.log("Template data:", templateData);

        // 1. Create new parent
        const parentRes = await fetch(`${API_URL}/parents/CreateParent`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: req.user.id }),
        });

        if (!parentRes.ok) throw new Error("Failed to create parent");
        const { id: newParentId } = await parentRes.json();

        // 2. Recreate blocks
        const blockOrder = [];
        let orderIndex = 0;

        // for (const savedBlock of templateData.blocks || []) {
        //     const { type, settings = {}, data = {} } = savedBlock;

        //     // Generate a new UUID for this block
        //     const blockId = uuidv4();

        //     let endpoint = "";
        //     let payload = {};

        //     switch (type) {
        //         case "header-1":
        //         case "header-2":
        //         case "header-3":
        //         case "header-4":
        //         case "header-5":
        //             endpoint = `${API_URL}/api/CreateHeaderBlock`;
        //             payload = {
        //                 id: blockId,                    // Required because id is not auto-increment
        //                 title: data.title || "Sales Proposal",
        //                 subtitle: data.subtitle || "Optional",
        //                 clientName: data.clientName || "Client name",
        //                 senderName: data.senderName || "Sender name",
        //                 styles: data.styles || settings || {},
        //                 layoutStyles: settings.layoutStyles || {},
        //                 backgroundImage: settings.backgroundImage,
        //                 backgroundColor: settings.backgroundColor,
        //                 textColor: settings.textColor,
        //                 price: data.price || "INCL.VAT",
        //                 layoutType: settings.layoutType,
        //                 parentId: newParentId,
        //                 userId: req.user.id,
        //             };
        //             break;

        //         case "text":
        //             endpoint = `${API_URL}/text/createorupdatetextblock`;
        //             payload = {
        //                 blockId: blockId,               // This endpoint checks blockId
        //                 content: data.content || "",
        //                 title: data.title || "",
        //                 parentId: newParentId,
        //             };
        //             break;

        //         case "signature":
        //             endpoint = `${API_URL}/signatures/create`;
        //             payload = {
        //                 blockId: blockId,               // Likely required
        //                 parentId: newParentId,
        //                 // Add any other fields your signature create expects
        //                 settings: settings,
        //             };
        //             break;

        //         // Add other block types with correct payload
        //         // Example for parties:
        //         case "parties":
        //             endpoint = `${API_URL}/parties/block`;
        //             payload = {
        //                 blockId: blockId,
        //                 toParty: data.toParty || [],
        //                 fromParty: data.fromParty || null,
        //                 parentId: newParentId,
        //             };
        //             break;
        //         case "video":
        //             endpoint = `${API_URL}/video/create`;
        //             break;
        //         case "pdf":
        //             endpoint = `${API_URL}/api/pdfblocks`;
        //             break;
        //         case "link":
        //             endpoint = `${API_URL}/attachments/upload`;
        //             break;
        //         case "parties":
        //             endpoint = `${API_URL}/parties/save`;
        //             break;
        //         case "price":
        //         case "price-2":
        //         case "price-3":
        //             endpoint = `${API_URL}/pricing/service`;
        //             break;
        //         case "terms":
        //             endpoint = `${API_URL}/terms/save`;
        //             break;
        //         case "calender":
        //             endpoint = `${API_URL}/schedules/save`;
        //             break;
        //         case "cover":
        //         case "cover-1":
        //         case "cover-2":
        //         case "cover-3":
        //         case "cover-4":
        //         case "cover-5":
        //             endpoint = `${API_URL}/cover/CreateCoverBlock`;
        //             break;
        //         default:
        //             console.warn(`Unsupported block type: ${type}`);
        //             continue;
        //     }

        //     console.log(`Creating ${type} block → POST ${endpoint}`);
        //     console.log("Payload:", payload);

        //     const blockRes = await fetch(endpoint, {
        //         method: "POST",
        //         headers: { "Content-Type": "application/json" },
        //         body: JSON.stringify(payload),
        //     });

        //     if (!blockRes.ok) {
        //         const errorText = await blockRes.text();
        //         console.error(`Failed to create ${type} block:`, blockRes.status, errorText);
        //         // Continue with other blocks instead of failing completely
        //         continue;
        //     }

        //     const newBlock = await blockRes.json();
        //     console.log(`Created ${type} block:`, newBlock);

        //     blockOrder.push({
        //         id: blockId,
        //         type,
        //         orderIndex: orderIndex++,
        //     });
        // }
        for (const savedBlock of templateData.blocks || []) {
            const { type, settings = {}, data = {} } = savedBlock;

            // Generate a new UUID for this block (client-side ID)
            const blockId = uuidv4();

            let endpoint = "";
            let payload = {
                blockId,         // Most endpoints expect blockId (string UUID)
                parentId: newParentId,
                // userId: req.user.id, // Add if some endpoints require it
                settings,        // Visual/layout settings
                ...data,         // Content-specific data (spread to flatten)
            };

            switch (type) {
                case "header-1":
                case "header-2":
                case "header-3":
                case "header-4":
                case "header-5":
                    endpoint = `${API_URL}/api/CreateHeaderBlock`;
                    payload = {
                        id: blockId,                    // This endpoint uses 'id' (not blockId)
                        title: data.title || "<p>Sales Proposal</p>",
                        subtitle: data.subtitle || "<p>Optional</p>",
                        clientName: data.clientName || "<p>Client name</p>",
                        senderName: data.senderName || "<p>Sender name</p>",
                        styles: data.styles || settings || {},
                        layoutStyles: settings.layoutStyles || {},
                        backgroundImage: settings.backgroundImage,
                        backgroundColor: settings.backgroundColor,
                        textColor: settings.textColor,
                        price: data.price || "INCL.VAT",
                        layoutType: settings.layoutType || "left-panel",
                        parentId: newParentId,
                        userId: req.user.id,
                    };
                    break;

                case "text":
                    endpoint = `${API_URL}/text/createorupdatetextblock`;
                    payload = {
                        blockId,
                        content: data.content || "",
                        title: data.title || "",
                        parentId: newParentId,
                    };
                    break;

                case "signature":
                    endpoint = `${API_URL}/signatures/create`;
                    payload = {
                        blockId,
                        parentId: newParentId,
                        settings: settings || {},
                    };
                    break;

                case "video":
                    endpoint = `${API_URL}/video/create`; // Adjust if different
                    payload = {
                        blockId,
                        parentId: newParentId,
                        video: data.video || null,
                        filename: data.filename || null,
                        videoId: data.videoId || null,
                        settings: settings || {},
                    };
                    break;

                case "pdf":
                    endpoint = `${API_URL}/api/pdfblocks`; // Adjust if different (e.g., /pdf/create)
                    payload = {
                        blockId,
                        parentId: newParentId,
                        pdf: data.pdf || null,
                        filename: data.filename || null,
                        settings: settings || {},
                    };
                    break;

                case "link":
                    endpoint = `${API_URL}/attachments/upload`; // Adjust if different
                    // Note: Attachments might be multiple — if data is array, loop and create each
                    // For simplicity, assume data is object or single
                    payload = {
                        blockId,
                        parentId: newParentId,
                        originalName: data.originalName || null,
                        displayName: data.displayName || null,
                        filename: data.filename || null,
                        path: data.path || null,
                        mime: data.mime || null,
                        size: data.size || null,
                        settings: settings || {},
                    };
                    break;

                case "parties":
                    endpoint = `${API_URL}/parties/block`; // or /parties/save
                    payload = {
                        blockId,
                        parentId: newParentId,
                        toParty: data.toParty || [],
                        fromParty: data.fromParty || null,
                    };
                    break;

                case "price":
                case "price-2":
                case "price-3":
                    endpoint = `${API_URL}/pricing/service`; // Adjust if different
                    payload = {
                        blockId,
                        parentId: newParentId,
                        title: data.title || "Scope of Work",
                        packageName: data.packageName || "",
                        packageDescription: data.packageDescription || null,
                        currency: data.currency || "USD",
                        pricingType: data.pricingType || "Approximate price",
                        netTotal: data.netTotal || 0,
                        vat: data.vat || 0,
                        rutDiscount: data.rutDiscount || 0,
                        rotDiscount: data.rotDiscount || 0,
                        envTax: data.envTax || 0,
                        rounding: data.rounding || 0,
                        total: data.total || 0,
                        // Items: if data has items array, you may need separate calls
                        // For now, assume controller handles items or data.items is ignored
                        settings: settings || {},
                    };
                    break;

                case "terms":
                    endpoint = `${API_URL}/terms/save`; // Adjust if different
                    payload = {
                        blockId,
                        parentId: newParentId,
                        title: data.title || null,
                        content: data.content || null,
                        type: data.type || null,
                    };
                    break;

                case "calender":
                    endpoint = `${API_URL}/schedules/save`; // Adjust if different
                    // Schedule might be multiple rows — if data is array, loop and create each
                    if (Array.isArray(data)) {
                        // Handle multiple schedules
                        for (const sched of data) {
                            const schedPayload = {
                                blockId,
                                parentId: newParentId,
                                date: sched.date,
                                time: sched.time,
                                location: sched.location || null,
                                description: sched.description || null,
                                comment: sched.comment || null,
                            };
                            // Make separate call for each schedule item
                            const schedRes = await fetch(endpoint, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(schedPayload),
                            });
                            if (!schedRes.ok) console.error("Failed to create schedule item");
                        }
                        // Continue to push blockId once
                    } else {
                        payload = {
                            blockId,
                            parentId: newParentId,
                            date: data.date,
                            time: data.time,
                            location: data.location || null,
                            description: data.description || null,
                            comment: data.comment || null,
                        };
                    }
                    break;

                case "cover":
                case "cover-1":
                case "cover-2":
                case "cover-3":
                case "cover-4":
                case "cover-5":
                    endpoint = `${API_URL}/cover/CreateCoverBlock`; // Adjust if different
                    payload = {
                        blockId,
                        parentId: newParentId,
                        content: data.content || null,
                        settings: settings || {},
                    };
                    break;

                default:
                    console.warn(`Unsupported block type in template: ${type}`);
                    continue;
            }

            // For non-array cases (most blocks)
            if (endpoint && !Array.isArray(data)) { // Skip if we handled array separately (like calender)
                console.log(`Creating ${type} block → POST ${endpoint}`);
                console.log("Payload:", payload);

                const blockRes = await fetch(endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!blockRes.ok) {
                    const errorText = await blockRes.text();
                    console.error(`Failed to create ${type} block: ${blockRes.status} ${errorText}`);
                    continue;
                }

                const newBlock = await blockRes.json();
                console.log(`Created ${type} block:`, newBlock);
            }

            // Always push to blockOrder (even if creation failed partially)
            blockOrder.push({
                id: blockId,
                type,
                orderIndex: orderIndex++,
            });
        }
        // 3. Save block order
        if (blockOrder.length > 0) {
            const orderRes = await fetch(`${API_URL}/parents/${newParentId}/blocks/order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ blocks: blockOrder }),
            });

            if (!orderRes.ok) {
                console.error("Failed to save block order");
            }
        }

        res.json({
            success: true,
            message: "Template loaded successfully",
            parentId: newParentId,
        });
    } catch (err) {
        console.error("Error loading template:", err);
        res.status(500).json({ success: false, error: "Failed to load template" });
    }
});
// DELETE /api/templates/:id - Delete template (and its preview if exists)
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const template = await db.models.ProposalTemplate.findOne({
            where: { id: req.params.id, userId: req.user.id },
        });

        if (!template) {
            return res.status(404).json({ success: false, error: "Template not found" });
        }

        // Delete preview file if exists
        if (template.previewUrl) {
            const filePath = path.join(__dirname, "..", template.previewUrl.replace(API_URL, ""));
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await template.destroy();

        res.json({ success: true, message: "Template deleted successfully" });
    } catch (err) {
        console.error("Error deleting template:", err);
        res.status(500).json({ success: false, error: "Failed to delete template" });
    }
});

// PATCH /api/templates/:id - Update template name/description
router.patch("/:id", authMiddleware, async (req, res) => {
    try {
        const { name, description } = req.body;

        const template = await db.models.ProposalTemplate.findOne({
            where: { id: req.params.id, userId: req.user.id },
        });

        if (!template) {
            return res.status(404).json({ success: false, error: "Template not found" });
        }

        if (name) template.name = name;
        if (description !== undefined) template.description = description;

        await template.save();

        res.json({ success: true, template });
    } catch (err) {
        console.error("Error updating template:", err);
        res.status(500).json({ success: false, error: "Failed to update template" });
    }
});

module.exports = router;