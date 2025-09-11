const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");

const Block = sequelize.define(
  "Block",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    blockId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "parents", key: "id" },
      onDelete: "CASCADE",
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    orderIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "blocks",
    underscored: true,
    indexes: [
      { fields: ["parent_id"] },
      // Ensure unique position within a parent
      { unique: true, fields: ["parent_id", "order_index"] },
    ],
  }
);


module.exports = Block;
