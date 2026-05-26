import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * TeamMember database model.
 * Connects Users to Teams with specific roles (Owner, Admin, Member).
 */
const TeamMember = sequelize.define('TeamMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  team_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'teams',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'member'),
    allowNull: false,
    defaultValue: 'member',
    validate: {
      isIn: {
        args: [['owner', 'admin', 'member']],
        msg: 'Role must be owner, admin, or member',
      },
    },
  },
}, {
  tableName: 'team_members',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['team_id', 'user_id'],
      name: 'team_members_team_id_user_id_unique',
    },
  ],
});

export default TeamMember;
