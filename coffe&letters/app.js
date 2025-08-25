// ---------------- Datos iniciales ----------------
let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
let session = JSON.parse(localStorage.getItem("session")) || null;
let reservas = JSON.parse(localStorage.getItem("reservas")) || [];
let alquileres = JSON.parse(localStorage.getItem("alquileres")) || [];

const menu = [
  { nombre: "Espresso", categoria: "Cafés", precio: 1800, img: "https://via.placeholder.com/300x200" },
  { nombre: "Capuccino", categoria: "Cafés", precio: 2400, img: "https://via.placeholder.com/300x200" },
  { nombre: "Limonada", categoria: "Bebidas", precio: 2000, img: "https://via.placeholder.com/300x200" },
  { nombre: "Tostado Jamón & Queso", categoria: "Comidas", precio: 3500, img: "https://via.placeholder.com/300x200" },
  { nombre: "Combo Desayuno", categoria: "Combos", precio: 5200, img: "https://via.placeholder.com/300x200" }
];

const libros = [
  { id: 1, titulo: "Cien años de soledad", autor: "García Márquez", genero: "Realismo mágico", copias: 3, img: "https://via.placeholder.com/300x200" },
  { id: 2, titulo: "Rayuela", autor: "Cortázar", genero: "Ficción", copias: 2, img: "https://via.placeholder.com/300x200" },
  { id: 3, titulo: "Dune", autor: "Frank Herbert", genero: "Ciencia ficción", copias: 4, img: "https://via.placeholder.com/300x200" }
];

// ---------------- Navegación ----------------
function mostrarSeccion(id) {
  document.querySelectorAll(".seccion").forEach(s => s.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");
}

// ---------------- Autenticación ----------------
function renderAuthButtons() {
  const div = document.getElementById("authButtons");
  if (session) {
    div.innerHTML = `<span>Hola, ${session.nombre}</span>
      <button onclick="logout()">Salir</button>`;
  } else {
    div.innerHTML = `<button onclick="abrirModal('login')">Iniciar sesión</button>
      <button onclick="abrirModal('registro')">Registrarse</button>`;
  }
}

function abrirModal(tipo) {
  document.getElementById("modalAuth").classList.remove("oculto");
  document.getElementById("tituloModal").textContent = tipo === "login" ? "Iniciar sesión" : "Registrarse";
  document.getElementById("nombre").style.display = tipo === "login" ? "none" : "block";
  document.getElementById("btnAuth").onclick = (e) => {
    e.preventDefault();
    tipo === "login" ? login() : registro();
  };
}
function cerrarModal() { document.getElementById("modalAuth").classList.add("oculto"); }

function registro() {
  const nombre = document.getElementById("nombre").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  if (usuarios.some(u => u.email === email)) return alert("Ese correo ya está registrado");
  const nuevo = { nombre, email, password };
  usuarios.push(nuevo);
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
  session = nuevo; localStorage.setItem("session", JSON.stringify(session));
  cerrarModal(); renderAuthButtons();
}
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const user = usuarios.find(u => u.email === email && u.password === password);
  if (!user) return alert("Credenciales inválidas");
  session = user; localStorage.setItem("session", JSON.stringify(session));
  cerrarModal(); renderAuthButtons();
}
function logout() { session = null; localStorage.removeItem("session"); renderAuthButtons(); }

// ---------------- Menú ----------------
function renderMenu() {
  const div = document.getElementById("listaMenu");
  div.innerHTML = menu.map(p => `
    <div class="card">
      <img src="${p.img}" alt="${p.nombre}">
      <h4>${p.nombre}</h4>
      <p>${p.categoria}</p>
      <strong>$${p.precio}</strong>
    </div>`).join("");
}

// ---------------- Reservas ----------------
document.getElementById("formReserva").addEventListener("submit", e => {
  e.preventDefault();
  if (!session) return alert("Iniciá sesión para reservar");
  const tipo = document.getElementById("tipoReserva").value;
  const fecha = document.getElementById("fechaReserva").value;
  const hora = document.getElementById("horaReserva").value;
  const personas = document.getElementById("personas").value;
  const nueva = { tipo, fecha, hora, personas, usuario: session.email };
  reservas.push(nueva); localStorage.setItem("reservas", JSON.stringify(reservas));
  renderReservas();
});
function renderReservas() {
  const div = document.getElementById("misReservas");
  const mias = reservas.filter(r => r.usuario === session?.email);
  div.innerHTML = mias.map(r => `<div class="card">${r.tipo} para ${r.personas} - ${r.fecha} ${r.hora}</div>`).join("") || "No tenés reservas.";
}

// ---------------- Libros ----------------
function renderLibros() {
  const div = document.getElementById("listaLibros");
  div.innerHTML = libros.map(b => {
    const activos = alquileres.filter(a => a.idLibro === b.id && !a.devuelto).length;
    const disponibles = b.copias - activos;
    return `<div class="card">
      <img src="${b.img}" alt="${b.titulo}">
      <h4>${b.titulo}</h4>
      <p>${b.autor} · ${b.genero}</p>
      <strong>${disponibles > 0 ? disponibles + " disponibles" : "No disponible"}</strong>
      ${session && disponibles > 0 ? `<button onclick="alquilar(${b.id})">Alquilar</button>` : ""}
    </div>`;
  }).join("");
}
function alquilar(idLibro) {
  if (!session) return alert("Iniciá sesión para alquilar");
  alquileres.push({ idLibro, usuario: session.email, devuelto: false });
  localStorage.setItem("alquileres", JSON.stringify(alquileres));
  renderLibros(); renderMisAlquileres();
}
function renderMisAlquileres() {
  const div = document.getElementById("misAlquileres");
  const mios = alquileres.filter(a => a.usuario === session?.email);
  div.innerHTML = mios.map(a => {
    const libro = libros.find(l => l.id === a.idLibro);
    return `<div class="card">${libro.titulo} - ${a.devuelto ? "Devuelto" : "En curso"} 
      ${!a.devuelto ? `<button onclick="devolver(${a.idLibro})">Devolver</button>` : ""}</div>`;
  }).join("") || "No alquilaste libros.";
}
function devolver(idLibro) {
  const a = alquileres.find(a => a.idLibro === idLibro && a.usuario === session.email && !a.devuelto);
  if (a) a.devuelto = true;
  localStorage.setItem("alquileres", JSON.stringify(alquileres));
  renderLibros(); renderMisAlquileres();
}

// ---------------- Historial ----------------
function renderHistorial() {
  const divR = document.getElementById("historialReservas");
  const divL = document.getElementById("historialLibros");
  const miasR = reservas.filter(r => r.usuario === session?.email);
  const miasL = alquileres.filter(a => a.usuario === session?.email);
  divR.innerHTML = "<h3>Reservas</h3>" + (miasR.map(r => `<div>${r.tipo} - ${r.fecha} ${r.hora}</div>`).join("") || "Sin historial");
  divL.innerHTML = "<h3>Alquileres</h3>" + (miasL.map(a => {
    const libro = libros.find(l => l.id === a.idLibro);
    return `<div>${libro.titulo} - ${a.devuelto ? "Devuelto" : "En curso"}</div>`;
  }).join("") || "Sin historial");
}

// ---------------- Inicializar ----------------
renderAuthButtons();
renderMenu();
renderLibros();
renderReservas();
renderMisAlquileres();
renderHistorial();
