import { Router } from 'express';
import authRoutes from './auth.routes';
import eventRoutes from './event.routes';
import resourceRoutes from './resource.routes';
import wellbeingRoutes from './wellbeing.routes';
import expenseRoutes from './expense.routes';
import aiRoutes from './ai.routes';
import notificationRoutes from './notification.routes';
import mcpRoutes from './mcp.routes';
import scheduleRoutes from './schedule.routes';
import plannerRoutes from './planner.routes';
import assignmentRoutes from './assignments.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/resources', resourceRoutes);
router.use('/wellbeing', wellbeingRoutes);
router.use('/expenses', expenseRoutes);
router.use('/ai', aiRoutes);
router.use('/notifications', notificationRoutes);
router.use('/mcp', mcpRoutes);
router.use('/schedule', scheduleRoutes);
router.use('/planner', plannerRoutes);
router.use('/assignments', assignmentRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
