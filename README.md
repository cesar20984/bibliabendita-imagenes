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

## Siguientes etapas

- Elegir automaticamente una URL de `bibliabendita.com`.
- Extraer y normalizar el contenido de la publicacion.
- Crear el texto y la referencia mediante IA.
- Anadir persistencia, historial y generacion por lotes.
