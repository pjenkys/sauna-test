export interface AppConfig {
    PORT: number;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    NODE_ENV: string;
    DATABASE_PATH: string;
    CORS_ORIGIN: string;
}
export declare const config: AppConfig;
export default config;
