const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");
const Parent = sequelize.define(
  "Parent",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "parents",
    underscored: true,
  }
);

module.exports = Parent;
