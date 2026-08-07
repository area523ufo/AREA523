const path = require("node:path");

module.exports = {
  apps: [
    {
      name: "area523-verification",
      cwd: __dirname,
      script: path.join(
        __dirname,
        "node_modules",
        "tsx",
        "dist",
        "cli.mjs",
      ),
      args: [
        path.join(
          __dirname,
          "workers",
          "verification-worker.ts",
        ),
      ],
      interpreter: "node",
      autorestart: true,
      watch: false,
      restart_delay: 5000,
      max_restarts: 10,
      time: true,
    },
    {
      name: "area523-monthly-ranking",
      cwd: __dirname,
      script: path.join(
        __dirname,
        "node_modules",
        "tsx",
        "dist",
        "cli.mjs",
      ),
      args: [
        path.join(
          __dirname,
          "workers",
          "monthly-ranking-worker.ts",
        ),
      ],
      interpreter: "node",
      autorestart: true,
      watch: false,
      restart_delay: 5000,
      max_restarts: 10,
      time: true,
    },
  ],
};