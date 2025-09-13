// app.js
const API_URL = "http://localhost:3000";
let session = JSON.parse(localStorage.getItem("session")) || null;

// ----------------- Navegación -----------------
let seccionActual = "home";
function mostrarSeccion(id) {
  if (id === seccionActual) return;
  document.getElementById(seccionActual).classList.remove("activa");
  document.getElementById(seccionActual).style.display = "none";
  const target = document.getElementById(id);
  target.style.display = "block"; 
  setTimeout(() => target.classList.add("activa"), 10);
  seccionActual = id;
  
  // Cargar datos específicos de la sección
  if (id === "historial") {
    renderHistorial();
  } else if (id === "libros") {
    renderLibros();
    renderMisAlquileres(); // Para la sección de libros
  } else if (id === "reservas") {
    renderMisReservas(); // Para la sección de reservas
  }
}
// ----------------- Auth -----------------
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
  // Limpiar formulario
  document.getElementById("formAuth").reset();
}

function cerrarModal() { 
  document.getElementById("modalAuth").classList.add("oculto"); 
}

function logout(){ 
  session = null; 
  localStorage.removeItem("session"); 
  renderAuthButtons(); 
}

// ----------------- Login/Registro -----------------
document.getElementById("formAuth").addEventListener("submit", async e => {
  e.preventDefault();
  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const titulo = document.getElementById("tituloModal").textContent;

  const endpoint = titulo.includes("Registrarse") ? "/register" : "/login";
  
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, password })
    });
    
    const data = await res.json();
    
    if (data.success) {
      session = { id: data.user.id, nombre: data.user.nombre, email: data.user.email };
      localStorage.setItem("session", JSON.stringify(session));
      cerrarModal();
      renderAuthButtons();
      alert("¡Bienvenido " + session.nombre + "!");
    } else {
      alert(data.error || "Error desconocido");
    }
  } catch (error) {
    alert("Error de conexión");
  }
});

// ----------------- Libros -----------------
async function renderLibros(filtroGenero = null) {
  try {
    const res = await fetch(`${API_URL}/libros`);
    let lista = await res.json();

    if (filtroGenero && filtroGenero !== "todos") {
      lista = lista.filter(l => l.genero === filtroGenero);
    }

    const div = document.getElementById("listaLibros");
    div.innerHTML = lista.map(b => {
      const disponible = b.copias > 0 ? "Disponible" : "No disponible";
      return `<div class="card" onclick="verDetalleLibro(${b.id})">
                <img src="${b.img}">
                <h4>${b.titulo}</h4>
                <p>${b.autor}</p>
                <span class="${b.copias > 0 ? 'disponible' : 'no-disponible'}">${disponible}</span>
              </div>`;
    }).join("") || "<p>No hay libros en esta categoría.</p>";
  } catch (error) {
    console.error("Error al cargar libros:", error);
  }
}

async function verDetalleLibro(id) {
  try {
    const res = await fetch(`${API_URL}/libros/${id}`);
    const libro = await res.json();
    
    document.getElementById("detalleTitulo").textContent = libro.titulo;
    document.getElementById("detalleImg").src = libro.img;
    document.getElementById("detalleAutor").textContent = "Autor: " + libro.autor;
    document.getElementById("detalleGenero").textContent = "Género: " + libro.genero;
    document.getElementById("detalleSinopsis").textContent = libro.sinopsis;
    
    const disponible = libro.copias > 0;
    document.getElementById("detalleAcciones").innerHTML = disponible ? 
      `<button onclick="prepararAlquiler(${libro.id})">Alquilar</button>` :
      `<button disabled>No disponible</button>`;
    
    document.getElementById("modalLibro").classList.remove("oculto");
  } catch (error) {
    alert("Error al cargar detalles del libro");
  }
}

function cerrarModalLibro(){ 
  document.getElementById("modalLibro").classList.add("oculto"); 
}

function prepararAlquiler(idLibro) {
  if (!session) return alert("Debes iniciar sesión");
  libroSeleccionado = idLibro;
  document.getElementById("libroAlquiler").value = idLibro;
  document.getElementById("usuarioAlquiler").value = session.email;
  document.getElementById("modalAlquiler").classList.remove("oculto");
}

function cerrarModalAlquiler(){ 
  document.getElementById("modalAlquiler").classList.add("oculto"); 
}

// ----------------- Alquileres -----------------
document.getElementById("formAlquiler").addEventListener("submit", async e => {
  e.preventDefault();
  if (!session) return alert("Debes iniciar sesión");
  
  const fecha = document.getElementById("fechaDevolucion").value;
  if (!fecha) return alert("Selecciona una fecha de devolución");

  try {
    const res = await fetch(`${API_URL}/alquileres`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        idLibro: libroSeleccionado, 
        usuario: session.email, 
        fechaDev: fecha 
      })
    });
    
    const data = await res.json();
    
    if (data.success) {
      document.getElementById("msgAlquiler").innerText = "✅ Alquiler exitoso";
      setTimeout(() => {
        cerrarModalAlquiler();
        document.getElementById("msgAlquiler").innerText = "";
        // Actualizar lista de libros
        renderLibros();
      }, 1500);
    } else {
      alert(data.error || "Error al registrar el alquiler");
    }
  } catch (error) {
    alert("Error de conexión");
  }
});

async function renderMisAlquileres() {
  const div = document.getElementById("misAlquileres");
  if (!div || !session) return;

  try {
    const res = await fetch(`${API_URL}/alquileres/${session.email}`);
    const alquileres = await res.json();
    
    div.innerHTML = "<h3>Mis alquileres activos</h3>" + 
      (alquileres.filter(a => !a.devuelto).map(a => `
        <div class="card">
          <h4>${a.titulo}</h4>
          <p>Autor: ${a.autor}</p>
          <p>Fecha de devolución: ${a.fecha_devolucion}</p>
          <button onclick="devolverLibro(${a.id})">Devolver</button>
        </div>
      `).join("") || "<p>No tienes alquileres activos.</p>");
  } catch (error) {
    console.error("Error al cargar alquileres:", error);
  }
}

// Alquileres - ahora con parámetro opcional
async function renderMisAlquileres(elementId = 'misAlquileres') {
  const div = document.getElementById(elementId);
  if (!div || !session) return;

  try {
    const res = await fetch(`${API_URL}/alquileres/${session.email}`);
    const alquileres = await res.json();
    
    div.innerHTML = "<h3>Mis alquileres activos</h3>" + 
      (alquileres.filter(a => !a.devuelto).map(a => `
        <div class="card">
          <h4>${a.titulo}</h4>
          <p>Autor: ${a.autor}</p>
          <p>Fecha de devolución: ${a.fecha_devolucion}</p>
          <button onclick="devolverLibro(${a.id})">Devolver</button>
        </div>
      `).join("") || "<p>No tienes alquileres activos.</p>");
  } catch (error) {
    console.error("Error al cargar alquileres:", error);
  }
}

// ----------------- Reservas -----------------
document.getElementById("formReserva").addEventListener("submit", async e => {
  e.preventDefault();
  if (!session) return alert("Debes iniciar sesión");

  const tipo = document.getElementById("tipoReserva").value;
  const personas = document.getElementById("personas").value;
  const fecha = document.getElementById("fechaReserva").value;
  const hora = document.getElementById("horaReserva").value;
  
  if (!fecha || !hora) return alert("Completa fecha y hora");

  try {
    const res = await fetch(`${API_URL}/reservas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo, personas, fecha, hora, usuario: session.email })
    });
    
    const data = await res.json();
    
    if (data.success) {
      alert("✅ Reserva confirmada");
      document.getElementById("formReserva").reset();
    } else {
      alert(data.error || "Error al registrar la reserva");
    }
  } catch (error) {
    alert("Error de conexión");
  }
});

// Reservas - ahora con parámetro opcional
async function renderMisReservas(elementId = 'misReservas') {
  const div = document.getElementById(elementId);
  if (!div || !session) return;

  try {
    const res = await fetch(`${API_URL}/reservas/${session.email}`);
    const reservas = await res.json();
    
    const hoy = new Date().toISOString().split('T')[0];
    
    div.innerHTML = "<h3>Mis reservas</h3>" + 
      (reservas.map(r => `
        <div class="card ${r.fecha < hoy ? 'pasada' : ''}">
          <h4>${r.tipo === 'mesa' ? 'Mesa' : 'Computadora'}</h4>
          <p>Personas: ${r.personas}</p>
          <p>Fecha: ${r.fecha} ${r.hora}</p>
          <p>Estado: ${r.fecha < hoy ? 'Completada' : 'Pendiente'}</p>
        </div>
      `).join("") || "<p>No hiciste reservas.</p>");
  } catch (error) {
    console.error("Error al cargar reservas:", error);
  }
}

// ----------------- Historial -----------------
// ----------------- Historial -----------------
async function renderHistorial() {
  // Para reservas en la sección de historial
  await renderHistorialReservas();
  // Para alquileres en la sección de historial  
  await renderHistorialAlquileres();
}

// Función específica para reservas en el historial
async function renderHistorialReservas() {
  const div = document.getElementById("historialReservas");
  if (!div || !session) return;

  try {
    const res = await fetch(`${API_URL}/reservas/${session.email}`);
    const reservas = await res.json();
    
    const hoy = new Date().toISOString().split('T')[0];
    
    div.innerHTML = "<h3>Historial de Reservas</h3>" + 
      (reservas.map(r => `
        <div class="card ${r.fecha < hoy ? 'pasada' : ''}">
          <h4>${r.tipo === 'mesa' ? 'Mesa' : 'Computadora'}</h4>
          <p>Personas: ${r.personas}</p>
          <p>Fecha: ${r.fecha} ${r.hora}</p>
          <p>Estado: ${r.fecha < hoy ? 'Completada' : 'Pendiente'}</p>
        </div>
      `).join("") || "<p>No tienes reservas en tu historial.</p>");
  } catch (error) {
    console.error("Error al cargar historial de reservas:", error);
    div.innerHTML = "<p>Error al cargar el historial de reservas.</p>";
  }
}

// Función específica para alquileres en el historial
async function renderHistorialAlquileres() {
  const div = document.getElementById("historialLibros");
  if (!div || !session) return;

  try {
    const res = await fetch(`${API_URL}/alquileres/${session.email}`);
    const alquileres = await res.json();
    
    div.innerHTML = "<h3>Historial de Alquileres</h3>" + 
      (alquileres.map(a => `
        <div class="card">
          <h4>${a.titulo}</h4>
          <p>Autor: ${a.autor}</p>
          <p>Fecha de alquiler: ${new Date(a.fecha_alquiler).toLocaleDateString()}</p>
          <p>Fecha de devolución: ${a.fecha_devolucion}</p>
          <p>Estado: ${a.devuelto ? 'Devuelto' : 'En curso'}</p>
          ${!a.devuelto ? `<button onclick="devolverLibro(${a.id})">Devolver</button>` : ''}
        </div>
      `).join("") || "<p>No tienes alquileres en tu historial.</p>");
  } catch (error) {
    console.error("Error al cargar historial de alquileres:", error);
    div.innerHTML = "<p>Error al cargar el historial de alquileres.</p>";
  }
}
// ----------------- Carrusel -----------------
async function renderTopLibros() {
  try {
    const res = await fetch(`${API_URL}/libros`);
    let lista = await res.json();
    const recomendados = [...lista].sort(() => 0.5 - Math.random()).slice(0, 4);

    const div = document.getElementById("carruselLibros");
    div.innerHTML = recomendados.map(b =>
      `<div class="card"><img src="${b.img}"><h4>${b.titulo}</h4><p>${b.autor}</p></div>`
    ).join("");
  } catch (error) {
    console.error("Error al cargar libros del carrusel:", error);
  }
}

let posCarrusel = 0, itemWidth = 0;
function moverCarrusel(dir) {
  const track = document.getElementById("carruselLibros");
  if (!track || track.children.length === 0) return;
  if (itemWidth === 0) itemWidth = track.children[0].offsetWidth + 20;
  const total = track.children.length, visible = 4;
  const max = -(itemWidth * (total - visible));
  posCarrusel += dir * itemWidth;
  if (posCarrusel > 0) posCarrusel = 0;
  if (posCarrusel < max) posCarrusel = max;
  track.style.transform = `translateX(${posCarrusel}px)`;
}

// ----------------- Init -----------------
window.onload = () => {
  renderAuthButtons();
  renderTopLibros();
  renderLibros();
  
  // Configurar fecha mínima para reservas (hoy)
  const hoy = new Date().toISOString().split('T')[0];
  document.getElementById("fechaReserva").min = hoy;
  document.getElementById("fechaDevolucion").min = hoy;
  
  // Iniciar carrusel automático
  setInterval(() => { moverCarrusel(1); }, 4000);
};