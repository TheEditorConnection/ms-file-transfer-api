import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const generateTransferIdMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
    const transferId = uuidv4();
    req.body.transferId = transferId;

    next();
};
