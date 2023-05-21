declare namespace NodeJS {
  export interface ProcessEnv {
    readonly NODE_ENV: 'production' | 'test' | 'development'
    readonly EVC_PORT: string
    readonly GM_PORT: string
    readonly GM_WSS_PORT: string
    readonly S3_SECRET_KEY: string
    readonly S3_ACCESS_ID: string
    readonly S3_ENDPOINT: string
    readonly S3_REGION: string
    readonly TEST_PORT: string
    readonly TEST_WSS_PORT: string
  }
}
