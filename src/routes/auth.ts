import { Router } from 'express';
import { register, login, getProfile } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { UserRegistrationSchema, UserLoginSchema } from '../schemas/validation';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/register', validateBody(UserRegistrationSchema), register);
router.post('/login', validateBody(UserLoginSchema), login);
router.get('/profile', authenticateToken, getProfile);

export default router;