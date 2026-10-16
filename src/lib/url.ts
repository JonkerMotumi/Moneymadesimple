/** Prefix a site path with the deployment base ("/" on a custom domain, "/Repo/" on GitHub Pages). */
export const u = (path: string): string => import.meta.env.BASE_URL.replace(/\/$/, '') + path;
