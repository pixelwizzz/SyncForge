import User from '../users/user.model.js';
import Team from '../teams/team.model.js';
import TeamMember from '../teams/teamMember.model.js';
import Task from '../tasks/task.model.js';
import Attachment from '../tasks/attachment.model.js';

/**
 * Configure all Sequelize model relationships and foreign keys.
 * This function must be executed before syncing the database.
 */
export default function setupAssociations() {
  // ── User <-> TeamMember Relationships ───────────────────────
  User.hasMany(TeamMember, {
    foreignKey: 'user_id',
    as: 'memberships',
    onDelete: 'CASCADE',
  });
  TeamMember.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user',
  });

  // ── Team <-> TeamMember Relationships ───────────────────────
  Team.hasMany(TeamMember, {
    foreignKey: 'team_id',
    as: 'members',
    onDelete: 'CASCADE',
  });
  TeamMember.belongsTo(Team, {
    foreignKey: 'team_id',
    as: 'team',
  });

  // ── User <-> Team (Many-to-Many through TeamMember) ─────────
  User.belongsToMany(Team, {
    through: TeamMember,
    foreignKey: 'user_id',
    otherKey: 'team_id',
    as: 'teams',
  });
  Team.belongsToMany(User, {
    through: TeamMember,
    foreignKey: 'team_id',
    otherKey: 'user_id',
    as: 'membersList',
  });

  // ── Team <-> Task Relationships ────────────────────────────
  Team.hasMany(Task, {
    foreignKey: 'team_id',
    as: 'tasks',
    onDelete: 'CASCADE',
  });
  Task.belongsTo(Team, {
    foreignKey: 'team_id',
    as: 'team',
  });

  // ── User (Creator) <-> Task Relationships ──────────────────
  User.hasMany(Task, {
    foreignKey: 'creator_id',
    as: 'createdTasks',
    onDelete: 'RESTRICT',
  });
  Task.belongsTo(User, {
    foreignKey: 'creator_id',
    as: 'creator',
  });

  // ── User (Assignee) <-> Task Relationships ─────────────────
  User.hasMany(Task, {
    foreignKey: 'assignee_id',
    as: 'assignedTasks',
    onDelete: 'SET NULL',
  });
  Task.belongsTo(User, {
    foreignKey: 'assignee_id',
    as: 'assignee',
  });

  // ── Task <-> Attachment Relationships ──────────────────────
  Task.hasMany(Attachment, {
    foreignKey: 'task_id',
    as: 'attachments',
    onDelete: 'CASCADE',
  });
  Attachment.belongsTo(Task, {
    foreignKey: 'task_id',
    as: 'task',
  });

  // ── User (Uploader) <-> Attachment Relationships ──────────
  User.hasMany(Attachment, {
    foreignKey: 'uploaded_by',
    as: 'uploadedAttachments',
    onDelete: 'RESTRICT',
  });
  Attachment.belongsTo(User, {
    foreignKey: 'uploaded_by',
    as: 'uploader',
  });
}
