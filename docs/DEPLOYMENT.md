# Despliegue de Brisa Frontend en Cloudflare Pages

## Flujo de aprobación

Trabajar en `feat/despliegue-cloudflare`, creada desde `origin/master`, y abrir PR hacia `master`. Producción usa `master` en ambos repositorios. El workflow comprueba la rama y los PR; publica únicamente desde `master` si `CLOUDFLARE_DEPLOY_ENABLED` vale exactamente `true`. Configurar protección de `master` y aprobación de PR en GitHub cuando se disponga de permisos.

El checkout original puede conservar archivos locales; esta preparación se realizó en un worktree separado para no sobrescribirlos. Publicar la rama desde ese worktree, no desde un `master` local desactualizado.

## Cloudflare Pages

Crear un proyecto Pages de tipo Direct Upload para usar GitHub Actions como responsable de publicación. Usar `master` como rama de producción. Al crearlo con Wrangler: `npx wrangler pages project create <nombre-del-proyecto> --production-branch master`. Revisar la cuenta y el nombre antes de ejecutar ese comando. No configurar a la vez un segundo despliegue automático por integración Git. No hace falta Docker para servir el resultado estático de Vite.

En Settings > Variables and Secrets del proyecto Pages, definir `BACKEND_ORIGIN` como el origen HTTPS público de Render, por ejemplo `https://<servicio>.onrender.com`, sin ruta, credenciales ni query. Esta variable corresponde a Pages Functions en ejecución. Configurar también el entorno preview si se utiliza, siempre contra un backend de prueba autorizado.

## GitHub Actions

En Settings > Secrets and variables > Actions del repositorio frontend:

| Tipo | Nombre | Valor |
| --- | --- | --- |
| Secret | CLOUDFLARE_API_TOKEN | Token limitado a editar Pages en la cuenta elegida |
| Variable | CLOUDFLARE_ACCOUNT_ID | Identificador de esa cuenta |
| Variable | CLOUDFLARE_PROJECT_NAME | Nombre exacto del proyecto Pages |
| Variable | CLOUDFLARE_DEPLOY_ENABLED | false durante la preparación; true cuando esté configurado |

El workflow usa Node 22, `npm ci` con el lock existente, lint de los archivos de configuración/proxy, tests existentes, tests del proxy y `npm run build`. Wrangler publica `dist` junto con la función ubicada en `functions/api/[[path]].js` y `public/_routes.json`. El lint es incremental y no certifica todo el repositorio.

## Conexión con el backend

El build de producción define `VITE_API_URL=/api`. El navegador llama a su propio dominio; Pages Functions quita ese prefijo y reenvía al origen Render. Así la cookie HttpOnly de producción conserva Secure, Path=/ y SameSite=Lax. Se conservan cookies, token CSRF, cuerpos y códigos HTTP. Las cabeceras de autenticación de módulos internos no se reenvían desde el navegador.

`BACKEND_ORIGIN` queda en el servidor. No colocar secretos de módulos internos, S3 ni correo en variables `VITE_*`, porque se incorporan al JavaScript público. Para desarrollo local, copiar `.env.example` a `.env`: usa `http://localhost:3000`.

Configurar en Render `PWA_ORIGINS` con el origen HTTPS de este frontend. Las solicitudes `/api` consumen el cupo de Pages Functions/Workers; consultar los límites vigentes de la cuenta. La suspensión de Render sigue afectando al primer acceso y a sus jobs. Los archivos estáticos de Pages no dependen de que el backend esté despierto.

## Validación antes de aprobar

```sh
npm ci
npm test
node --test scripts/deployment/proxy.check.mjs
npm run build
```

Para reproducir el build de CI, definir `VITE_API_URL=/api` en el entorno antes de compilar. Probar en un despliegue de prueba las rutas SPA, inicio/cierre de sesión, cookie segura, CSRF, errores del backend y peticiones tras suspensión. Una preview debe usar su backend de pruebas; no ejecutar flujos con escritura sobre datos compartidos sin autorización.

Referencias: [Pages con GitHub Actions](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/), [Pages Functions](https://developers.cloudflare.com/pages/functions/), [variables y bindings](https://developers.cloudflare.com/pages/functions/bindings/).

La implementación de Chat del backend sigue en otra rama y no forma parte de su `master` actual. Estas ramas de despliegue no incorporan ese trabajo; coordinar su integración antes de validar el flujo completo de Chat.
