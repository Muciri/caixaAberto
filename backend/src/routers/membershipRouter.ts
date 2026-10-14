import { Router } from 'express';

import * as membershipController from '../controllers/membershipController.js';
import { authenticate } from '../middlewares/auth.js';
import { loadContext, requireRole } from '../middlewares/load-context.js';

const router = Router();

// Todas as rotas exigem autenticação e contexto da organização.
router.use(authenticate, loadContext);

// Listar os membros ativos da organização.
router.get('/', membershipController.listMembers);

// Adicionar um membro à organização.
router.post('/', requireRole('TESOUREIRO'), membershipController.addMember);

// Alterar o papel de um vínculo da organização.
// Ex.: PUT /api/membros/123/papel
router.put('/:id/papel', requireRole('TESOUREIRO'), membershipController.updateMemberRole);

export default router;
