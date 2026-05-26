import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Team database model.
 * Represents a collaborative space/group for tasks.
 */
const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Team name cannot be empty',
      },
      len: {
        args: [3, 50],
        msg: 'Team name must be between 3 and 50 characters',
      },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'teams',
  timestamps: true,
  underscored: true,
});

export default Team;
