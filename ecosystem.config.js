module.exports = {
  apps: [
    {
      name: 'gateway',
      script: './dist/apps/api-gateway/main.js',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'auth',
      script: './dist/apps/auth/main.js',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'admin',
      script: './dist/apps/administration/main.js',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'sales',
      script: './dist/apps/sales/main.js',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'logistics',
      script: './dist/apps/logistics/main.js',
      env: { NODE_ENV: 'production' }
    }
  ]
};
