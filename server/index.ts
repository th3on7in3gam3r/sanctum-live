import { createApp } from './app.ts';
import { env } from './env.ts';

const app = createApp();

app.listen(env.port, env.bindHost, () => {
  console.log(`Sanctum Live API listening on http://${env.bindHost}:${env.port}`);
});
