const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");

const VideoBlock = sequelize.define(
  "VideoBlock",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    blockId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    video: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    videoId:{
      type:DataTypes.STRING,
      allowNull:true
    }
  },
  {
    tableName: "VideoBlock",
    timestamps: true,
  }
);
module.exports = VideoBlock;
