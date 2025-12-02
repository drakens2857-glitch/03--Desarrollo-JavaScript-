// API REST con Node.js Nativo
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';
const DATA_FILE = path.join(__dirname, 'data', 'usuarios.json');

function leerUsuarios() {
  try {
    const datos = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(datos);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    console.error('Error leyendo usuarios:', err);
    return [];
  }
}

function guardarUsuarios(usuarios) {
  try {
    const json = JSON.stringify(usuarios, null, 2);
    fs.writeFileSync(DATA_FILE, json, 'utf8');
    return true;
  } catch (err) {
    console.error('Error guardando usuarios:', err);
    return false;
  }
}

function validarUsuario(datos, partial = false) {
  const errores = [];
  if (!partial || datos.nombre !== undefined) {
    if (!datos.nombre || typeof datos.nombre !== 'string' || datos.nombre.trim().length < 2 || datos.nombre.trim().length > 100) {
      errores.push('El nombre es obligatorio y debe tener entre 2 y 100 caracteres');
    }
  }
  if (!partial || datos.email !== undefined) {
    if (!datos.email || typeof datos.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email)) {
      errores.push('El email es obligatorio y debe tener formato válido');
    }
  }
  if (datos.edad !== undefined) {
    if (typeof datos.edad !== 'number' || datos.edad < 0 || datos.edad > 120) {
      errores.push('La edad, si se proporciona, debe ser un número entre 0 y 120');
    }
  }
  return { valido: errores.length === 0, errores };
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname.replace(/\/+$/,'') || '/';
  const method = req.method.toUpperCase();

  // CORS & JSON headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  console.log(`${new Date().toISOString()} - ${method} ${pathname}`);

  // Root info
  if (pathname === '/' && method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      mensaje: 'API REST con Node.js Nativo',
      version: '1.0.0',
      endpoints: [
        'GET /',
        'GET /api/usuarios',
        'GET /api/usuarios/:id',
        'POST /api/usuarios',
        'PUT /api/usuarios/:id',
        'DELETE /api/usuarios/:id'
      ]
    }));
    return;
  }

  // GET /api/usuarios
  if (pathname === '/api/usuarios' && method === 'GET') {
    const usuarios = leerUsuarios();
    res.writeHead(200);
    res.end(JSON.stringify({ exito: true, total: usuarios.length, datos: usuarios }));
    return;
  }

  // POST /api/usuarios
  if (pathname === '/api/usuarios' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const datos = JSON.parse(body || '{}');
        const valid = validarUsuario(datos, false);
        if (!valid.valido) {
          res.writeHead(400);
          res.end(JSON.stringify({ exito: false, errores: valid.errores }));
          return;
        }
        const usuarios = leerUsuarios();
        if (usuarios.some(u => u.email === datos.email.trim().toLowerCase())) {
          res.writeHead(400);
          res.end(JSON.stringify({ exito: false, mensaje: 'El email ya está registrado' }));
          return;
        }
        const nuevoId = usuarios.length > 0 ? Math.max(...usuarios.map(u => u.id)) + 1 : 1;
        const nuevo = {
          id: nuevoId,
          nombre: datos.nombre.trim(),
          email: datos.email.trim().toLowerCase(),
          edad: typeof datos.edad === 'number' ? datos.edad : null,
          activo: true,
          fechaCreacion: new Date().toISOString()
        };
        usuarios.push(nuevo);
        if (!guardarUsuarios(usuarios)) throw new Error('No se pudo guardar el usuario');
        res.writeHead(201);
        res.end(JSON.stringify({ exito: true, mensaje: 'Usuario creado exitosamente', datos: nuevo }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ exito: false, mensaje: 'Error procesando solicitud', error: err.message }));
      }
    });
    return;
  }

  // Match /api/usuarios/:id
  const matchId = pathname.match(/^\/api\/usuarios\/(\d+)$/);
  if (matchId) {
    const id = parseInt(matchId[1], 10);
    // GET by id
    if (method === 'GET') {
      const usuarios = leerUsuarios();
      const usuario = usuarios.find(u => u.id === id);
      if (!usuario) {
        res.writeHead(404);
        res.end(JSON.stringify({ exito: false, mensaje: `Usuario con ID ${id} no encontrado` }));
        return;
      }
      res.writeHead(200);
      res.end(JSON.stringify({ exito: true, datos: usuario }));
      return;
    }

    // PUT update
    if (method === 'PUT') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', () => {
        try {
          const datos = JSON.parse(body || '{}');
          const usuarios = leerUsuarios();
          const idx = usuarios.findIndex(u => u.id === id);
          if (idx === -1) {
            res.writeHead(404);
            res.end(JSON.stringify({ exito: false, mensaje: `Usuario con ID ${id} no encontrado` }));
            return;
          }
          const merged = { ...usuarios[idx], ...datos };
          const valid = validarUsuario(merged, true);
          if (!valid.valido) {
            res.writeHead(400);
            res.end(JSON.stringify({ exito: false, errores: valid.errores }));
            return;
          }
          // Check unique email if changed
          if (datos.email && usuarios.some(u => u.email === datos.email.trim().toLowerCase() && u.id !== id)) {
            res.writeHead(400);
            res.end(JSON.stringify({ exito: false, mensaje: 'El email ya está registrado por otro usuario' }));
            return;
          }
          usuarios[idx] = {
            ...usuarios[idx],
            ...datos,
            id: id,
            nombre: merged.nombre ? merged.nombre.trim() : usuarios[idx].nombre,
            email: merged.email ? merged.email.trim().toLowerCase() : usuarios[idx].email,
            fechaActualizacion: new Date().toISOString()
          };
          if (!guardarUsuarios(usuarios)) throw new Error('No se pudo guardar la actualización');
          res.writeHead(200);
          res.end(JSON.stringify({ exito: true, mensaje: 'Usuario actualizado', datos: usuarios[idx] }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ exito: false, mensaje: 'Error procesando solicitud', error: err.message }));
        }
      });
      return;
    }

    // DELETE
    if (method === 'DELETE') {
      const usuarios = leerUsuarios();
      const idx = usuarios.findIndex(u => u.id === id);
      if (idx === -1) {
        res.writeHead(404);
        res.end(JSON.stringify({ exito: false, mensaje: `Usuario con ID ${id} no encontrado` }));
        return;
      }
      const eliminado = usuarios.splice(idx, 1)[0];
      if (!guardarUsuarios(usuarios)) {
        res.writeHead(500);
        res.end(JSON.stringify({ exito: false, mensaje: 'No se pudo eliminar el usuario' }));
        return;
      }
      res.writeHead(200);
      res.end(JSON.stringify({ exito: true, mensaje: 'Usuario eliminado', datos: eliminado }));
      return;
    }
  }

  
  // SERVE_STATIC
  if (pathname.startsWith('/public/')) {
    const fsPath = path.join(__dirname, pathname);
    if (fs.existsSync(fsPath)) {
      const ext = fsPath.split('.').pop();
      const types = { css: 'text/css', html: 'text/html' };
      res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
      res.end(fs.readFileSync(fsPath));
      return;
    }
  }

  // Route not found
  res.writeHead(404);
  res.end(JSON.stringify({ exito: false, mensaje: 'Ruta no encontrada', ruta: pathname }));
});

server.listen(PORT, HOST, () => {
  console.log(`Servidor ejecutándose en http://${HOST}:${PORT}`);
});
