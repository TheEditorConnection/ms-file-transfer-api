import * as dotenv from 'dotenv';

dotenv.config();

export class Config {
    public static get(name: string): string {
        const value = process.env[name];
        if (!value) {
            throw new Error(`Missing environment variable: ${name}`);
        }
        return value;
    }

    public static getCredentialsJson(): any {
        const credentials = Config.get('GOOGLE_CREDENTIALS');
        return JSON.parse(credentials);
    }
}
