const db = require("../config/database");

const getVideoId = (url) => {
  try {
    const parsedUrl = new URL(url);

    // YouTube
    if (parsedUrl.hostname.includes("youtube.com") || parsedUrl.hostname.includes("youtu.be")) {
      if (parsedUrl.hostname === "youtu.be") {
        return parsedUrl.pathname.slice(1);
      }
      return parsedUrl.searchParams.get("v");
    }

    // Vimeo
    if (parsedUrl.hostname.includes("vimeo.com")) {
      return parsedUrl.pathname.split("/")[1];
    }

    // Wistia
    if (parsedUrl.hostname.includes("wistia.com") || parsedUrl.hostname.includes("wi.st")) {
      const match = url.match(/\/medias\/([a-zA-Z0-9]+)/);
      if (match) return match[1];
    }

    return null;
  } catch {
    return null;
  }
};


// Create VideoBlock
exports.createVideoBlock = async (req, res) => {
  try {
    const { blockId, video, user_id } = req.body;

    // console.log(" i am from video blockId:", blockId);
    

    if (!blockId || !video || !user_id) {
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });
    }

    const videoId = getVideoId(video);
    if (!videoId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid video URL" });
    }

    const videoBlock = await db.models.VideoBlock.create({ blockId, video, user_id, videoId });
    res.json({ success: true, data: videoBlock });
  } catch (err) {
    console.error("Error creating VideoBlock:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all VideoBlocks for a user
exports.getVideoBlocksByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const videoBlocks = await db.modelsVideoBlock.findAll({ where: { userId } });
    res.json({ success: true, data: videoBlocks });
  } catch (err) {
    console.error("Error fetching VideoBlocks:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get single VideoBlock by ID
exports.getVideoBlockById = async (req, res) => {
  try {
    const videoBlock = await db.models.VideoBlock.findByPk(req.params.id);
    if (!videoBlock) {
      return res.status(404).json({ success: false, message: "Not found" });
    }
    res.json({ success: true, data: videoBlock });
  } catch (err) {
    console.error("Error fetching VideoBlock:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
