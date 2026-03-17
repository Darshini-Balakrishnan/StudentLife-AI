import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as eventController from '../controllers/event.controller';

const router = Router();

router.get('/', eventController.getEvents);
router.get('/my-rsvps', authenticate, eventController.getUserRsvps);
router.get('/recommendations', authenticate, eventController.getRecommendations);
router.get('/:id', eventController.getEventById);
router.post('/', authenticate, eventController.createEvent);
router.put('/:id', authenticate, eventController.updateEvent);
router.delete('/:id', authenticate, eventController.deleteEvent);
router.post('/:id/rsvp', authenticate, eventController.rsvpEvent);
router.delete('/:id/rsvp', authenticate, eventController.cancelRsvp);

export default router;
