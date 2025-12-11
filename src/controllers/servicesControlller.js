const db = require("../config/database");

exports.getAllServices = async (req, res) => {
    const { userId } = req.params;
    try {
        const services = await db.models.Services.findAll({
            where: { userId: parseInt(userId) },
        });
        res.json({ success: true, data:services });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}

exports.createService = async (req, res) => {
    try {
        const { title, content, userId } = req.body;
        if (!title || !content || !userId) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const newService = await db.models.Services.create({ 
            userId: parseInt(userId), 
            title: title,
            content: content
        });
        res.json({ 
            success: true, 
            comment: { 
                title: newService.title, 
                content: newService.content,
                createdAt: newService.createdAt 
            } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
}