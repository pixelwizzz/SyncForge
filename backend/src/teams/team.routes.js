import { Router } from 'express';
import TeamController from './team.controller.js';
import authenticate from '../middleware/authenticate.js';
import { authorizeTeamRole } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { createTeamSchema, updateTeamSchema, inviteMemberSchema } from './team.validator.js';

const router = Router();

// ── Personal / Global Team Actions ────────────────────────────
router.post('/', authenticate, validate(createTeamSchema), TeamController.createTeam);
router.get('/', authenticate, TeamController.getMyTeams);

// ── Specific Team Resource Actions (Membership required) ──────
router.get('/:id', authenticate, authorizeTeamRole([]), TeamController.getTeam);
router.put('/:id', authenticate, authorizeTeamRole(['owner', 'admin']), validate(updateTeamSchema), TeamController.updateTeam);
router.delete('/:id', authenticate, authorizeTeamRole(['owner']), TeamController.deleteTeam);

// ── Team Membership Actions ───────────────────────────────────
router.post('/:id/invite', authenticate, authorizeTeamRole(['owner', 'admin']), validate(inviteMemberSchema), TeamController.inviteMember);
router.delete('/:id/members/:userId', authenticate, authorizeTeamRole(['owner', 'admin']), TeamController.removeMember);

export default router;
