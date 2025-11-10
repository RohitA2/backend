// /**
//  * 🇸🇪 Signicat Swedish BankID (SBID) Sandbox Integration
//  * Using Signicat Sign API v3 and OAuth2 client_credentials
//  */

// const axios = require("axios");
// const fs = require("fs");
// require("dotenv").config();

// // 🌍 Environment Variables
// const BASE_URL = process.env.SIGNICAT_BASE_URL; // e.g., https://test-api.sandbox.signicat.com
// const API_URL = process.env.SIGNICAT_API_URL ;
// const CLIENT_ID = process.env.SIGNICAT_CLIENT_ID;
// const CLIENT_SECRET = process.env.SIGNICAT_CLIENT_SECRET;
// const REDIRECT_URI = process.env.SIGNICAT_REDIRECT_URI;
// const SCOPE = process.env.SIGNICAT_SCOPE || "signicat-api";

// const MAX_PDF_SIZE = 10 * 1024 * 1024; // 10MB

// /**
//  * 🔐 Get OAuth Token (client_credentials)
//  */
// async function getAccessToken() {
//   const tokenUrl = `${BASE_URL}/auth/open/connect/token`;
//   try {
//     const response = await axios.post(
//       tokenUrl,
//       new URLSearchParams({
//         grant_type: "client_credentials",
//         client_id: CLIENT_ID,
//         client_secret: CLIENT_SECRET,
//         scope: SCOPE,
//       }),
//       { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
//     );

//     console.log("✅ Access token retrieved");
//     return response.data.access_token;
//   } catch (err) {
//     console.error("❌ Error fetching token:", err.response?.data || err.message);
//     throw new Error("Failed to get Signicat token");
//   }
// }

// /**
//  * ✍️ Create a Signicat Signing Session (Swedish BankID)
//  */
// exports.createSignSession = async (req, res) => {
//   try {
//     const { userId, proposalId } = req.body;
//     const file = req.file;

//     // Validate PDF
//     if (!file) return res.status(400).json({ success: false, message: "No PDF uploaded" });
//     if (file.size > MAX_PDF_SIZE) {
//       fs.unlinkSync(file.path);
//       return res.status(400).json({ success: false, message: "PDF too large. Max 10MB." });
//     }

//     console.log("📄 Uploaded:", file.originalname, file.size, "bytes");

//     const token = await getAccessToken();
//     const pdfBase64 = fs.readFileSync(file.path, { encoding: "base64" });

//     const payload = {
//       title: "Proposal Signing (Swedish BankID)",
//       description: "Digital signing via Swedish BankID",
//       documents: [
//         {
//           title: file.originalname,
//           description: "Proposal document for signature",
//           data: pdfBase64,
//           format: "pdf",
//         },
//       ],
//       signers: [
//         {
//           externalSignerId: userId || "test-user",
//           redirectSettings: {
//             successUrl: `${REDIRECT_URI}?status=success&proposalId=${proposalId}`,
//             abortUrl: `${REDIRECT_URI}?status=aborted`,
//             errorUrl: `${REDIRECT_URI}?status=error`,
//           },
//           // 🇸🇪 BankID Sweden configuration
//           signatureMethods: [
//             {
//               type: "BANKID_SE",
//               signatureType: "SIGN",
//               reuseLogin: false,
//             },
//           ],
//         },
//       ],
//       ui: {
//         language: "en",
//         redirectMode: "redirect",
//       },
//     };

//     const response = await axios.post(`${API_URL}`, payload, {
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     });

//     const signer = response.data.signers?.[0];
//     const redirectUrl = signer?.redirectUrl;

//     // Clean up uploaded file
//     if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

//     if (!redirectUrl) {
//       console.error("⚠️ No redirect URL from Signicat:", response.data);
//       return res.status(500).json({
//         success: false,
//         message: "Missing redirect URL in Signicat response",
//         data: response.data,
//       });
//     }

//     res.json({
//       success: true,
//       signUrl: redirectUrl,
//       sessionId: response.data.sessionId,
//     });
//   } catch (err) {
//     console.error("❌ Signicat Error:", {
//       message: err.message,
//       status: err.response?.status,
//       data: err.response?.data,
//     });

//     if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

//     res.status(500).json({
//       success: false,
//       message: err.response?.data?.error_description || "Failed to create signing session",
//     });
//   }
// };

// controllers/signicat.controller.js
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

const TOKEN_URL = process.env.SIGNICAT_TOKEN_URL || "https://api.signicat.com/auth/open/connect/token";
const BASE      = process.env.SIGNICAT_API_BASE || "https://api.signicat.com";

const DOCS_URL  = `${BASE}/sign/documents`;
const COLLS_URL = `${BASE}/sign/document-collections`;
const SESS_URL  = `${BASE}/sign/signing-sessions`;

const CLIENT_ID     = process.env.SIGNICAT_CLIENT_ID;
const CLIENT_SECRET = process.env.SIGNICAT_CLIENT_SECRET;
const REDIRECT_URI  = process.env.SIGNICAT_REDIRECT_URI;
const SCOPE         = process.env.SIGNICAT_SCOPE || "signicat-api";

if (!CLIENT_ID || !CLIENT_SECRET) throw new Error("SIGNICAT_CLIENT_ID/SECRET are not set");
if (!REDIRECT_URI) throw new Error("SIGNICAT_REDIRECT_URI is not set");

const MAX_PDF_SIZE = 10 * 1024 * 1024;
const PDF_MIMES = new Set(["application/pdf"]);
const sha256base64 = (buf) => crypto.createHash("sha256").update(buf).digest("base64");

async function getAccessToken() {
  const { data } = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: SCOPE,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 10000 }
  );
  if (!data?.access_token) throw new Error("Missing access_token");
  return data.access_token;
}

// expand 10-digit YYMMDDNNNN to 12-digit YYYYMMDDNNNN (simple century guess)
function to12DigitNin(ninDigits) {
  if (ninDigits.length === 12) return ninDigits;
  const yy = parseInt(ninDigits.slice(0, 2), 10);
  const currentYY = new Date().getFullYear() % 100;
  const century = yy <= currentYY ? "20" : "19";
  return century + ninDigits;
}

exports.createSignSession = async (req, res) => {
  try {
    const { userId, proposalId } = req.body;

    // 1) NIN from body (required in your tenant)
    const rawNin = (req.body.nin || "").toString();
    const ninDigits = rawNin.replace(/\D/g, "");
    if (!ninDigits) {
      return res.status(400).json({ success: false, message: "Swedish personal identity number (nin) is required." });
    }
    if (!(ninDigits.length === 10 || ninDigits.length === 12)) {
      return res.status(400).json({ success: false, message: "Invalid NIN format. Use YYYYMMDDNNNN or YYMMDDNNNN." });
    }
    const nin12 = to12DigitNin(ninDigits);
    console.log("🪪 NIN received:", nin12);

    // 2) validate/uploaded PDF (we won't send it to Signicat; we use it to compute a hash + reference)
    if (!req.file) return res.status(400).json({ success: false, message: "No PDF uploaded" });
    const mime = req.file.mimetype || "application/octet-stream";
    if (!PDF_MIMES.has(mime)) return res.status(400).json({ success: false, message: "Only PDF is allowed" });
    if (req.file.size > MAX_PDF_SIZE) return res.status(400).json({ success: false, message: "PDF too large. Max 10MB." });

    const pdfBuffer   = req.file.buffer;
    const originalPdf = (req.file.originalname || `proposal-${proposalId || "doc"}.pdf`).replace(/[^\w.\-]+/g, "_");
    if (!pdfBuffer) return res.status(400).json({ success: false, message: "Could not read uploaded file" });

    const digestB64 = sha256base64(pdfBuffer);
    console.log("📄 Uploaded PDF:", originalPdf, req.file.size, "bytes");

    // 3) OAuth token
    const token = await getAccessToken();

    // 4) Build a plain-text consent doc for SBID Phone (v2 supports text sign only)
    // You can include a public link to the PDF and its SHA-256 for integrity
    const signTextBody =
`Approval of proposal ${proposalId || ""}

I, the undersigned, confirm that I have reviewed the proposal and accept it in full.
By signing, I consent to proceed as described in the referenced document.

Reference file: ${originalPdf}
PDF SHA-256 (base64): ${digestB64}
Date: ${new Date().toISOString()}
`;

    // 5) Upload the *text* document (NOT the PDF)
    const { data: docResp } = await axios.post(DOCS_URL, Buffer.from(signTextBody, "utf8"), {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "text/plain" },
      timeout: 20000,
    });
    const documentId = docResp?.documentId;
    console.log("📄 Text DocumentId:", documentId);
    if (!documentId) throw new Error("Text document upload failed: no documentId");

    // (optional) set metadata for the text doc
    try {
      await axios.patch(`${BASE}/sign/documents/${documentId}/metadata`, {
        filename: `${originalPdf.replace(/\.pdf$/i, "")}.txt`,
        title: "Consent text for Swedish BankID signing",
        description: `PDF:${originalPdf} sha256:${digestB64}`,
      }, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
    } catch {}

    // 6) Create document-collection with the TEXT document
    const { data: collResp } = await axios.post(COLLS_URL, {
      documents: [{ documentId, description: "SBID Phone consent text" }],
      // IMPORTANT: Do NOT set packageTo here for PKISIGNING SBID
    }, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      timeout: 20000,
    });
    const documentCollectionId = collResp?.id;
    console.log("📄 DocumentCollectionId:", documentCollectionId);
    if (!documentCollectionId) throw new Error("Failed to create document collection");

    // 7) Create signing session (ARRAY body) for SBID Phone + signText
    const session = {
      title: "Proposal Signing (Swedish BankID - Phone)",
      externalReference: String(proposalId || userId || Date.now()),
      signatureUrlTTL: 5, // minutes for the link

      // MUST include signText with SBID Phone according to v2 docs
      signText: "Please sign to approve the proposal and consent text.",

      documents: [
        { documentCollectionId, documentId, action: "SIGN" }
      ],

      signer: {
        nationalIdentificationNumber: nin12,
      },

      signingSetup: [
        {
          vendor: "SBID",
          signingFlow: "PKISIGNING",
          additionalParameters: {
            sbid_sign_type: "PHONE" // <- PHONE flow
          }
        }
      ],

      ui: { language: "en" },

      redirectSettings: {
        error:   `${REDIRECT_URI}?status=error&proposalId=${encodeURIComponent(proposalId || "")}`,
        cancel:  `${REDIRECT_URI}?status=aborted&proposalId=${encodeURIComponent(proposalId || "")}`,
        success: `${REDIRECT_URI}?status=success&proposalId=${encodeURIComponent(proposalId || "")}`,
      },
    };

    const body = [session];
    const { data: sessResp } = await axios.post(SESS_URL, body, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      timeout: 20000,
      transformRequest: [(d) => JSON.stringify(d)],
    });

    const s0 = Array.isArray(sessResp) ? sessResp[0] : sessResp;
    const redirectUrl = s0?.signatureUrl || s0?.redirectUrl || s0?.href || null;

    if (!redirectUrl) {
      console.error("⚠️ No signature URL in response:", sessResp);
      return res.status(502).json({ success: false, message: "Missing signature URL in Signicat response", data: sessResp });
    }

    return res.json({
      success: true,
      signUrl: redirectUrl,
      sessionId: s0?.id || s0?.sessionId || null,
      documentCollectionId,
      documentId, // text document id
    });
  } catch (err) {
    const status = err.response?.status;
    const data   = err.response?.data;
    console.error("❌ Signicat Error:", JSON.stringify({ status, data }, null, 2));

    const code = data?.code;
    if (status === 403 && code === "missing_permission") {
      return res.status(403).json({
        success: false,
        message:
          "Signicat client lacks a required permission. Grant 'sign:ordermanager:order:create' (and document/collection permissions) to the API client, then fetch a fresh token.",
        detail: data?.detail,
      });
    }

    const message =
      data?.detail ||
      data?.error_description ||
      data?.message ||
      err.message ||
      "Failed to create signing session";
    return res.status(500).json({ success: false, message });
  }
};
