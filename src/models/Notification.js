const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("info", "success", "warning", "error"),
      defaultValue: "info",
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
  }
);

module.exports = Notification;
