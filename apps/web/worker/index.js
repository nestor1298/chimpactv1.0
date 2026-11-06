// chimpact.org · Cloudflare Worker
// Static files are served by Workers Static Assets (./dist). This script only answers /api/waitlist.
// Waitlist entries are stored in the KV namespace bound as WAITLIST (see wrangler.toml).

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PERFILES = new Set(["champion", "organizacion", "gobierno"]);

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/waitlist") {
      if (request.method !== "POST") return json({ ok: false, error: "method" }, 405);
      if (!env.WAITLIST) return json({ ok: false, error: "not_configured" }, 503);
      let data;
      try { data = await request.json(); } catch { return json({ ok: false, error: "body" }, 400); }
      const email = String(data.email || "").trim().toLowerCase();
      const perfil = PERFILES.has(data.perfil) ? data.perfil : "champion";
      if (email.length > 254 || !EMAIL.test(email)) return json({ ok: false, error: "email" }, 400);
      await env.WAITLIST.put(`waitlist:${email}`, JSON.stringify({ email, perfil, at: new Date().toISOString(), country: request.cf?.country || null }));
      return json({ ok: true });
    }
    return env.ASSETS.fetch(request);
  },
};
