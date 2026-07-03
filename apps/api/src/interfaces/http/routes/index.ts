import { Router } from 'express';
import { criarAtendimento } from '../controllers/criarAtendimento';
import { listarAtendimentos } from '../controllers/listarAtendimentos';
import { finalizarAtendimento } from '../controllers/finalizarAtendimento';
import { listarAtendentes } from '../controllers/listarAtendentes';
import { listarTimes } from '../controllers/listarTimes';
import { asyncHandler } from '../middlewares/asyncHandler';

export const router = Router();

router.post('/atendimentos', asyncHandler(criarAtendimento));
router.get('/atendimentos', asyncHandler(listarAtendimentos));
router.patch('/atendimentos/:id/finalizar', asyncHandler(finalizarAtendimento));
router.get('/atendentes', asyncHandler(listarAtendentes));
router.get('/times', asyncHandler(listarTimes));
