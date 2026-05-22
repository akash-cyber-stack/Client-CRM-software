import app from './app.js';
import { env } from './config/env.js';

const PORT = env.port;
app.listen(PORT, () => {
  console.log(`Sales Lead CRM API running on http://localhost:${PORT}`);
});
