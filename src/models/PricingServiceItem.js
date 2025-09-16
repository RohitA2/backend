const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");

const PricingServiceItem = sequelize.define(
  "PricingServiceItem",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    price: DataTypes.FLOAT,
    currency: {
      type: DataTypes.STRING,
      defaultValue: "USD",
    },
    blockId: {
      type: DataTypes.INTEGER, // FK to PricingServiceBlock.id
      allowNull: false,
      references: {
        model: "pricing_service_blocks",
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "pricing_service_items",
    timestamps: true,
  }
);

PricingServiceItem.associate = (models) => {
  PricingServiceItem.belongsTo(models.PricingServiceBlock, {
    foreignKey: "blockId",
    as: "block",
  });
};

module.exports = PricingServiceItem;
