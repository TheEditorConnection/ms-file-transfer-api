import * as dotenv from "dotenv";

dotenv.config();

export const Config = {
  get(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Missing environment variable: ${name}`);
    }
    return value;
  },

  getCredentialsJson(): Record<string, unknown> {
    const credentials = Config.get("GOOGLE_CREDENTIALS");
    return JSON.parse(credentials);
  },
};
