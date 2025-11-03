const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");

const Schedule = sequelize.define("Schedule", {
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  comment: {
    type: DataTypes.STRING,
    allowNull: true, // Allow null if no comment is provided
  },
  blockId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  parentId: {
    type: DataTypes.STRING, // Changed to STRING for flexibility
    allowNull: true,
  },
}, {
  // Optional: Add indexes for better query performance
  indexes: [
    {
      unique: false, // Change to true if you want unique combinations
      fields: ["userId", "blockId"],
    },
    {
      unique: false,
      fields: ["parentId"],
    },
  ],
  // Optional: Timestamps for createdAt and updatedAt
  timestamps: true,
});

module.exports = Schedule;