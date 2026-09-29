import { Router } from 'express';
import { register, login, requestOtp, verifyOtp, loginGoogle, loginApple, refresh, logout, providers, me } from '../controllers/auth.controller';
import { attachIdentityFromAccess } from '../middleware/tenant.middleware';

/**
 * AUTH ROUTES — public, self-hosted authentication (Jawa Ride pattern).
 * Mounted before the global resolveAuth middleware in app.ts. The only
 * protected route here is /me, which verifies OUR access token.
 */
const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/otp/request', requestOtp);
router.post('/otp/verify', verifyOtp);
router.post('/google', loginGoogle);
router.post('/apple', loginApple);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/providers', providers);
router.get('/me', attachIdentityFromAccess, me);

export default router;
