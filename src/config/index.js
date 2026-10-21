// Production Configuration Module
module.exports = {
  serviceName: 'StockPulse',
  env: process.env.NODE_ENV || 'production',
  port: parseInt(process.env.PORT || '3005', 10),
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    keyPrefix: 'ticker:',
    ttlSeconds: 1
  },
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'stockpulse_db',
    poolMin: 4,
    poolMax: 20
  },
  metrics: {
    enabled: true,
    path: '/metrics'
  },
  security: {
    rateLimitRps: 50,
    rateLimitBurst: 100
  }
};
