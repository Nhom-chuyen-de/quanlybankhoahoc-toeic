import sql from 'mssql';

let poolPromise;

export function getPool() {
  if (!poolPromise) {
    const rawServer = process.env.DB_SERVER || 'localhost';
    const config = {
      database: process.env.DB_NAME || 'QuanLyDaoTao_HopNhat',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
        enableArithAbort: true,
      },
      pool: { min: 0, max: 10, idleTimeoutMillis: 30000 },
      connectionTimeout: 15000,
      requestTimeout: 30000,
    };

    // Hỗ trợ cả định dạng "localhost\SQL2022" hoặc ".\SQL2022"
    if (rawServer.includes('\\')) {
      const [host, instance] = rawServer.split('\\');
      config.server = (host === '.' || !host) ? 'localhost' : host;
      config.options.instanceName = instance;
    } else {
      config.server = rawServer === '.' ? 'localhost' : rawServer;
      config.port = Number(process.env.DB_PORT || 1433);
    }

    poolPromise = sql.connect(config).catch((error) => {
      poolPromise = undefined;
      console.error('[DB Connection Error]:', error.message || error);
      throw error;
    });
  }
  return poolPromise;
}

export { sql };
