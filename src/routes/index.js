// routes/index.js
const userRoutes = require("./userRoutes");
const authRoutes = require("./authRoutes");
const uploadRoutes = require("./uploadRoutes");
// const sendMessageRoute = require("./sendMessageRoute");
const recipientRoutes = require("./recipientRoutes");
const emailRoutes = require("./emailRoutes");
const documentRoutes = require("./documentRoutes");
const headerBlockRoutes = require("./headerBlockRoutes");
const upload = require("./upload");
const partiesRoutes = require("./partiesRoutes");
const signatureRoutes = require("./signatureRoutes");
const scheduleRoutes = require("./scheduleRoutes");
const pdfBlockRoutes = require("./pdfblocks");
const videoBlockRoutes = require("./videoBlockRoutes");
const attachmentRoutes = require("./attachments");
const parentsRoutes = require("./parentsRoutes");
const textRoutes = require("./TextRoutes");
const termsRoutes = require("./TermsRoutes");
const VerifyToken = require("./VerifyToken");
const pricingRoutes = require("./pricingServiceRoutes");
const coverBlockRoutes = require("./coverRoutes");
const smsRoutes = require("./smsRoutes");
const notificationRoutes = require("./notificationRoutes");
const bankidRoutes = require('./bankidRoutes');
const signicatRoutes = require('./signicat.routes');



module.exports = (app) => {
  // Authentication routes for all  
  app.use("/api/users", userRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api", uploadRoutes);
  // app.use("/api", sendMessageRoute);
  app.use("/api", recipientRoutes);
  app.use("/api", emailRoutes);
  app.use("/api", documentRoutes);
  app.use("/api", headerBlockRoutes);
  app.use("/upload", upload);
  app.use("/parties", partiesRoutes);
  app.use("/signatures", signatureRoutes);
  app.use("/schedules", scheduleRoutes);
  app.use("/api/pdfblocks", pdfBlockRoutes);
  app.use("/video", videoBlockRoutes);
  app.use("/attachments", attachmentRoutes);
  app.use("/parents", parentsRoutes);
  app.use("/text", textRoutes);
  app.use("/terms", termsRoutes);
  app.use("/verify", VerifyToken);
  app.use("/pricing", pricingRoutes);
  app.use("/cover", coverBlockRoutes);
  app.use("/sms", smsRoutes);
  app.use('/notifications', notificationRoutes);
  // app.use('/api', bankidRoutes);
  app.use("/api", signicatRoutes);
};
