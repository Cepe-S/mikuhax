module.exports = {
  apps: [
    {
      name: 'haxbotron-db',
      cwd: './db',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--openssl-legacy-provider'
      },
      log_file: './logs/db.log',
      error_file: './logs/db-error.log',
      out_file: './logs/db-out.log',
      restart_delay: 5000,
      max_restarts: 10
    },
    {
      name: 'haxbotron-core',
      cwd: './core',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--openssl-legacy-provider'
      },
      log_file: './logs/core.log',
      error_file: './logs/core-error.log',
      out_file: './logs/core-out.log',
      restart_delay: 5000,
      max_restarts: 10,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};