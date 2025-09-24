const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");

const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    sid: {
      type: DataTypes.STRING, // Twilio Message SID
      allowNull: true,
    },

    from: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    to: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    direction: {
      type: DataTypes.ENUM("outbound", "inbound"),
      allowNull: false,
    },

    status: {
      type: DataTypes.STRING, // queued, sent, delivered, failed, received
      allowNull: true,
    },

    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "messages",
    timestamps: true, 
  }
);

module.exports = Message;
