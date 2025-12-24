const { sequelize } = require("../config/database"); // Correct path to sequelize instance
const { DataTypes } = require("sequelize");

const CompanyDetails = sequelize.define(
    "CompanyDetails",
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
        companyName: DataTypes.STRING,
        companySize: DataTypes.STRING,
        companyWebsite: DataTypes.STRING,
        phoneNumber: DataTypes.STRING,
        accountType: DataTypes.STRING,
        taxId: DataTypes.STRING,
        is_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        is_verified_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        reason: {
            type: DataTypes.STRING,
            allowNull: true
        }

    },
    {
        tableName: "company_details",
        timestamps: true,
    }
);

module.exports = CompanyDetails;
