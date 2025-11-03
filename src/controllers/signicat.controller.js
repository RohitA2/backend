/**
 * 🇸🇪 Signicat Swedish BankID (SBID) Sandbox Integration
 * Using Signicat Sign API v3 and OAuth2 client_credentials
 */

const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

// 🌍 Environment Variables
const BASE_URL = process.env.SIGNICAT_BASE_URL; // e.g., https://test-api.sandbox.signicat.com
const API_URL = process.env.SIGNICAT_API_URL ;
const CLIENT_ID = process.env.SIGNICAT_CLIENT_ID;
const CLIENT_SECRET = process.env.SIGNICAT_CLIENT_SECRET;
const REDIRECT_URI = process.env.SIGNICAT_REDIRECT_URI;
const SCOPE = process.env.SIGNICAT_SCOPE || "signicat-api";

const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * 🔐 Get OAuth Token (client_credentials)
 */
async function getAccessToken() {
  const tokenUrl = `${BASE_URL}/auth/open/connect/token`;
  try {
    const response = await axios.post(
      tokenUrl,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: SCOPE,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    console.log("✅ Access token retrieved");
    return response.data.access_token;
  } catch (err) {
    console.error("❌ Error fetching token:", err.response?.data || err.message);
    throw new Error("Failed to get Signicat token");
  }
}

/**
 * ✍️ Create a Signicat Signing Session (Swedish BankID)
 */
exports.createSignSession = async (req, res) => {
  try {
    const { userId, proposalId } = req.body;
    const file = req.file;

    // Validate PDF
    if (!file) return res.status(400).json({ success: false, message: "No PDF uploaded" });
    if (file.size > MAX_PDF_SIZE) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ success: false, message: "PDF too large. Max 10MB." });
    }

    console.log("📄 Uploaded:", file.originalname, file.size, "bytes");

    const token = await getAccessToken();
    const pdfBase64 = fs.readFileSync(file.path, { encoding: "base64" });

    const payload = {
      title: "Proposal Signing (Swedish BankID)",
      description: "Digital signing via Swedish BankID",
      documents: [
        {
          title: file.originalname,
          description: "Proposal document for signature",
          data: pdfBase64,
          format: "pdf",
        },
      ],
      signers: [
        {
          externalSignerId: userId || "test-user",
          redirectSettings: {
            successUrl: `${REDIRECT_URI}?status=success&proposalId=${proposalId}`,
            abortUrl: `${REDIRECT_URI}?status=aborted`,
            errorUrl: `${REDIRECT_URI}?status=error`,
          },
          // 🇸🇪 BankID Sweden configuration
          signatureMethods: [
            {
              type: "BANKID_SE",
              signatureType: "SIGN",
              reuseLogin: false,
            },
          ],
        },
      ],
      ui: {
        language: "en",
        redirectMode: "redirect",
      },
    };

    const response = await axios.post(`${API_URL}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const signer = response.data.signers?.[0];
    const redirectUrl = signer?.redirectUrl;

    // Clean up uploaded file
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    if (!redirectUrl) {
      console.error("⚠️ No redirect URL from Signicat:", response.data);
      return res.status(500).json({
        success: false,
        message: "Missing redirect URL in Signicat response",
        data: response.data,
      });
    }

    res.json({
      success: true,
      signUrl: redirectUrl,
      sessionId: response.data.sessionId,
    });
  } catch (err) {
    console.error("❌ Signicat Error:", {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });

    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.status(500).json({
      success: false,
      message: err.response?.data?.error_description || "Failed to create signing session",
    });
  }
};
