const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Book = sequelize.define('Book', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  openLibraryKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  author: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  coverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  firstPublishYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

module.exports = Book;
