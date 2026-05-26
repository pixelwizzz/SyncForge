import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Task database model.
 * Represents a piece of work assigned to a team member.
 */
const Task = sequelize.define('Task', {
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
  creator_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'RESTRICT',
  },
  assignee_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Task title cannot be empty',
      },
      len: {
        args: [3, 100],
        msg: 'Task title must be between 3 and 100 characters',
      },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('todo', 'in_progress', 'done'),
    allowNull: false,
    defaultValue: 'todo',
    validate: {
      isIn: {
        args: [['todo', 'in_progress', 'done']],
        msg: 'Status must be todo, in_progress, or done',
      },
    },
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: false,
    defaultValue: 'medium',
    validate: {
      isIn: {
        args: [['low', 'medium', 'high']],
        msg: 'Priority must be low, medium, or high',
      },
    },
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: {
        msg: 'Please provide a valid due date',
      },
    },
  },
}, {
  tableName: 'tasks',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['team_id'],
    },
    {
      fields: ['creator_id'],
    },
    {
      fields: ['assignee_id'],
    },
    {
      fields: ['status'],
    },
  ],
});

export default Task;
