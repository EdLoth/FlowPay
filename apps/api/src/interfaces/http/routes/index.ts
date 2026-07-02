import { Router } from 'express';
import { criarAtendimento } from '../controllers/criarAtendimento';
import { listarAtendimentos } from '../controllers/listarAtendimentos';
import { finalizarAtendimento } from '../controllers/finalizarAtendimento';
import { listarAtendentes } from '../controllers/listarAtendentes';
import { listarTimes } from '../controllers/listarTimes';

export const router = Router();

router.post('/atendimentos', criarAtendimento);
router.get('/atendimentos', listarAtendimentos);
router.patch('/atendimentos/:id/finalizar', finalizarAtendimento);
router.get('/atendentes', listarAtendentes);
router.get('/times', listarTimes);
