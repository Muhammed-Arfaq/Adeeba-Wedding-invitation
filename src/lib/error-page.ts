/**
 * Standalone HTML for catastrophic SSR failures — the app's stylesheet is
 * not available here, so everything is inlined.
 */
export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#0c3620" />
    <style>
      body { font: 15px/1.6 Georgia, "Times New Roman", serif; background: #f6edd9; color: #0c3620; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2.5rem 2rem; background: #fdf8f0; border: 1px solid rgba(201,168,76,0.45); border-radius: 1rem; box-shadow: 0 20px 60px rgba(12,54,32,0.08); }
      .orn { color: #c9a84c; letter-spacing: 0.6em; font-size: 0.85rem; margin-bottom: 1rem; }
      h1 { font-size: 1.35rem; font-weight: 600; margin: 0 0 0.5rem; }
      p { color: rgba(12,54,32,0.7); margin: 0 0 1.75rem; }
      .actions { display: flex; gap: 0.6rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.7rem 1.5rem; border-radius: 9999px; font: inherit; font-size: 0.8rem; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: linear-gradient(135deg, #e6cf9a 0%, #c9a84c 60%, #b8922e 100%); color: #0c3620; }
      .secondary { background: transparent; color: #0c3620; border-color: rgba(201,168,76,0.55); }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="orn">&#10022;</div>
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back to the invitation.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
