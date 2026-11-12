import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = error.statusCode || 500; // Si tu crée un nouveau type d'erreur, tu dois ajouter dans la classe statusCode pour lui donner le bon code d'erreur.
  const message = error.message || 'Internal Server Error';
  if (statusCode === 500) {
    console.error(`Error ${statusCode}: ${message}`);
    console.error(error);
  }
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};
