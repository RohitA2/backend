const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

const BASE_URL = process.env.ZIGNSEC_BASE;
const ZIGNSEC_KEY = process.env.SUB_KEY; // add in .env

// controllers/zignsecController.js

exports.startZignSecFlow = async (req, res) => {
    let sessionId, fileId;
    const filePath = req.file.path;

    try {
        // 1. Create Session
        const sessionPayload = { flow: "esign", product: "bankidse" };
        const sessionRes = await axios.post(BASE_URL, sessionPayload, {
            headers: { Authorization: ZIGNSEC_KEY },
        });
        sessionId = sessionRes.data.id;

        // 2. Upload PDF
        const formData = new FormData();
        formData.append("file", fs.createReadStream(filePath));

        const uploadRes = await axios.post(
            `${BASE_URL}/${sessionId}/files`,
            formData,
            {
                headers: {
                    Authorization: ZIGNSEC_KEY,
                    ...formData.getHeaders(),
                },
            }
        );
        fileId = uploadRes.data.file_id;

        // 3. Start Signing
        const startPayload = {
            file_ids: [fileId],
            user_visible_text: req.body.user_visible_text || "Please sign this document.",
            metadata: {
                proposalId: req.body.proposalId,
                parentId: req.body.parentId,
                userId: req.body.userId,
                signatureId: req.body.signatureId,     
                blockId: req.body.blockId,
                recipientEmail: req.body.recipientEmail,
                recipientName: req.body.recipientName,
                nin: req.body.nin,
                // Add any custom tracking data
            },
        };

        const startRes = await axios.post(
            `${BASE_URL}/${sessionId}/start`,
            startPayload,
            {
                headers: { Authorization: ZIGNSEC_KEY },
            }
        );

        // 4. Cleanup temp file
        fs.unlinkSync(filePath);

        // 5. Return redirect URL
        res.json({
            message: "Signing flow started",
            redirectUrl: startRes.data.redirect_url,
            sessionId,
            fileId,
        });
    } catch (error) {
        console.error("ZignSec flow error:", error.response?.data || error);
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({
            error: error.response?.data?.error || error.message || "Failed to start signing",
        });
    }
};
