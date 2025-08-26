const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

exports.saveDocument = async (req, res) => {
  try {
    const { name, imageDataUrl } = req.body;

    // Strip base64 prefix
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Create uploads folder if missing
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    // Output file
    const filename = `${Date.now()}-${name.replace(/\s+/g, "-")}.jpg`;
    const filePath = path.join(uploadsDir, filename);

    // Use sharp to compress + resize if needed
    await sharp(buffer)
      .resize({ width: 1200 }) // optional: keep max width 1200px
      .jpeg({ quality: 80 })   // compress to 80% quality
      .toFile(filePath);

    res.json({
      success: true,
      url: `http://localhost:5000/uploads/${filename}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};





// function parseDataUrl(dataUrl) {
//   const match = /^data:(.+);base64,(.*)$/.exec(dataUrl || "");
//   if (!match) throw new Error("Invalid image data URL");
//   const mime = match[1];
//   const buffer = Buffer.from(match[2], "base64");
//   return { mime, buffer };
// }

// exports.saveDocument = async (req, res) => {
//   try {
//     const { name, expirationDate, from, to, blocks, imageDataUrl } = req.body;

//     if (!imageDataUrl) {
//       return res.status(400).json({ error: "imageDataUrl is required" });
//     }
//     if (!name) {
//       return res.status(400).json({ error: "name is required" });
//     }

//     const { mime, buffer } = parseDataUrl(imageDataUrl);

//     // Adjust fields to match your Sequelize model
//     // If your columns are TEXT instead of JSON, wrap arrays/objects in JSON.stringify(...)
//     const newDoc = await db.models.Document.create({
//       name,
//       expirationDate: expirationDate || null,
//       fromName: from?.fullName || null,
//       fromEmail: from?.email || null,
//       recipients: to || [],         // or JSON.stringify(to)
//       blocks: blocks || [],          // or JSON.stringify(blocks)
//       imageMimeType: mime,
//       imageBase64: buffer.toString("base64"),
//       imageSizeBytes: buffer.length,
//     });

//     res.status(201).json({ id: newDoc.id, name: newDoc.name });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to save document" });
//   }
// };

exports.getDocuments = async (req, res) => {
  try {
    const docs = await db.models.Document.findAll();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
};
