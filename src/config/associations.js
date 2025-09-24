const fs = require("fs");
const path = require("path");
const { DataTypes } = require("sequelize");
const sequelize = require("./database"); // Adjust path as needed

const models = {};

// Dynamically load all models
fs.readdirSync(path.join(__dirname, "../models")) // Adjust path if necessary
  .filter((file) => file.endsWith(".js") && file !== "index.js") // Ignore non-JS files or index.js
  .forEach((file) => {
    const model = require(path.join(__dirname, "../models", file)); // Pass sequelize and DataTypes
    models[model.name] = model;
  });

// Define associations (if they exist in models)
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models); // Associate models if they have the associate method
  }
});

// Now, `sequelize.models` holds all your models
sequelize.models = models;

const defineAssociations = () => {
  // Example of associations (modify according to your models)

  // User ke apne clients
  models.User.hasMany(models.Client, {
    foreignKey: "user_id",
    as: "clients",
  });

  models.User.hasMany(models.Client, {
    foreignKey: "target_user_id",
    as: "assignedClients",
  });

  models.User.hasMany(models.Recipient, {
    foreignKey: "user_id",
    as: "recipients",
  });

  // 2️⃣ Recipient belongs to a User
  models.Recipient.belongsTo(models.User, {
    foreignKey: "user_id",
    as: "user",
  });

  models.User.hasMany(models.Parent, {
    as: "parents",
    foreignKey: "user_id",
    onDelete: "CASCADE",
    hooks: true,
  });

  models.Parent.belongsTo(models.User, {
    as: "user",
    foreignKey: "user_id",
  });

  models.Parent.hasMany(models.Block, {
    as: "blocks",
    foreignKey: "parentId",
    onDelete: "CASCADE",
    hooks: true,
  });

  models.Block.belongsTo(models.Parent, {
    as: "parent",
    foreignKey: "parentId",
  });

  models.ProposalEmail.hasMany(models.ProposalEmailRecipient, {
    foreignKey: "proposal_email_id",
    as: "recipients",
    onDelete: "CASCADE",
  });

  models.ProposalEmailRecipient.belongsTo(models.ProposalEmail, {
    foreignKey: "proposal_email_id",
    as: "proposal",
  });

  models.User.hasMany(models.ProposalEmail, {
    foreignKey: "userId",
    as: "proposalEmails",
  });
  models.ProposalEmail.belongsTo(models.User, {
    foreignKey: "userId",
    as: "user",
  });

  // 🔹 User → Schedule (1:N)
  models.User.hasMany(models.Schedule, {
    foreignKey: "userId",
    as: "schedules",
  });
  models.Schedule.belongsTo(models.User, {
    foreignKey: "userId",
    as: "user",
  });

  // 🔹 ProposalEmail → Schedule (1:N via parentId)
  models.ProposalEmail.hasMany(models.Schedule, {
    foreignKey: "parentId",
    sourceKey: "parentId",
    as: "schedules",
    constraints: false,
  });
  models.Schedule.belongsTo(models.ProposalEmail, {
    foreignKey: "parentId",
    targetKey: "parentId",
    as: "proposalEmail",
    constraints: false,
  });

  // 🔹 ProposalEmail → Signature (1:N via parentId)
  models.ProposalEmail.hasMany(models.Signature, {
    foreignKey: "parentId",
    sourceKey: "parentId",
    as: "signatures",
    constraints: false,
  });
  models.Signature.belongsTo(models.ProposalEmail, {
    foreignKey: "parentId",
    targetKey: "parentId",
    as: "proposalEmail",
    constraints: false,
  });

  models.ProposalEmailRecipient.belongsTo(models.Recipient, {
    foreignKey: "recipientId",
    as: "recipientDetails",
  });

  // Recipient.js
  models.Recipient.hasMany(models.ProposalEmailRecipient, {
    foreignKey: "recipientId",
    as: "proposalRecipients",
  });
};

module.exports = defineAssociations;
