import { copyFile, writeFile } from "node:fs/promises";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("pages", Date.now().toString());
const { default: worker } = await import(workerUrl.href);

const response = await worker.fetch(
  new Request("https://example.github.io/", {
    headers: { accept: "text/html" },
  }),
  {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  },
  {
    waitUntil() {},
    passThroughOnException() {},
  },
);

if (!response.ok) {
  throw new Error(`Unable to render the site: ${response.status}`);
}

let html = await response.text();
html = html
  .replaceAll("/assets/", "./assets/")
  .replaceAll("/favicon.svg", "./favicon.svg")
  .replaceAll('href="/', 'href="./')
  .replaceAll('src="/', 'src="./')
  .replaceAll('"assetPrefix":""', '"assetPrefix":"./"');

await writeFile(new URL("../dist/client/index.html", import.meta.url), html);
await writeFile(new URL("../dist/client/.nojekyll", import.meta.url), "");
await copyFile(
  new URL("../app/vocab-data.json", import.meta.url),
  new URL("../dist/client/vocab-data.json", import.meta.url),
);

console.log("GitHub Pages bundle created in dist/client");
