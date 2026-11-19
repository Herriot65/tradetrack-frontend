# Browser sessions

The API now keeps refresh tokens in host-only HttpOnly cookies and returns only
15-minute access tokens, which the frontend keeps in memory. No tokens or cached
user identity are persisted in localStorage. On reload the app restores its access
token through /api/auth/refresh/ and verifies the current user before rendering
protected content. Legacy localStorage tokens are discarded once during startup.

Remember me applies to password and Google sign-in. It creates a persistent
seven-day cookie; refresh extends this window up to 30 days from the login.
Without Remember me the refresh cookie is a browser-session cookie. Browsers may
retain session cookies when restoring a previous browsing session; the server
limits always apply.

Use VITE_API_BASE_URL=/api. Vite proxies /api to localhost:8000 during development;
Vercel rewrites /api to the configured backend; Docker nginx already proxies it.
This keeps cookies on the frontend origin and avoids third-party-cookie blocking.
The backend must trust the frontend's exact Origin for CSRF. Production uses
Secure cookies and HTTPS; only local HTTP should disable AUTH_COOKIE_SECURE.

Account settings includes Sign out all devices with password or Google identity
confirmation. Logout clears all tabs on this origin. Failed/offline logout sets
a non-secret pending flag so startup retries revocation before restoring sessions.

Run npm test, npm run build and npm run test:session. The session browser test
requires a sibling ../tradetrack-backend checkout and its installed Python
dependencies; use BACKEND_PYTHON=/path/to/python. The suite creates a temporary
SQLite database, starts Django on port 18887 and previews the frontend on 4197.
It never uses live accounts. PLAYWRIGHT_MODULE and CHROMIUM_PATH can point to
externally installed browser tooling.

See the backend docs/browser-sessions.md for API behavior, migration and rollout
steps. Deploy both repositories together after approval; all existing users will
need to sign in again. No live deployment or configuration changes are included.
