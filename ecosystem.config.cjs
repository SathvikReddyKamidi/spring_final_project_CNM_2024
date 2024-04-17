module.exports = {
  apps: [
    {
      name: 'ics-prod',
      script: 'bun run start',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
