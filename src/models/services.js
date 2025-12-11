const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");

const Services = sequelize.define(
    "Services",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "services",
        timestamps: true,
    }
);
module.exports = Services;