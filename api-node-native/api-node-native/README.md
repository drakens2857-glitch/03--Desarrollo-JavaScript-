# API REST con Node.js Nativo

Este proyecto contiene una **API REST completa** implementada con Node.js nativo (sin Express).  
Incluye operaciones CRUD para el recurso `usuarios` y almacenamiento simple en `data/usuarios.json`.

## Estructura
```
api-node-native/
├── data/
│   └── usuarios.json
├── server.js
├── package.json
├── .gitignore
└── README.md
```

## Requisitos
- Node.js instalado (v14+ recomendado)
- npm (v6+)

## Ejecutar (modo producción)
1. Descomprime el ZIP y entra a la carpeta:
```bash
cd api-node-native
```
2. Instala dependencias si las necesitas (no hay dependencias externas):
```bash
npm install
```
3. Inicia el servidor:
```bash
npm start
```
El servidor escuchará por defecto en el puerto `3000`. Puedes cambiarlo exportando `PORT`:
```bash
PORT=4000 npm start
```

## Endpoints principales
- `GET /` - Información de la API
- `GET /api/usuarios` - Obtener todos los usuarios
- `GET /api/usuarios/:id` - Obtener usuario por id
- `POST /api/usuarios` - Crear usuario (body JSON: nombre, email, edad)
- `PUT /api/usuarios/:id` - Actualizar usuario (body JSON con los campos a actualizar)
- `DELETE /api/usuarios/:id` - Eliminar usuario

## Ejemplos con curl
Obtener todos:
```bash
curl http://localhost:3000/api/usuarios
```

Crear usuario:
```bash
curl -X POST http://localhost:3000/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Pedro Martínez","email":"pedro@email.com","edad":30}'
```

Actualizar:
```bash
curl -X PUT http://localhost:3000/api/usuarios/1 \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Ana Actualizada","edad":29}'
```

Eliminar:
```bash
curl -X DELETE http://localhost:3000/api/usuarios/2
```

## Notas
- El almacenamiento se realiza en `data/usuarios.json`. Para producción se recomienda usar una base de datos real.
- El archivo `data/usuarios.json` se incluye con datos de ejemplo. Para mantener los datos locales durante pruebas, no lo subas a repositorios públicos.
