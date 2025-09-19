// server.js
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import db from "./database.js";

const app = express();
app.use(cors());
app.use(express.json());

// ----------------- Usuarios -----------------
app.post("/register", async (req, res) => {
  const { nombre, email, password } = req.body;
   
  try {
    // Verificar si el usuario ya existe
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Error en la base de datos" });
      }
      if (row) {
        return res.status(400).json({ error: "Usuario ya existe" });
      }
      
      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insertar nuevo usuario
      db.run("INSERT INTO users (nombre, email, password) VALUES (?, ?, ?)", 
        [nombre, email, hashedPassword], function(err) {
        if (err) {
          return res.status(500).json({ error: "Error al registrar usuario" });
        }
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
  
  // Buscar usuario por email
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Error en la base de datos" });
    }
    if (!row) {
      return res.status(400).json({ error: "Credenciales incorrectas" });
    }
    
    // Verificar contraseña
    try {
      const match = await bcrypt.compare(password, row.password);
      if (match) {
        res.json({ 
          success: true, 
          user: { id: row.id, nombre: row.nombre, email: row.email } 
        });
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
    if (err) {
      return res.status(500).json({ error: "Error al obtener libros" });
    }
    res.json(rows);
  });
});

app.get("/libros/:id", (req, res) => {
  const id = parseInt(req.params.id);
  db.get("SELECT * FROM libros WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: "Error en la base de datos" });
    }
    if (!row) {
      return res.status(404).json({ error: "Libro no encontrado" });
    }
    res.json(row);
  });
});

// ----------------- Reservas -----------------
app.post("/reservas", (req, res) => {
  const { tipo, personas, fecha, hora, usuario } = req.body;
  
  // Obtener ID de usuario desde el email
  db.get("SELECT id FROM users WHERE email = ?", [usuario], (err, userRow) => {
    if (err || !userRow) {
      return res.status(400).json({ error: "Usuario no válido" });
    }
    
    db.run("INSERT INTO reservas (usuario_id, tipo, personas, fecha, hora) VALUES (?, ?, ?, ?, ?)", 
      [userRow.id, tipo, personas, fecha, hora], function(err) {
      if (err) {
        return res.status(500).json({ error: "Error al crear reserva" });
      }
      res.json({ success: true, reservaId: this.lastID });
    });
  });
});

app.get("/reservas/:email", (req, res) => {
  const email = req.params.email;
  
  db.all(`SELECT r.* FROM reservas r JOIN users u ON r.usuario_id = u.id WHERE u.email = ?`, 
    [email], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Error al obtener reservas" });
    }
    res.json(rows);
  });
});

// ----------------- Alquileres -----------------
app.post("/alquileres", (req, res) => {
  const { idLibro, usuario, fechaDev } = req.body;
  
  // Obtener ID de usuario desde el email
  db.get("SELECT id FROM users WHERE email = ?", [usuario], (err, userRow) => {
    if (err || !userRow) {
      return res.status(400).json({ error: "Usuario no válido" });
    }
    
    // Verificar disponibilidad del libro
    db.get("SELECT copias FROM libros WHERE id = ?", [idLibro], (err, libroRow) => {
      if (err || !libroRow) {
        return res.status(400).json({ error: "Libro no válido" });
      }
      
      if (libroRow.copias < 1) {
        return res.status(400).json({ error: "No hay copias disponibles" });
      }
      
      // Registrar alquiler
      db.run("INSERT INTO alquileres (usuario_id, libro_id, fecha_devolucion) VALUES (?, ?, ?)", 
        [userRow.id, idLibro, fechaDev], function(err) {
        if (err) {
          return res.status(500).json({ error: "Error al registrar alquiler" });
        }
        
        // Reducir el número de copias disponibles
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
    if (err) {
      console.error("Error en consulta de alquileres:", err);
      return res.status(500).json({ error: "Error al obtener alquileres" });
    }
    
    // Asegurar que todos los campos necesarios estén presentes
    const alquileresFormateados = rows.map(row => ({
      id: row.id,
      libro_id: row.libro_id,
      titulo: row.titulo || "Sin título",
      autor: row.autor || "Autor desconocido",
      fecha_alquiler: row.fecha_alquiler,
      fecha_devolucion: row.fecha_devolucion,
      devuelto: row.devuelto === 1 ? true : false
    }));
    
    res.json(alquileresFormateados);
  });
});

// ----------------- Calificaciones -----------------
// Obtener calificación del usuario actual para un libro
app.get("/calificacion/:libroId", (req, res) => {
  const libroId = req.params.libroId;
  const usuarioEmail = req.query.usuario;

  if (!usuarioEmail) {
    return res.status(400).json({ error: "Se requiere el email del usuario" });
  }

  // Obtener el ID del usuario a partir del email
  db.get("SELECT id FROM users WHERE email = ?", [usuarioEmail], (err, userRow) => {
    if (err || !userRow) {
      return res.status(400).json({ error: "Usuario no válido" });
    }

    // Buscar la calificación
    db.get("SELECT * FROM calificaciones WHERE usuario_id = ? AND libro_id = ?", 
      [userRow.id, libroId], (err, calRow) => {
      if (err) {
        return res.status(500).json({ error: "Error en la base de datos" });
      }
      res.json(calRow || {}); // Si no existe, devuelve un objeto vacío
    });
  });
});

// Guardar calificación
app.post("/calificacion", (req, res) => {
  const { libroId, usuario, calificacion, comentario } = req.body;

  if (!libroId || !usuario || !calificacion) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  // Obtener el ID del usuario a partir del email
  db.get("SELECT id FROM users WHERE email = ?", [usuario], (err, userRow) => {
    if (err || !userRow) {
      return res.status(400).json({ error: "Usuario no válido" });
    }

    // Verificar que el usuario ha alquilado este libro al menos una vez
    db.get("SELECT * FROM alquileres WHERE usuario_id = ? AND libro_id = ?", 
      [userRow.id, libroId], (err, alquilerRow) => {
      if (err) {
        return res.status(500).json({ error: "Error en la base de datos" });
      }
      if (!alquilerRow) {
        return res.status(400).json({ error: "No puedes calificar un libro que no has alquilado" });
      }

      // Insertar o actualizar la calificación (usamos INSERT OR REPLACE porque tenemos UNIQUE constraint)
      db.run("INSERT OR REPLACE INTO calificaciones (usuario_id, libro_id, calificacion, comentario) VALUES (?, ?, ?, ?)",
        [userRow.id, libroId, calificacion, comentario], function(err) {
        if (err) {
          console.error("Error al guardar calificación:", err);
          return res.status(500).json({ error: "Error al guardar la calificación" });
        }
        res.json({ success: true, calificacionId: this.lastID });
      });
    });
  });
});

// Devolver un libro
app.post("/devolver/:id", (req, res) => {
  const alquilerId = req.params.id;
  
  db.get("SELECT libro_id FROM alquileres WHERE id = ?", [alquilerId], (err, row) => {
    if (err || !row) {
      return res.status(400).json({ error: "Alquiler no válido" });
    }
    
    // Marcar como devuelto
    db.run("UPDATE alquileres SET devuelto = TRUE WHERE id = ?", [alquilerId], function(err) {
      if (err) {
        return res.status(500).json({ error: "Error al registrar devolución" });
      }
      
      // Aumentar el número de copias disponibles
      db.run("UPDATE libros SET copias = copias + 1 WHERE id = ?", [row.libro_id]);
      
      res.json({ success: true });
    });
  });
});

// ----------------- Start -----------------
app.listen(3000, () => console.log("✅ Backend corriendo en http://localhost:3000"));
