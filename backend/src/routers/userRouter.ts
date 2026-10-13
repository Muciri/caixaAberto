import express from 'express';
import userController from '../controllers/userController.js';
import { authenticate } from '../middlewares/auth.js';
import { loadContext, requireRole } from '../middlewares/load-context.js';

const router = express.Router();

router.use(authenticate, loadContext);

// Leitura: qualquer membro com vinculo ativo enxerga os colegas da propria organizacao.
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);

// Nao exige organizacao selecionada.
// O usuario recebe a lista das organizacoes em que tem vinculo ativo.
router.get('/me/organizacoes', userController.getMyOrganizations);

// Escrita sobre contas: restrita ao TESOUREIRO da organizacao.
router.post('/', requireRole('TESOUREIRO'), userController.createUser);
router.put('/:id', requireRole('TESOUREIRO'), userController.updateUser);
router.delete('/:id', requireRole('TESOUREIRO'), userController.deleteUser);

export default router;
