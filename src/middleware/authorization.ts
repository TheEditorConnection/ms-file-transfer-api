import * as jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config();

export const authentication = (req: { headers: { [x: string]: any; }; }, res: { sendStatus: (arg0: number) => void; }, next: () => void) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, `${process.env.JWT_SECRET}`, (err: any, _user: any) => {
        if (err) return res.sendStatus(403);
        next();
    });
};