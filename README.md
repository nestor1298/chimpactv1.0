# Chimpact

Chimpact ayuda a personas, organizaciones y gobiernos a diseñar, ejecutar y aprender de iniciativas de impacto social con el framework **Champion Impact**: árbol de problemas, teoría de cambio, monitoreo y evaluación, y la historia de lo que cambió.

## Estructura

```
apps/
  web/        Sitio público de chimpact.org (Vite + GSAP + Lenis + Three.js, en Cloudflare Workers)
brand/
  marks/      Marca completa y las cinco marcas de disciplina, en SVG
  tokens.json Colores, tipografías y el mapa disciplina → marca
```

## Las cinco disciplinas y sus marcas

| Disciplina | Marca | Módulo |
|---|---|---|
| Dominio personal | persona | Base Camp |
| Modelos mentales | curva | The Blueprint |
| Visión compartida | curva + persona | Safari Strategy |
| Aprendizaje en equipo | curva + persona + rayo | The Harvest |
| Pensamiento sistémico | curva + delta | Capa transversal |

## Publicar chimpact.org

El sitio se publica con Cloudflare Workers Builds, conectado a este repositorio. Cada push a `main` lo vuelve a publicar.

Configuración del proyecto en Cloudflare (Workers & Pages → Create → Import a repository):

| Campo | Valor |
|---|---|
| Root directory | `apps/web` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |

Lista de espera, dominio y desarrollo local: ver [`apps/web/README.md`](apps/web/README.md).
