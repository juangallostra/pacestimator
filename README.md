# Ritmo de Sendero

Estimador de ritmo y tiempo de carrera para trail running: calcula tu ritmo llano
equivalente a partir de tus últimos entrenos (GPX) y lo aplica al perfil de una
carrera objetivo, tramo a tramo, usando el modelo de coste metabólico de
Minetti (2002) — con ACSM como modelo de referencia alternativo.

Proyecto Vite estándar, sin frameworks: HTML + CSS + JavaScript vainilla.

## Estructura

```
ritmo-sendero/
├── index.html        # Marcado de la app
├── src/
│   ├── main.js        # Toda la lógica (parseo de GPX, cálculos, gráficos SVG)
│   └── style.css       # Estilos
├── package.json
└── vite.config.js      # (opcional, no hace falta tocarlo)
```

## Puesta en marcha

Requiere Node.js 20.19+ o 22.12+.

```bash
npm install
npm run dev
```

Abre la URL que muestre la terminal (normalmente `http://localhost:5173`).

## Build de producción

```bash
npm run build
```

Genera los archivos estáticos optimizados en `dist/`. Puedes servirlos con
cualquier hosting estático (Netlify, Vercel, GitHub Pages, Cloudflare Pages...)
o previsualizarlos localmente con:

```bash
npm run preview
```

## Por qué esto no funcionaba dentro del chat

Todo el procesamiento (parseo de GPX, cálculos, gráficos) ocurre en el
navegador — no hay backend. La única limitación real es que, si en algún
momento quieres traer datos automáticamente de servicios externos (por
ejemplo Strava vía OAuth), esa parte sí necesitaría un backend propio con las
credenciales — fuera del alcance de este proyecto tal cual está.

## Notas técnicas rápidas

- **Modelo**: coste metabólico de Minetti (2002), con ACSM como referencia de
  comparación (ver el desplegable "¿De dónde sale tu ritmo llano
  equivalente...?" dentro de la app).
- **Ventana lineal (m)**: cómo se calcula cada pendiente a partir del GPX
  crudo (interpolación sobre una distancia fija, no punto a punto). Configurable
  en el Paso 1.
- **Ventana de agrupación (%)**: cómo se agrupan los tramos ya calculados para
  dibujar el gráfico de curva de esfuerzo. Configurable junto al gráfico.
- **Corrección de fatiga**: escalado tipo Riegel (exponente 1.06) cuando la
  carrera objetivo es notablemente más larga que tu tirada más probada.
