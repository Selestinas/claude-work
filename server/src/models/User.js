const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  verificationCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  codeExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = User;
