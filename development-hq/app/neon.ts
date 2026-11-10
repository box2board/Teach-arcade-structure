import { defineConfig } from '@neondatabase/config/v1';
// The Neon project/branch is linked by `neon init`; this file declares services.
// Managed Auth is required because the dashboard has a private administrator login.
export default defineConfig({ auth: true });
