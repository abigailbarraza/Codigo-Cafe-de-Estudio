// database.js
import sqlite3 from 'sqlite3';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'database.sqlite');

// Crear conexión a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
  } else {
    console.log('Conectado a la base de datos SQLite.');
    initDatabase();
  }
});

// Inicializar tablas
function initDatabase() {
  // Tabla de usuarios
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabla de reservas
  db.run(`CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    personas INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(usuario_id) REFERENCES users(id)
  )`);

  // Tabla de alquileres
  db.run(`CREATE TABLE IF NOT EXISTS alquileres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    libro_id INTEGER NOT NULL,
    fecha_alquiler DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_devolucion TEXT NOT NULL,
    devuelto BOOLEAN DEFAULT FALSE,
    FOREIGN KEY(usuario_id) REFERENCES users(id)
  )`);

  // Tabla de libros (si no existe)
  db.run(`CREATE TABLE IF NOT EXISTS libros (
    id INTEGER PRIMARY KEY,
    titulo TEXT NOT NULL,
    autor TEXT NOT NULL,
    genero TEXT NOT NULL,
    copias INTEGER DEFAULT 1,
    img TEXT,
    sinopsis TEXT
  )`, () => {
    // Insertar libros si la tabla está vacía
    db.get("SELECT COUNT(*) as count FROM libros", (err, row) => {
      if (row && row.count === 0) {
        insertarLibrosIniciales();
      }
    });
  });
}

// Insertar libros iniciales
function insertarLibrosIniciales() {
const libros = [
  { id: 1, titulo: "Cien años de soledad", autor: "García Márquez", genero: "Realismo mágico", copias: 3, img: "https://images.cdn3.buscalibre.com/fit-in/360x360/50/a3/50a33f98323772d2c61aa4b5b2e9c9c4.jpg", sinopsis: "La historia de la familia Buendía en Macondo." },
  { id: 2, titulo: "Rayuela", autor: "Cortázar", genero: "Ficción", copias: 2, img: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Rayuela_JC.png", sinopsis: "Una novela innovadora que permite múltiples formas de lectura." },
  { id: 3, titulo: "Dune", autor: "Frank Herbert", genero: "Ciencia ficción", copias: 4, img: "https://images.cdn1.buscalibre.com/fit-in/360x360/e7/25/e725760e5c93acdeccf44903ff2fcb94.jpg", sinopsis: "La lucha por Arrakis." },
  { id: 4, titulo: "A todos los chicos de los que me enamoré", autor: "Jenny Han", genero: "Rom-Com", copias: 5, img: "https://www.planetadelibros.com.ar/usuaris/libros/fotos/289/original/portada_trilogia-a-todos-los-chicos-de-los-que-me-enamore-pack_jenny-han_201811051133.jpg", sinopsis: "Las cartas secretas de Lara Jean salen a la luz y cambian su vida." },
  { id: 5, titulo: "El verano en que me enamoré", autor: "Jenny Han", genero: "Rom-Com", copias: 3, img: "https://www.planetadelibros.com.ar/usuaris/libros/fotos/69/original/68091_portada_el-verano-en-que-me-enamore_jenny-han_202310231117.jpg", sinopsis: "Un verano que cambia todo para Belly y los hermanos Fisher." },
  { id: 6, titulo: "Tienes un email", autor: "Nora Ephron", genero: "Rom-Com", copias: 2, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQegCV4sunSNno6pqHCMWZ6Pr4TXXWhkZ7pCw&s", sinopsis: "Dos rivales comerciales descubren que son almas gemelas online." },
  { id: 7, titulo: "La hipótesis del amor", autor: "Ali Hazelwood", genero: "Rom-Com", copias: 6, img: "https://images.cdn2.buscalibre.com/fit-in/360x360/17/51/1751c3b138121d658d12617c581203d4.jpg", sinopsis: "Una comedia romántica ambientada en el mundo académico." },
  { id: 8, titulo: "People We Meet on Vacation", autor: "Emily Henry", genero: "Rom-Com", copias: 4, img: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1748450140i/54985743.jpg", sinopsis: "Dos mejores amigos viajan cada verano juntos hasta que algo cambia." },
  { id: 9, titulo: "Orgullo y Prejuicio", autor: "Jane Austen", genero:"Romance", copias: 4, img:"https://images.cdn2.buscalibre.com/fit-in/360x360/69/73/697367de2a03bc98c4cb963d35ae2af2.jpg",  sinopsis: "La historia de Elizabeth Bennet y el señor Darcy."},
  { id: 10,titulo:"IT", autor: "Stephen King", genero: "Terror", copias: 3, img:"https://images.cdn3.buscalibre.com/fit-in/360x360/df/43/df43923a18c57cfc02206ef54e50f192.jpg", sinopsis: "Un grupo de amigos enfrenta a un ser maligno."},
  { id: 11,titulo:"Dracula", autor: "Bram Stoker", genero: "Terror", copias: 5, img:"https://images.cdn1.buscalibre.com/fit-in/360x360/53/c4/53c4c47d539b4e352cb284b18e2c80f8.jpg", sinopsis: "El conde Drácula viaja desde Transilvania a Inglaterra." },
  { id: 12, titulo: "Romper El Circulo", autor: "Colleen Hoover", genero: "Rom-Com", copias: 6, img:"https://images.cdn3.buscalibre.com/fit-in/360x360/aa/c4/aac495a3ef1a84293a0e7771c26b5c4e.jpg", sinopsis: "Lily Bloom inicia una relación con Ryle."},
  { id: 13, titulo: "Cementerio de Animales", autor: "Stephen King", genero:"Terror", copias: 4, img:"https://images.cdn2.buscalibre.com/fit-in/360x360/95/5b/955be07d4a94383ea56271dc865e5e8c.jpg", sinopsis: "Un cementerio cercano puede devolver a los muertos."},
  { id: 14, titulo: "Los 7 Maridos de Evelyn Hugo", autor: "Taylor Jenkins Reid", genero:"Novela", copias: 5, img:"https://data.livriz.com/media/mediaspace/F9AFB48D-741D-4834-B760-F59344EEFF34/45/24f40356-528a-4173-97ac-8a3bdfa65b7d/9789871886265.jpg", sinopsis:"La vida de una actriz de Hollywood y sus siete matrimonios."},
  { id: 15, titulo: "Farsa de amor a la Española", autor: "Elena Armas", genero: "Rom-Com", copias: 5, img:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9U6uCRLhb1-B1TnCCUQBucIQP0wYwuAB5rw&s", sinopsis:"Historia de engaños, celos y malentendidos."},
  { id: 16, titulo: "Breve historia del tiempo", autor: "Stephen Hawking", genero: "Divulgación científica", copias: 7, img:"https://images.cdn3.buscalibre.com/fit-in/360x360/c1/d5/c1d562eb8d27c7af22c9f981f4de04f1.jpg", sinopsis:"Exploración accesible del universo." },
  { id: 17, titulo: "El principito", autor: "Antoine de Saint-Exupéry", genero: "Fábula / Filosofía", copias: 10, img:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRU5PQwXDXpGgK0gNYxoWznpLSRq_1t0V36yg&s", sinopsis:"Un piloto descubre a un pequeño príncipe." },
  { id: 18, titulo: "Sapiens", autor: "Yuval Noah Harari", genero: "Historia / Ensayo", copias: 6, img:"https://images.cdn2.buscalibre.com/fit-in/360x360/b5/1a/b51a9baa4e59e89a3578cb224e1f1d81.jpg", sinopsis:"Un recorrido por la historia de la humanidad." },
  { id: 19, titulo: "El código Da Vinci", autor: "Dan Brown", genero: "Thriller", copias: 8, img:"https://images.cdn2.buscalibre.com/fit-in/360x360/ef/0f/ef0fe302954a688d71d2a988393ad609.jpg", sinopsis:"Un profesor de simbología se ve envuelto en una conspiración." },
  { id: 20, titulo: "Los tres mosqueteros", autor: "Alexandre Dumas", genero: "Novela histórica", copias: 9, img:"https://images.cdn1.buscalibre.com/fit-in/360x360/e8/6f/e86fb513a9f3105184aa03bbf37d1b62.jpg", sinopsis:"Las aventuras de D’Artagnan junto a Athos, Porthos y Aramis." },
  { id: 21, titulo: "Crimen y castigo", autor: "Fiódor Dostoyevski", genero: "Novela psicológica", copias: 10, img:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRPS3alj4cSu901wxK6AOipyndGvucKeL77Kw&s", sinopsis:"Un estudiante lucha con su conciencia tras cometer un asesinato." },
  { id: 22, titulo: "La sombra del viento", autor: "Carlos Ruiz Zafón", genero: "Misterio", copias: 9, img:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3_DtGa0Kso98OMixPNlo0ZwV5NK9scEl1QQ&s", sinopsis:"Un joven descubre un libro maldito." },
  { id: 23, titulo: "El alquimista", autor: "Paulo Coelho", genero: "Ficción", copias: 18, img:"https://m.media-amazon.com/images/I/71aFt4+OTOL._AC_UF1000,1000_QL80_.jpg", sinopsis:"Un pastor viaja en busca de su leyenda personal." },
  { id: 24, titulo: "La Odisea", autor: "Homero", genero: "Épica", copias: 7, img:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5fcCStUAcpnQLrZL08Hh7Ii9s3SnF7Oa2ig&s", sinopsis:"El legendario viaje de Ulises de regreso a Ítaca." },
  { id: 25, titulo: "Matar a un ruiseñor", autor: "Harper Lee", genero: "Drama", copias: 8, img:"https://m.media-amazon.com/images/I/81gepf1eMqL._AC_UF1000,1000_QL80_.jpg", sinopsis:"Un retrato de la injusticia racial en EE.UU." },
  { id: 26, titulo: "El hobbit", autor: "J.R.R. Tolkien", genero: "Fantasía", copias: 16, img:"https://m.media-amazon.com/images/I/91b0C2YNSrL._AC_UF1000,1000_QL80_.jpg", sinopsis:"Bilbo Bolsón se embarca en una aventura épica." }
];

  const stmt = db.prepare("INSERT INTO libros (id, titulo, autor, genero, copias, img, sinopsis) VALUES (?, ?, ?, ?, ?, ?, ?)");
  libros.forEach(libro => {
    stmt.run([libro.id, libro.titulo, libro.autor, libro.genero, libro.copias, libro.img, libro.sinopsis]);
  });
  stmt.finalize();
}

export default db;