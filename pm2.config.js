module.exports = {
  apps: [
    {
      name: 'mongobackendframework',
      script: 'dist/src/devApp.js',  // compiled output
      watch: false,                  // disable file watching in prod
      instances: 1,                  // or "max" for clustering
      autorestart: true,
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    }
  ]
}
