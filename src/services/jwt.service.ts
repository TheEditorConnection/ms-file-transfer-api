import { Logger } from '../utils/logger';
import * as jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config();

export type Grant = "admin";
export type Audience = "admin" | string;

export class JWTService {
    private secret: string;

    constructor() {
        this.secret = process.env.JWT_SECRET || '';
        if (!this.secret) {
            throw new Error('JWT_SECRET environment variable is not defined');
        }
    }

    public sign(
        subject: string,
        audience: Audience[],
        expiresIn: string,
        grant = [] as Grant[],
    ): string {
        Logger.info(`Signed Token for ${subject}`);
        return jwt.sign(
            {
                aud: audience,
                sub: subject,
                grant: grant,
            },
            this.secret,
            { expiresIn },
        );
    }

    public async verify(
        token: string,
    ): Promise<boolean> {
        try {
            const validatedToken = await jwt.verify(
                token,
                this.secret,
            );

            return validatedToken != undefined;
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                Logger.error(`Invalid token! ${error.message}`);
                return false
            }
            throw error;
        }
    }
}
