const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");

const ProposalTemplate = sequelize.define(
    "ProposalTemplate",
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
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        data: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        previewUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        tableName: "proposal_templates",
        underscored: true,
        timestamps: true,
        indexes: [
            {
                fields: ["user_id"],
            },
            {
                fields: ["name"],
            },
        ],
    }
);

module.exports = ProposalTemplate;