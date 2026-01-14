const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");

const PrivateNotes = sequelize.define('PrivateNotes', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  parentId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'private_notes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['parentId', 'userId'],
    },
    {
      fields: ['parentId'],
    },
    {
      fields: ['userId'],
    },
  ],
});



module.exports = PrivateNotes;