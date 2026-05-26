import sequelize from '../config/database.js';
import setupAssociations from '../models/associations.js';
import User from '../users/user.model.js';
import Team from '../teams/team.model.js';
import TeamMember from '../teams/teamMember.model.js';
import Task from '../tasks/task.model.js';
import logger from './logger.js';

/**
 * Seed the database with high-quality mock data for local testing.
 */
async function seedDatabase() {
  try {
    logger.info('🚀 Starting database seeding...');

    // 1. Setup associations
    setupAssociations();

    // 2. Drop and re-sync all tables (force: true)
    await sequelize.sync({ force: true });
    logger.info('   Database tables recreated (force sync)');

    // 3. Create mock users
    const users = await User.bulkCreate([
      {
        clerk_id: 'user_mock_admin',
        name: 'Alice Admin',
        email: 'alice@syncforge.com',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        is_admin: true,
      },
      {
        clerk_id: 'user_mock_owner',
        name: 'Bob Owner',
        email: 'bob@syncforge.com',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        is_admin: false,
      },
      {
        clerk_id: 'user_mock_developer',
        name: 'Charlie Dev',
        email: 'charlie@syncforge.com',
        avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
        is_admin: false,
      },
      {
        clerk_id: 'user_mock_designer',
        name: 'Diana Designer',
        email: 'diana@syncforge.com',
        avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        is_admin: false,
      },
    ]);
    logger.info(`   Seeded ${users.length} mock users`);

    const [alice, bob, charlie, diana] = users;

    // 4. Create mock teams
    const devTeam = await Team.create({
      name: 'Engineering Team',
      description: 'Responsible for backend architecture, integrations, and deployment.',
    });

    const designTeam = await Team.create({
      name: 'Creative Studio',
      description: 'Handles branding, UI design, UX wireframing, and user research.',
    });
    logger.info('   Seeded mock teams');

    // 5. Create team memberships
    await TeamMember.bulkCreate([
      // Engineering Team
      { team_id: devTeam.id, user_id: bob.id, role: 'owner' },
      { team_id: devTeam.id, user_id: alice.id, role: 'admin' },
      { team_id: devTeam.id, user_id: charlie.id, role: 'member' },

      // Creative Studio
      { team_id: designTeam.id, user_id: diana.id, role: 'owner' },
      { team_id: designTeam.id, user_id: bob.id, role: 'admin' },
      { team_id: designTeam.id, user_id: charlie.id, role: 'member' },
    ]);
    logger.info('   Seeded team memberships (roles assigned)');

    // 6. Create mock tasks
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await Task.bulkCreate([
      {
        team_id: devTeam.id,
        creator_id: bob.id,
        assignee_id: charlie.id,
        title: 'Integrate Clerk Webhooks',
        description: 'Set up Svix signature verification and write the user creation/sync database triggers.',
        status: 'done',
        priority: 'high',
        due_date: tomorrow,
      },
      {
        team_id: devTeam.id,
        creator_id: alice.id,
        assignee_id: bob.id,
        title: 'Design Database Schema for Phase 3',
        description: 'Draft columns and relations for Teams, Members, Tasks, and Attachments in PostgreSQL.',
        status: 'in_progress',
        priority: 'high',
        due_date: tomorrow,
      },
      {
        team_id: devTeam.id,
        creator_id: bob.id,
        assignee_id: charlie.id,
        title: 'Setup Redis Cluster & Caching Layer',
        description: 'Integrate Redis client and build helper service to cache expensive team search queries.',
        status: 'todo',
        priority: 'medium',
        due_date: nextWeek,
      },
      {
        team_id: designTeam.id,
        creator_id: diana.id,
        assignee_id: charlie.id,
        title: 'Create Dashboard Wireframes',
        description: 'Design interactive prototypes for the collaborative dashboard containing task state sliders.',
        status: 'in_progress',
        priority: 'high',
        due_date: tomorrow,
      },
      {
        team_id: designTeam.id,
        creator_id: diana.id,
        assignee_id: bob.id,
        title: 'Branding Guidelines Refinement',
        description: 'Deliver updated harmonious color palette tokens and unified glassmorphic container assets.',
        status: 'todo',
        priority: 'low',
        due_date: nextWeek,
      },
    ]);
    logger.info('   Seeded collaborative mock tasks');

    logger.info('✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}

export default seedDatabase;
