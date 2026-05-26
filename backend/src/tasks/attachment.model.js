import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Attachment database model.
 * Represents a file uploaded and linked to a task.
 */
const Attachment = sequelize.define('Attachment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  task_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'tasks',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  uploaded_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'RESTRICT',
  },
  file_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'File name cannot be empty',
      },
    },
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'File path cannot be empty',
      },
    },
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: {
        msg: 'File size must be an integer in bytes',
      },
      min: 0,
    },
  },
  mime_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'attachments',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['task_id'],
    },
    {
      fields: ['uploaded_by'],
    },
  ],
});

export default Attachment;
