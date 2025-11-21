const express = require('express');
const db = require('../config/database');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const upload = multer({
    dest: path.join(__dirname, '..', 'uploads/'),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit for file uploads
    }
});

// This is the fallback local file path available in this conversation.
// Developer note: using this path as fallback per your session file upload.
const LOCAL_FALLBACK_FILE = '/mnt/data/a88c175b-b693-4b37-a617-0406c6b375f1.png';

async function fileToBase64(filePath) {
    const buffer = await fs.readFile(filePath);
    return buffer.toString('base64');
}

/**
 * 1) POST /api/bankid/start-sign-pdf
 *    - multipart/form-data with field 'file' (PDF)
 *    - optional: message (string), relay_state
 *
 * If file uploaded then we use that PDF. Otherwise we fall back to LOCAL_FALLBACK_FILE (for testing).
 */
router.post('/start-sign-pdf', upload.single('file'), async (req, res) => {
    try {
        const { message, relay_state, signature_id, parent_id, receipentEmail, recipientName } = req.body;

        // console.log("➡ Incoming request for BankID signing:", {
        //     signature_id, parent_id, receipentEmail, recipientName
        // });

        /** --------------------------------------------------
         *  STEP 1: CHECK EXISTING SIGNATURE
         * -------------------------------------------------- */
        const existing = await db.models.Signature.findOne({
            where: { blockId: signature_id }
        });

        // console.log("existing Signature:", existing?.dataValues || null);

        if (existing) {
            if (existing.status === "signed") {
                return res.status(400).json({
                    success: false,
                    message: "This document is already signed."
                });
            }

            if (existing.status === "declined") {
                return res.status(400).json({
                    success: false,
                    message: "This signing request was already declined."
                });
            }

            // if (existing.status === "pending") {
            //     return res.status(400).json({
            //         success: false,
            //         message: "A signing session is already in progress."
            //     });
            // }
        }

        /** --------------------------------------------------
         *  STEP 2: SELECT PDF (Uploaded OR fallback)
         * -------------------------------------------------- */
        let filePath;

        if (req.file) {
            filePath = req.file.path;
            console.log("✔ Using uploaded file:", filePath);
        } else {
            filePath = LOCAL_FALLBACK_FILE;
            console.warn("⚠ No file uploaded — using fallback:", filePath);
        }

        if (!(await fs.pathExists(filePath))) {
            return res.status(400).json({
                success: false,
                error: "PDF file not found. Please upload a PDF."
            });
        }

        // Convert to Base64
        const base64 = await fileToBase64(filePath);

        /** --------------------------------------------------
         *  STEP 3: BUILD ZIGNSEC SIGN PAYLOAD
         * -------------------------------------------------- */
        const metadata = {
            end_user_ip: req.ip?.includes(':') ? "127.0.0.1" : (req.ip || "127.0.0.1"),
            user_visible_text: message || "Please sign the attached PDF document"
        };

        const payload = {
            locale: "EN",
            metadata,
            documents: [
                {
                    content: base64,
                    mime_type: "application/pdf",
                    description: req.file?.originalname || "contract.pdf"
                }
            ],
            redirect_success: `${process.env.PUBLIC_FRONTEND}/bankid-success`,
            redirect_failure: `${process.env.PUBLIC_FRONTEND}/bankid-failed`,
            relay_state
        };

        console.log("➡ Sending payload to ZignSec...");

        /** --------------------------------------------------
         *  STEP 4: CALL ZIGNSEC API
         * -------------------------------------------------- */
        const zResp = await axios.post(
            "https://test-gateway.zignsec.com/core/api/sessions/bankidse/browser/sign",
            payload,
            {
                headers: {
                    Authorization: process.env.ZIGNSEC_API_KEY,
                    "Content-Type": "application/json"
                }
            }
        );

        const sessionId = zResp.data.data.id;
        const redirectUrl = zResp.data.data.redirect_url;

        console.log("✔ ZignSec session created:", sessionId);

        /** --------------------------------------------------
         *  STEP 5: CREATE OR UPDATE DB RECORD
         * -------------------------------------------------- */
        if (!existing) {
            await db.models.Signature.create({
                blockId: signature_id,
                parentId: parent_id,
                status: "false",
                method: "BankID",
                signature: null,
                session_id: sessionId,
                receipentEmail,
                recipientName
            });
        } else {
            await existing.update({
                status: "false",
                method: "BankID",
                session_id: sessionId
            });
        }

        /** --------------------------------------------------
         *  STEP 6: SEND RESPONSE TO FRONTEND
         * -------------------------------------------------- */
        return res.json({
            success: true,
            session_id: sessionId,
            redirect_url: redirectUrl
        });

    } catch (err) {
        console.error("❌ Sign PDF error", err.response?.data || err.message);
        return res.status(500).json({
            success: false,
            error: err.response?.data || err.message
        });
    }
});



/**
 * 2) GET /api/bankid/status/:sessionId
 *    - Fetch final session structure from ZignSec
 *    - If Completed, you get signature and completion data
 */
router.get('/status/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const response = await axios.get(
            `https://test-gateway.zignsec.com/core/api/sessions/${sessionId}`,
            {
                headers: {
                    Authorization: process.env.ZIGNSEC_API_KEY
                }
            }
        );

        // response.data contains the full session info
        return res.json({ success: true, session: response.data });

    } catch (err) {
        console.error('Status error', err.response?.data || err.message);
        return res.status(500).json({ success: false, error: err.response?.data || err.message });
    }
});

module.exports = router;
