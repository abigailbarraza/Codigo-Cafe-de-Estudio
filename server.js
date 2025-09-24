// server.js - Versión corregida
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import db from "./database.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Configuración de CORS mejorada
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------- Servir archivos estáticos -----------------
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(__dirname));

// Middleware para logging de requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ----------------- Ruta de test -----------------
app.get("/test", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Servidor funcionando correctamente",
    timestamp: new Date().toISOString()
  });
});

// ----------------- Usuarios -----------------
app.post("/register", async (req, res) => {
  const { nombre, email, password } = req.body;
  
  // Validaciones
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }
   
  try {
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, row) => {
      if (err) {
        console.error("Error en DB:", err);
        return res.status(500).json({ error: "Error en la base de datos" });
      }
      
      if (row) {
        return res.status(400).json({ error: "Usuario ya existe" });
      }
      
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run("INSERT INTO users (nombre, email, password) VALUES (?, ?, ?)", 
          [nombre, email, hashedPassword], function(err) {
          if (err) {
            console.error("Error insertando usuario:", err);
            return res.status(500).json({ error: "Error al registrar usuario" });
          }
          
          console.log(`Usuario registrado: ${email}`);
          res.json({ 
            success: true, 
            message: "Registrado con éxito", 
            user: { id: this.lastID, nombre, email } 
          });
        });
      } catch (hashError) {
        console.error("Error hasheando contraseña:", hashError);
        return res.status(500).json({ error: "Error procesando contraseña" });
      }
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  
  // Validaciones
  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña son requeridos" });
  }
  
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, row) => {
    if (err) {
      console.error("Error en DB:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }
    
    if (!row) {
      return res.status(400).json({ error: "Credenciales incorrectas" });
    }
    
    try {
      const match = await bcrypt.compare(password, row.password);
      if (match) {
        console.log(`Usuario logueado: ${email}`);
        res.json({ 
          success: true, 
          user: { id: row.id, nombre: row.nombre, email: row.email } 
        });
      } else {
        res.status(400).json({ error: "Credenciales incorrectas" });
      }
    } catch (error) {
      console.error("Error comparando contraseña:", error);
      res.status(500).json({ error: "Error del servidor" });
    }
  });
});

// ----------------- Libros -----------------
app.get("/libros", (req, res) => {
  db.all("SELECT * FROM libros ORDER BY titulo", (err, rows) => {
    if (err) {
      console.error("Error obteniendo libros:", err);
      return res.status(500).json({ error: "Error al obtener libros" });
    }
    res.json(rows);
  });
});

app.get("/libros/:id", (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: "ID de libro inválido" });
  }
  
  db.get("SELECT * FROM libros WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error("Error obteniendo libro:", err);
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
  
  // Validaciones
  if (!tipo || !personas || !fecha || !hora || !usuario) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }
  
  if (!['mesa', 'pc'].includes(tipo)) {
    return res.status(400).json({ error: "Tipo de reserva inválido" });
  }
  
  db.get("SELECT id FROM users WHERE email = ?", [usuario], (err, userRow) => {
    if (err) {
      console.error("Error buscando usuario:", err);
      return res.status(500).json({ error: "Error en la base de datos" });
    }
    
    if (!userRow) {
      return res.status(400).json({ error: "Usuario no válido" });
    }
    
    db.get("SELECT * FROM reservas WHERE tipo = ? AND fecha = ? AND hora = ?", 
      [tipo, fecha, hora], (err, reservaExistente) => {
      if (err) {
        console.error("Error verificando disponibilidad:", err);
        return res.status(500).json({ error: "Error al verificar disponibilidad" });
      }
      
      if (reservaExistente) {
        const tipoTexto = tipo === 'mesa' ? 'mesa' : 'computadora';
        return res.status(400).json({ 
          error: `Ya hay una reserva para ${tipoTexto} el ${fecha} a las ${hora}.`
        });
      }
      
      db.run("INSERT INTO reservas (usuario_id, tipo, personas, fecha, hora) VALUES (?, ?, ?, ?, ?)", 
        [userRow.id, tipo, personas, fecha, hora], function(err) {
        if (err) {
          console.error("Error creando reserva:", err);
          return res.status(500).json({ error: "Error al crear reserva" });
        }
        
        console.log(`Reserva creada: ${tipo} para ${usuario} el ${fecha} a las ${hora}`);
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
  
  if (!['mesa', 'pc'].includes(tipo)) {
    return res.status(400).json({ error: "Tipo inválido" });
  }
  
  db.get("SELECT * FROM reservas WHERE tipo = ? AND fecha = ? AND hora = ?", 
    [tipo, fecha, hora], (err, reservaExistente) => {
    if (err) {
      console.error("Error verificando disponibilidad:", err);
      return res.status(500).json({ error: "Error al verificar disponibilidad" });
    }
    
    res.json({ 
      disponible: !reservaExistente,
      mensaje: reservaExistente ? `No disponible` : 'Disponible'
    });
  });
});

app.get("/horarios-ocupados/:fecha", (req, res) => {
  const fecha = req.params.fecha;
  
  if (!fecha) {
    return res.status(400).json({ error: "Fecha requerida" });
  }
  
  db.all("SELECT tipo, hora FROM reservas WHERE fecha = ?", [fecha], (err, reservas) => {
    if (err) {
      console.error("Error obteniendo horarios ocupados:", err);
      return res.status(500).json({ error: "Error al obtener horarios ocupados" });
    }
    
    const horariosOcupados = {
      mesa: reservas.filter(r => r.tipo === 'mesa').map(r => r.hora),
      pc: reservas.filter(r => r.tipo === 'pc').map(r => r.hora)
    };
    
    res.json(horariosOcupados);
  });
});

app.get("/reservas/:email", (req, res) => {
  const email = req.params.email;
  
  if (!email) {
    return res.status(400).json({ error: "Email requerido" });
  }
  
  db.all(`SELECT r.* FROM reservas r 
          JOIN users u ON r.usuario_id = u.id 
          WHERE u.email = ? 
          ORDER BY r.fecha DESC, r.hora DESC`, 
    [email], (err, rows) => {
    if (err) {
      console.error("Error obteniendo reservas:", err);
      return res.status(500).json({ error: "Error al obtener reservas" });
    }
    res.json(rows);
  });
});

// ----------------- Alquileres