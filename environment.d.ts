declare namespace NodeJS {
  export interface ProcessEnv {
    readonly NODE_ENV: 'production' | 'test' | 'development'
    readonly JWT_SECRET: string
    readonly JWT_ISSUER: string
    readonly SUPABASE_URL: string
    readonly SUPABASE_KEY: string
    readonly EVC_PORT: string
    readonly GM_PORT: string
    readonly GM_WSS_PORT: string
    readonly S3_SECRET_KEY: string
    readonly S3_ACCESS_ID: string
    readonly S3_ENDPOINT: string
    readonly S3_REGION: string
    readonly TEST_PORT: string
    readonly TEST_WSS_PORT: string
    readonly REDIS_PORT: string
    readonly REDIS_HOST: string
    readonly REPLAYS_PORT: string
    readonly STATS_PORT: string
    readonly AUTH_PORT: string
  }
}
