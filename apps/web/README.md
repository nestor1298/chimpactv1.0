# chimpact.org

Sitio de Chimpact: un Worker de Cloudflare que sirve archivos estáticos y responde una sola ruta, `/api/waitlist`.

## Publicar

La forma normal es automática: Cloudflare Workers Builds está conectado al repositorio (root directory `apps/web`) y publica cada push a `main`. Lo de abajo es para publicar a mano o configurar la lista de espera y el dominio.

Necesitas Node 18 o superior y una cuenta de Cloudflare donde `chimpact.org` esté agregado como zona.

```bash
npm install
npx wrangler login                          # abre el navegador para autorizar
npx wrangler kv namespace create WAITLIST   # copia el id que imprime
```

En `wrangler.toml`:

1. Descomenta el bloque `[[kv_namespaces]]` y pega el id.
2. Descomenta `routes` para servir en `chimpact.org` y `www.chimpact.org`.

Después:

```bash
npm run deploy                              # vite build + wrangler deploy
```

Sin dominio, el sitio queda en `https://chimpact.<tu-subdominio>.workers.dev`.

## Ver los registros de la lista de espera

```bash
npx wrangler kv key list --binding WAITLIST --remote
npx wrangler kv key get "waitlist:correo@dominio.org" --binding WAITLIST --remote
```

## Desarrollo

```bash
npm run dev       # Vite en http://localhost:5173 (sin /api)
npm run build && npx wrangler dev   # sitio + Worker local
```

## Stack y fuentes

- Vite, GSAP 3.12 con ScrollTrigger, Lenis como único motor de scroll suave, Three.js solo para el campo de curvas del hero (carga diferida).
- Con `prefers-reduced-motion: reduce` no se inicia Lenis ni WebGL ni las animaciones con scroll; se ve la página final y la imagen estática del campo.
- Tipografías: Montserrat y Source Sans 3 (Fontsource, SIL Open Font License).
- Íconos: Solar, vía Iconify (CC BY 4.0, 480 Design), guardados en `src/icons` e insertados al compilar.
- Marca: geometría redibujada a partir del logo de Chimpact.
- `public/assets/field-poster.webp`: captura del propio campo de curvas (`/?poster`).
- `public/media/chimpact-cinco-disciplinas.mp4`: video original de Chimpact, voz sintética (Piper, voz es_MX) y subtítulos integrados.
