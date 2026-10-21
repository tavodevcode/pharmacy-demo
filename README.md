# Ambrosial Pharmacy

App frontend en **Vite + JavaScript** basada en el diseño Aura: catálogo de productos, favoritos, solicitudes de reserva, formulario de contacto y chat informativo de demostración.

## Desarrollo

Requiere Node.js 22.12+ o 24+.

```sh
npm ci
npm run dev
```

Abrir http://localhost:5173.

```sh
npm run check   # Sintaxis, pruebas y build de producción
npm run build   # Genera dist/
npm run preview # Revisa dist/ en http://localhost:4174
```

## Estructura

- `src/main.js`: interfaces, navegación por hash e interacciones.
- `src/data/catalog.js`: catálogo y preguntas frecuentes.
- `src/lib/reservations.js`: validación y lectura de sesión.
- `src/styles.css`: componentes visuales y adaptación a móvil/escritorio.
- `src/assets/fonts/`: Plus Jakarta Sans y Material Symbols locales.
- `public/images/site/`: imágenes de referencia de los productos.
- `tests/`: pruebas de validación y recuperación de sesión.

## Experiencia

Aviso de mayoría de edad → Inicio → Catálogo y filtros → Ficha → Reserva de uno o varios productos → Datos de contacto → Confirmación simulada.

Incluye favoritos, búsqueda, cantidades editables, validación del formulario, FAQ y chat determinista con enlaces a la información disponible. El diseño ocupa el ancho móvil y se presenta como app centrada en escritorio.

## Estado de la app

Esta versión es un **frontend de demostración**. No tiene backend, inventario real, cobros, envío de mensajes ni integración con WhatsApp. Las existencias son simuladas y las imágenes son referencias. Usar datos ficticios.

El acceso, los IDs/cantidades seleccionados y los favoritos se guardan en `sessionStorage`. Los datos personales y la confirmación permanecen solo en memoria: se pierden al recargar y no se transmiten a un servidor.

## Hosting

El resultado `dist/` puede publicarse en cualquier hosting estático. La navegación por hash no requiere reescrituras del servidor. Para publicar bajo una subruta:

```sh
VITE_BASE_PATH=/pharmacy/ npm run build
```

La variable se lee al construir la app; también se puede configurar en `.env.local`. GitHub Actions ejecuta pruebas y build en cada push o pull request. El workflow no publica automáticamente la app.

## Próximas integraciones

API de catálogo e inventario, backend de solicitudes, número oficial de WhatsApp, políticas y documentación definitivas. El contenido clínico y las condiciones comerciales requieren revisión antes de publicar una versión operativa.
