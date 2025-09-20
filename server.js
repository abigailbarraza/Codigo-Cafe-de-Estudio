// server.js
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import db from "./database.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(cors());
app.use(express.json());

// ----------------- Servir archivos estáticos -----------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(__dirname));

// ----------------- Usuarios -----------------
app.post("/register", async (req, res) => {
  const { nombre, email, password } = req.body;
   
  try {
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, row) => {
      if (err) return res.status(500).json({ error: "Error en la base de datos" });
      if (row) return res.status(400).json({ error: "Usuario ya existe" });
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      db.run("INSERT INTO users (nombre, email, password) VALUES (?, ?, ?)", 
        [nombre, email, hashedPassword], function(err) {
        if (err) return res.status(500).json({ error: "Error al registrar usuario" });
        res.json({ 
          success: true, 
          message: "Registrado con éxito", 
          user: { id: this.lastID, nombre, email } 
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: "Error del servidor" });
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, row) => {
    if (err) return res.status(500).json({ error: "Error en la base de datos" });
    if (!row) return res.status(400).json({ error: "Credenciales incorrectas" });
    
    try {
      const match = await bcrypt.compare(password, row.password);
      if (match) {
        res.json({ success: true, user: { id: row.id, nombre: row.nombre, email: row.email } });
      } else {
        res.status(400).json({ error: "Credenciales incorrectas" });
      }
    } catch (error) {
      res.status(500).json({ error: "Error del servidor" });
    }
  });
});

// ----------------- Libros -----------------
app.get("/libros", (req, res) => {
  db.all("SELECT * FROM libros", (err, rows) => {
    if (err) return res.status(500).json({ error: "Error al obtener libros" });
    res.json(rows);
  });
});

app.get("/libros/:id", (req, res) => {
  const id = parseInt(req.params.id);
  db.get("SELECT * FROM libros WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: "Error en la base de datos" });
    if (!row) return res.status(404).json({ error: "Libro no encontrado" });
    res.json(row);
  });
});

// ----------------- Reservas -----------------
app.post("/reservas", (req, res) => {
  const { tipo, personas, fecha, hora, usuario } = req.body;
  
  db.get("SELECT id FROM users WHERE email = ?", [usuario], (err, userRow) => {
    if (err || !userRow) return res.status(400).json({ error: "Usuario no válido" });
    
    db.get("SELECT * FROM reservas WHERE tipo = ? AND fecha = ? AND hora = ?", 
      [tipo, fecha, hora], (err, reservaExistente) => {
      if (err) return res.status(500).json({ error: "Error al verificar disponibilidad" });
      
      if (reservaExistente) {
        const tipoTexto = tipo === 'mesa' ? 'mesa' : 'computadora';
        return res.status(400).json({ 
          error: `Ya hay una reserva para ${tipoTexto} el ${fecha} a las ${hora}.`
        });
      }
      
      db.run("INSERT INTO reservas (usuario_id, tipo, personas, fecha, hora) VALUES (?, ?, ?, ?, ?)", 
        [userRow.id, tipo, personas, fecha, hora], function(err) {
        if (err) return res.status(500).json({ error: "Error al crear reserva" });
        res.json({ success: true, reservaId: this.lastID });
      });
    });
  });
});

app.get("/verificar-disponibilidad", (req, res) => {
  const { tipo, fecha, hora } = req.query;
  
  if (!tipo || !fecha || !hora) {
    return res.status(400).json({ error: "Faltan parámetros requeridos" });
  }
  
  db.get("SELECT * FROM reservas WHERE tipo = ? AND fecha = ? AND hora = ?", 
    [tipo, fecha, hora], (err, reservaExistente) => {
    if (err) return res.status(500).json({ error: "Error al verificar disponibilidad" });
    
    res.json({ 
      disponible: !reservaExistente,
      mensaje: reservaExistente ? `No disponible` : 'Disponible'
    });
  });
});

app.get("/horarios-ocupados/:fecha", (req, res) => {
  const fecha = req.params.fecha;
  
  db.all("SELECT tipo, hora FROM reservas WHERE fecha = ?", [fecha], (err, reservas) => {
    if (err) return res.status(500).json({ error: "Error al obtener horarios ocupados" });
    
    const horariosOcupados = {
      mesa: reservas.filter(r => r.tipo === 'mesa').map(r => r.hora),
      pc: reservas.filter(r => r.tipo === 'pc').map(r => r.hora)
    };
    
    res.json(horariosOcupados);
  });
});

app.get("/reservas/:email", (req, res) => {
  const email = req.params.email;
  
  db.all(`SELECT r.* FROM reservas r JOIN users u ON r.usuario_id = u.id WHERE u.email = ?`, 
    [email], (err, rows) => {
    if (err) return res.status(500).json({ error: "Error al obtener reservas" });
    res.json(rows);
  });
});

// ----------------- Alquileres -----------------
app.post("/alquileres", (req, res) => {
  const { idLibro, usuario, fechaDev } = req.body;
  
  db.get("SELECT id FROM users WHERE email = ?", [usuario], (err, userRow) => {
    if (err || !userRow) return res.status(400).json({ error: "Usuario no válido" });
    
    db.get("SELECT copias FROM libros WHERE id = ?", [idLibro], (err, libroRow) => {
      if (err || !libroRow) return res.status(400).json({ error: "Libro no válido" });
      
      if (libroRow.copias < 1) {
        return res.status(400).json({ error: "No hay copias disponibles" });
      }
      
      db.run("INSERT INTO alquileres (usuario_id, libro_id, fecha_devolucion) VALUES (?, ?, ?)", 
        [userRow.id, idLibro, fechaDev], function(err) {
        if (err) return res.status(500).json({ error: "Error al registrar alquiler" });
        
        db.run("UPDATE libros SET copias = copias - 1 WHERE id = ?", [idLibro]);
        res.json({ success: true, alquilerId: this.lastID });
      });
    });
  });
});

app.get("/alquileres/:email", (req, res) => {
  const email = req.params.email;
  
  db.all(`SELECT a.*, l.titulo, l.autor, l.img FROM alquileres a 
          JOIN users u ON a.usuario_id = u.id 
          JOIN libros l ON a.libro_id = l.id
          WHERE u.email = ? ORDER BY a.fecha_alquiler DESC`, 
    [email], (err, rows) => {
    if (err) return res.status(500).json({ error: "Error al obtener alquileres" });
    
    const alquileresFormateados = rows.map(row => ({
      id: row.id,
      libro_id: row.libro_id,
      titulo: row.titulo || "Sin título",
      autor: row.autor || "Autor desconocido",
      fecha_alquiler: row.fecha_alquiler,
      fecha_devolucion: row.fecha_devolucion,
      devuelto: row.devuelto === 1
    }));
    
    res.json(alquileresFormateados);
  });
});

// ----------------- Calificaciones -----------------
app.get("/calificacion/:libroId", (req, res) => {
  const libroId = req.params.libroId;
  const usuarioEmail = req.query.usuario;

  if (!usuarioEmail) return res.status(400).json({ error: "Se requiere el email del usuario" });

  db.get("SELECT id FROM users WHERE email = ?", [usuarioEmail], (err, userRow) => {
    if (err || !userRow) return res.status(400).json({ error: "Usuario no válido" });

    db.get("SELECT * FROM calificaciones WHERE usuario_id = ? AND libro_id = ?", 
      [userRow.id, libroId], (err, calRow) => {
      if (err) return res.status(500).json({ error: "Error en la base de datos" });
      res.json(calRow || {});
    });
  });
});

app.post("/calificacion", (req, res) => {
  const { libroId, usuario, calificacion, comentario } = req.body;

  if (!libroId || !usuario || !calificacion) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  db.get("SELECT id FROM users WHERE email = ?", [usuario], (err, userRow) => {
    if (err || !userRow) return res.status(400).json({ error: "Usuario no válido" });

    db.get("SELECT * FROM alquileres WHERE usuario_id = ? AND libro_id = ?", 
      [userRow.id, libroId], (err, alquilerRow) => {
      if (err) return res.status(500).json({ error: "Error en la base de datos" });
      if (!alquilerRow) return res.status(400).json({ error: "No puedes calificar un libro que no has alquilado" });

      db.run("INSERT OR REPLACE INTO calificaciones (usuario_id, libro_id, calificacion, comentario) VALUES (?, ?, ?, ?)",
        [userRow.id, libroId, calificacion, comentario], function(err) {
        if (err) return res.status(500).json({ error: "Error al guardar la calificación" });
        res.json({ success: true, calificacionId: this.lastID });
      });
    });
  });
});

// ----------------- Calificaciones: listado por libro -----------------
app.get("/calificaciones/libro/:id", (req, res) => {
  const libroId = req.params.id;

  db.all(
    `SELECT c.id, c.calificacion, c.comentario, c.created_at, u.nombre
     FROM calificaciones c
     JOIN users u ON c.usuario_id = u.id
     WHERE c.libro_id = ?`,
    [libroId],
    (err, rows) => {
      if (err) {
        console.error("❌ Error obteniendo calificaciones:", err);
        return res.status(500).json({ error: "Error en la base de datos" });
      }

      if (!rows || rows.length === 0) {
        return res.json({ reseñas: [], promedio: 0 });
      }

      const promedio = (
        rows.reduce((acc, r) => acc + r.calificacion, 0) / rows.length
      ).toFixed(1);

      res.json({ reseñas: rows, promedio });
    }
  );
});


// ----------------- Devoluciones -----------------
app.post("/devolver/:id", (req, res) => {
  const alquilerId = req.params.id;
  
  db.get("SELECT libro_id FROM alquileres WHERE id = ?", [alquilerId], (err, row) => {
    if (err || !row) return res.status(400).json({ error: "Alquiler no válido" });
    
    db.run("UPDATE alquileres SET devuelto = TRUE WHERE id = ?", [alquilerId], function(err) {
      if (err) return res.status(500).json({ error: "Error al registrar devolución" });
      
      db.run("UPDATE libros SET copias = copias + 1 WHERE id = ?", [row.libro_id]);
      res.json({ success: true });
    });
  });
});

// ----------------- Reseñas -----------------
app.get("/libros/:id/reseñas", (req, res) => {
  const { id } = req.params;
  db.all(
    `SELECT c.id, c.calificacion, c.comentario, c.created_at, u.nombre as usuario 
     FROM calificaciones c 
     JOIN users u ON c.usuario_id = u.id 
     WHERE c.libro_id = ? 
     ORDER BY c.created_at DESC`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Error al obtener reseñas" });
      res.json(rows);
    }
  );
});

app.post("/libros/:id/reseñas", (req, res) => {
  const { id } = req.params;
  const { usuario_id, calificacion, comentario } = req.body;

  db.run(
    "INSERT INTO calificaciones (usuario_id, libro_id, calificacion, comentario) VALUES (?, ?, ?, ?)",
    [usuario_id, id, calificacion, comentario],
    function (err) {
      if (err) return res.status(500).json({ error: "Error al guardar la reseña" });
      res.json({ message: "Reseña guardada con éxito", id: this.lastID });
    }
  );
});

// ----------------- Start -----------------
app.listen(3000, () => console.log("✅ Backend + Frontend en http://localhost:3000"));
