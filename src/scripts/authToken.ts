import { Audience, Grant, JWTService } from "../services/jwt.service";
import { argv } from "process";

const createAuthToken = async (
    subject: string,
    audience: Audience[],
    expiresIn: string,
    grant? : Grant[]
): Promise<void> => {
    const jwtService = new JWTService()

    console.log(jwtService.sign(subject, audience,expiresIn,grant))
}


// Example npm run auth-token ADMIN admin '30 days'
createAuthToken(argv[2],argv[3].split(','),argv[4],(argv[5] || '').split(',') as Grant[]);

