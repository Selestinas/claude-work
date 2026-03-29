const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Book = require('./Book');

const UserBook = sequelize.define('UserBook', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  status: {
    type: DataTypes.ENUM('read', 'want-to-read', 'favorite'),
    allowNull: false,
    defaultValue: 'want-to-read',
  },
});

User.belongsToMany(Book, { through: UserBook });
Book.belongsToMany(User, { through: UserBook });

UserBook.belongsTo(User);
UserBook.belongsTo(Book);
User.hasMany(UserBook);
Book.hasMany(UserBook);

module.exports = UserBook;
