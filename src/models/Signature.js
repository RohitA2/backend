const { sequelize } = require("../config/database"); // Correct path to sequelize instance
const { DataTypes } = require("sequelize");

const Signature = sequelize.define(
  "Signature",
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
    signature: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    comment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    method: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    parentId: {
      type: DataTypes.STRING, 
      allowNull: true,
    },
    session_id:{
      type:DataTypes.STRING,
      allowNull:true
    },
    declinedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ip_details:{
      type:DataTypes.JSON,
      allowNull:true
    },
    messageId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "Signature",
    timestamps: true,
  }
);
module.exports = Signature;
