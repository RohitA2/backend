// models/noteModel.js
const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");


const Note = sequelize.define('Note', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  time: {
    type: DataTypes.JSON,
    allowNull: true,
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
  tableName: 'notes',
  timestamps: true,
  indexes: [
    {
      fields: ['userId'],
    },
    {
      fields: ['date'],
    },
  ],
});

module.exports = Note;