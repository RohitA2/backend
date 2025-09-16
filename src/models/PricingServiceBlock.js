const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");

const PricingServiceBlock = sequelize.define(
  "PricingServiceBlock",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    blockId: {
      type: DataTypes.STRING, // external identifier
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    parentId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      defaultValue: "Scope of Work",
    },
    packageName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    packageDescription: {
      type: DataTypes.TEXT,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: "USD",
    },
    pricingType: {
      type: DataTypes.STRING,
      defaultValue: "Approximate price",
    },
    netTotal: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    vat: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    rounding: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    total: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
  },
  {
    tableName: "pricing_service_blocks",
    timestamps: true,
  }
);

PricingServiceBlock.associate = (models) => {
  PricingServiceBlock.hasMany(models.PricingServiceItem, {
    foreignKey: "blockId",
    as: "items",
    onDelete: "CASCADE",
  });
};

module.exports = PricingServiceBlock;
