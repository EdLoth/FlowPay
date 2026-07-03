import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../../core/errors/AppError';

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ erro: error.message });
  }

  console.error('Erro não tratado:', error);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}
