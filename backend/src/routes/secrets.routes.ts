import { Router } from 'express';
import { secretsController } from '../controllers/secrets.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Create a new secret
router.post('/', secretsController.createSecret);

// List secrets (metadata only)
router.get('/', secretsController.listSecrets);

// Search secrets
router.get('/search', secretsController.searchSecrets);

// Get secret metadata
router.get('/:id', secretsController.getSecretMetadata);

// Reveal secret (decrypt and return plaintext)
router.post('/:id/reveal', secretsController.revealSecret);

// Update secret
router.put('/:id', secretsController.updateSecret);

// Delete secret (soft delete)
router.delete('/:id', secretsController.deleteSecret);

export default router;