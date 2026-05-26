import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * User database model.
 * Maps local user records to their Clerk accounts.
 */
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  clerk_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'users_clerk_id_unique',
      msg: 'clerk_id must be unique',
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'users_email_unique',
      msg: 'Email address must be unique',
    },
    validate: {
      isEmail: {
        msg: 'Please provide a valid email address',
      },
    },
  },
  avatar_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_admin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['clerk_id'],
    },
    {
      unique: true,
      fields: ['email'],
    },
  ],
});

export default User;
