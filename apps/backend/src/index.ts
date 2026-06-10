import { createApp } from './app.js';
import { config } from './config.js';

const app = createApp();

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`VaultBridge backend listening on http://localhost:${config.port}`);
});
