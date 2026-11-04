// Vercel edge middleware: when someone opens the site with share params
// (e.g. /?score=1234&species=Shark&name=Christian — the link posted to
// Facebook), rewrite the Open Graph tags so the link preview card shows
// the player's score. FB's scraper doesn't run JS, hence this middleware.

export const config = {
  matcher: '/',
};

const DEFAULT_TITLE = 'Big Fish 🐠';
const DEFAULT_DESC =
  'Start as a tiny guppy, eat smaller organisms, and evolve up the food chain to the mighty Whale Shark. Can you survive the ocean?';

export default async function middleware(request) {
  const res = await fetch(request);
  const url = new URL(request.url);
  const score = Number(url.searchParams.get('score'));
  if (!score) return res;

  const species = url.searchParams.get('species') || 'Guppy';
  const name = url.searchParams.get('name');

  const title = `${name ? name + ' scored ' : 'Score: '}${score.toLocaleString('en-US')} in Big Fish 🐠`;
  const desc = `${name || 'Someone'} reached ${score.toLocaleString('en-US')} points as a ${species} — can you beat them? Start as a guppy, evolve into the mighty Whale Shark!`;

  const html = await res.text();
  const out = html
    .replaceAll(`content="${DEFAULT_TITLE}"`, `content="${esc(title)}"`)
    .replaceAll(`content="${DEFAULT_DESC}"`, `content="${esc(desc)}"`);

  return new Response(out, {
    status: res.status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
