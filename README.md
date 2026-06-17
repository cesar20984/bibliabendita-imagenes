# Biblia Bendita Social Studio

Primera etapa de una app para crear imagenes verticales de Instagram para
`bibliabendita.com`.

## Desarrollo

```bash
npm install
npm run dev
```

## Produccion

```bash
npm run build
```

La app genera imagenes de 1080 x 1350 px mediante Canvas. El contenido principal
se mantiene dentro de la zona central de 1080 x 1080 px para que siga visible en
la cuadricula cuadrada de Instagram. El estilo, la paleta, la semilla y la
posicion de los elementos se seleccionan automaticamente.

La biblioteca procedural incluye trece familias visuales: Aurora, Horizonte,
Papel, Ondas, Vitral, Botanica, Topografia, Mosaico, Rayos de luz, Lino,
Constelaciones, Arcos y Terrazo.

## API

La app incluye una funcion serverless de Vercel:

```text
POST /api/generate
Content-Type: application/json

{
  "text": "Texto generado a partir de una publicacion",
  "reference": "Salmos 32:8"
}
```

La funcion devolvera un archivo `image/png`. Para esa etapa, el renderizado de
Canvas del navegador se traslado a un renderer compatible con Node.js.

Tambien puede trabajar con contenido real de `bibliabendita.com` de tres formas:

1. URL directa de Bibliabendita
2. Libro, capitulo y versiculo
3. Referencia aleatoria valida generada desde la lista de libros/capitulos/versiculos

Tambien incluye un endpoint separado para pedir solo una URL aleatoria, sin generar imagen:

```text
GET /api/random-reference
POST /api/random-reference
```

Y ahora tambien un endpoint que hace todo el flujo en una sola solicitud:

```text
GET /api/generate-random
POST /api/generate-random
```

Prueba local directa del generador:

```bash
npm run sample:api
```

Esto crea `tmp/api-sample.png`.

Cuando la app este corriendo con Vercel, puedes probar el endpoint asi:

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"Dios sostiene tu camino aun cuando no ves el final.\",\"reference\":\"Salmos 32:8\"}" \
  --output imagen.png
```

Tambien puedes fijar un estilo para pruebas:

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"Dios sostiene tu camino.\",\"reference\":\"Salmos 32:8\",\"style\":\"botanical\",\"seed\":\"demo\"}" \
  --output imagen.png
```

### Probar con una URL de Bibliabendita

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d "{\"sourceUrl\":\"https://bibliabendita.com/hebreos/hebreos-7-23\"}" \
  --output imagen.png
```

### Probar con libro, capitulo y versiculo

El slug del libro debe coincidir con la lista cargada en `api/lib/bible-data.js`.

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d "{\"book\":\"1-tesalonicenses\",\"chapter\":5,\"verse\":12}" \
  --output imagen.png
```

### Probar con una referencia aleatoria

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d "{\"randomVerse\":true}" \
  --output imagen.png
```

### Generar una imagen completa en una sola solicitud aleatoria

```bash
curl http://localhost:3000/api/generate-random --output imagen.png
```

Tambien puedes usar `POST`:

```bash
curl -X POST http://localhost:3000/api/generate-random --output imagen.png
```

Si quieres inspeccionar el texto y la referencia antes de pedir la imagen:

```bash
curl "http://localhost:3000/api/generate-random?format=json"
```

### Obtener solo una URL aleatoria

```bash
curl http://localhost:3000/api/random-reference
```

Respuesta esperada:

```json
{
  "ok": true,
  "endpoint": "GET /api/random-reference",
  "bookSlug": "hebreos",
  "chapter": 7,
  "verse": 23,
  "url": "https://bibliabendita.com/hebreos/hebreos-7-23",
  "sourceUrl": "https://bibliabendita.com/hebreos/hebreos-7-23"
}
```

Tambien puedes usar `POST` y mandar una `seed` si quieres repetir la misma referencia:

```bash
curl -X POST http://localhost:3000/api/random-reference \
  -H "Content-Type: application/json" \
  -d "{\"seed\":\"demo-1\"}"
```

### Ver el comentario y los datos en JSON

Antes de pedir la imagen final, puedes inspeccionar lo que se extrajo y el texto
que ira dentro de la imagen:

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d "{\"sourceUrl\":\"https://bibliabendita.com/hebreos/hebreos-7-23\",\"format\":\"json\"}"
```

## IA

Si defines `OPENAI_API_KEY`, la API intentara generar un comentario corto con un
LLM usando `gpt-4.1-mini` por defecto. Si no existe esa variable, usara un
fallback basado en el contenido extraido de la pagina.

Variables opcionales:

```text
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
```

## Siguientes etapas

- Afinar todavia mas la extraccion si cambian bloques o clases del sitio.
- Elegir automaticamente entre varios tipos de contenido del sitio.
- Ajustar el prompt del comentario para tu tono final.
- Anadir persistencia, historial y generacion por lotes.
