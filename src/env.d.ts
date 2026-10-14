// Secrets aren't in wrangler.jsonc, so `wrangler types` can't see them.
interface Env {
  OPENAI_API_KEY: string;
  ADMIN_TOKEN: string;
}
