import User from './user.model.js';
import logger from '../utils/logger.js';

/**
 * Find user by internal primary key UUID.
 * @param {string} id - Local UUID
 * @returns {Promise<User|null>}
 */
export async function findUserById(id) {
  return await User.findByPk(id);
}

/**
 * Find user by external Clerk ID.
 * @param {string} clerkId - Clerk User ID (user_...)
 * @returns {Promise<User|null>}
 */
export async function findUserByClerkId(clerkId) {
  return await User.findOne({ where: { clerk_id: clerkId } });
}

/**
 * Sync user from Clerk Webhooks.
 * Inserts if user doesn't exist, updates if they do.
 * @param {Object} userData - User info synced from Clerk
 * @returns {Promise<User>}
 */
export async function upsertUser(userData) {
  const { clerk_id, email, name, avatar_url } = userData;
  logger.debug(`Upsert user triggered: Clerk ID=${clerk_id}, Email=${email}`);

  // Find user by external Clerk ID
  let user = await findUserByClerkId(clerk_id);

  if (user) {
    // Update existing user fields
    user.email = email;
    user.name = name;
    user.avatar_url = avatar_url;
    await user.save();
    logger.info(`Updated existing user: ${user.id} (Clerk ID: ${clerk_id})`);
  } else {
    // Create new user in local database
    user = await User.create({
      clerk_id,
      email,
      name,
      avatar_url,
      is_admin: false, // Default is always false (can be manually promoted)
    });
    logger.info(`Created new user from Clerk webhook: ${user.id} (Clerk ID: ${clerk_id})`);
  }

  return user;
}

/**
 * Delete user records when user is deleted on Clerk.
 * @param {string} clerkId - Clerk User ID
 * @returns {Promise<boolean>} - True if deletion was successful
 */
export async function deleteUser(clerkId) {
  logger.info(`Deleting user from local DB: Clerk ID=${clerkId}`);
  const deletedCount = await User.destroy({ where: { clerk_id: clerkId } });

  if (deletedCount > 0) {
    logger.info(`Successfully deleted user: Clerk ID=${clerkId}`);
    return true;
  }

  logger.warn(`No local user records found to delete for Clerk ID: ${clerkId}`);
  return false;
}
