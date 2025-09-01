// routes/index.js
const userRoutes = require("./userRoutes");
const authRoutes = require("./authRoutes");
const uploadRoutes = require("./uploadRoutes");
const sendMessageRoute = require("./sendMessageRoute");
const recipientRoutes = require("./recipientRoutes");
const emailRoutes = require("./emailRoutes");
const documentRoutes = require("./documentRoutes");
const headerBlockRoutes = require("./headerBlockRoutes");
const upload = require("./upload");
const partiesRoutes = require("./partiesRoutes");

module.exports = (app) => {
  // Authentication routes for all roles
  app.use("/api/users", userRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api", uploadRoutes);
  app.use("/api", sendMessageRoute);
  app.use("/api", recipientRoutes);
  app.use("/api", emailRoutes);
  app.use("/api", documentRoutes);
  app.use("/api", headerBlockRoutes);
  app.use("/upload", upload);
  app.use("/parties", partiesRoutes);
};
