import { Router } from 'express';
import TaskController from './task.controller.js';
import authenticate from '../middleware/authenticate.js';
import validate from '../middleware/validate.js';
import { createTaskSchema, updateTaskSchema, queryTasksSchema } from './task.validator.js';

const router = Router();

// Apply global authentication to all task routes
router.use(authenticate);

// ── Task Queries & Creation ──────────────────────────────────
router.post('/', validate(createTaskSchema), TaskController.createTask);
router.get('/', validate(queryTasksSchema), TaskController.getTasks);

// ── Specific Task Actions ─────────────────────────────────────
router.get('/:id', TaskController.getTask);
router.put('/:id', validate(updateTaskSchema), TaskController.updateTask);
router.delete('/:id', TaskController.deleteTask);

export default router;
