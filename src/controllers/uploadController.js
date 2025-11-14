const path = require("path");

// Single file upload controller
exports.uploadFile = (req, res) => {
  console.log("req.file:", req.file);

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileUrl = `${process.env.BASE_URL || "https://signlink.se"}/api/uploads/${
    req.file.filename
  }`;

  res.json({
    success: true,
    url: fileUrl,
    filename: req.file.filename,
  });
};
