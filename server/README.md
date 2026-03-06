# Server (API + SQLite)

Backend Node.js con Express + SQLite para subir archivos y guardarlos en base de datos.

## Requisitos

- Node.js 18+ (recomendado LTS)

## Ejecutar

```bash
npm install
npm run dev
```

Servidor por defecto: `http://localhost:4000`

Al iniciar se crean automaticamente:

- `data/juma.db` (base SQLite)
- `uploads/` (archivos subidos)

## Endpoints

- `GET /health`
- `POST /api/files` (multipart/form-data, campo `file`)
- `GET /api/files`
- `GET /api/files/:id/download`

## Pruebas rapidas con curl

Subir archivo:

```bash
curl -X POST http://localhost:4000/api/files \
  -F "file=@./README.md"
```

Listar archivos:

```bash
curl http://localhost:4000/api/files
```

Descargar por id:

```bash
curl -L http://localhost:4000/api/files/1/download --output archivo.bin
```

