// app.js
const API_URL = "http://localhost:3000";
let session = JSON.parse(localStorage.getItem("session")) || null;
let libroSeleccionado = null;
let calificacionSeleccionada = 0;

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
    renderMisAlquileres();
  } else if (id === "reservas") {
    renderMisReservas();
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
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    
    let lista = await res.json();
    if (filtroGenero && filtroGenero !== "todos") {
      lista = lista.filter(l => l.genero === filtroGenero);
    }

    const div = document.getElementById("listaLibros");
    div.innerHTML = lista.length > 0 ? lista.map(b => {
      const disponible = b.copias > 0 ? "Disponible" : "No disponible";
      return `<div class="card" onclick="verDetalleLibro(${b.id})">
                <img src="${b.img}" alt="${b.titulo}" onerror="this.src='https://via.placeholder.com/150x200?text=Imagen+no+disponible'">
                <h4>${b.titulo}</h4>
                <p>${b.autor}</p>
                <span class="${b.copias > 0 ? 'disponible' : 'no-disponible'}">${disponible}</span>
              </div>`;
    }).join("") : "<p>No hay libros disponibles en este momento.</p>";
  } catch (error) {
    console.error("Error al cargar libros:", error);
    document.getElementById("listaLibros").innerHTML = "<p>Error al cargar los libros. Intenta nuevamente.</p>";
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
    let botonAlquilar = disponible ? 
      `<button onclick="prepararAlquiler(${libro.id})">Alquilar</button>` :
      `<button disabled>No disponible</button>`;
    
    if (session) {
      try {
        const resCalificacion = await fetch(`${API_URL}/calificacion/${libro.id}?usuario=${session.email}`);
        const calificacion = await resCalificacion.json();
        
        let botonCalificar = '';
        if (calificacion && calificacion.calificacion) {
          botonCalificar = `<div>Tu calificación: ${calificacion.calificacion} estrellas</div>`;
        } else {
          const resAlquiler = await fetch(`${API_URL}/alquileres/${session.email}`);
          const alquileres = await resAlquiler.json();
          const haAlquilado = alquileres.some(a => a.libro_id == libro.id);
          
          if (haAlquilado) {
            botonCalificar = `<button onclick="abrirModalCalificacion(${libro.id})">Mi opinión</button>`;
          }
        }
        
        document.getElementById("detalleAcciones").innerHTML = botonAlquilar + botonCalificar;
      } catch (error) {
        console.error("Error al verificar calificación:", error);
        document.getElementById("detalleAcciones").innerHTML = botonAlquilar;
      }
    } else {
      document.getElementById("detalleAcciones").innerHTML = botonAlquilar;
    }
    
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

// ----------------- Calificaciones -----------------
function abrirModalCalificacion(libroId) {
  document.getElementById("calificacionLibroId").value = libroId;
  document.getElementById("comentarioCalificacion").value = '';
  calificacionSeleccionada = 0;
  resetEstrellas();
  document.getElementById("modalCalificacion").classList.remove("oculto");
}

function cerrarModalCalificacion() {
  document.getElementById("modalCalificacion").classList.add("oculto");
}

function resetEstrellas() {
  const estrellas = document.querySelectorAll('.estrella');
  estrellas.forEach(star => star.classList.remove('activa'));
  document.getElementById("textoCalificacion").textContent = "Selecciona una calificación";
}

// Inicializar eventos de estrellas
function inicializarEstrellas() {
  document.querySelectorAll('.estrella').forEach(star => {
    star.addEventListener('click', () => {
      const value = parseInt(star.getAttribute('data-value'));
      calificacionSeleccionada = value;
      resetEstrellas();
      
      document.querySelectorAll('.estrella').forEach(s => {
        if (parseInt(s.getAttribute('data-value')) <= value) {
          s.classList.add('activa');
        }
      });
      
      const ratings = ["", "Muy malo", "Regular", "Bueno", "Muy bueno", "Excelente"];
      document.getElementById("textoCalificacion").textContent = 
        `${ratings[value]} (${value} estrellas)`;
    });
  });
}

// Enviar calificación
document.getElementById("formCalificacion").addEventListener("submit", async e => {
  e.preventDefault();
  if (!session) {
    alert("Debes iniciar sesión");
    return;
  }
  
  const libroId = document.getElementById("calificacionLibroId").value;
  const comentario = document.getElementById("comentarioCalificacion").value;
  
  if (calificacionSeleccionada === 0) {
    alert("Selecciona una calificación");
    return;
  }
  
  try {
    const res = await fetch(`${API_URL}/calificacion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        libroId,
        usuario: session.email,
        calificacion: calificacionSeleccionada,
        comentario
      })
    });
    
    const data = await res.json();
    
    if (data.success) {
      alert("✅ Calificación enviada");
      cerrarModalCalificacion();
      verDetalleLibro(libroId);
    } else {
      alert(data.error || "Error al enviar la calificación");
    }
  } catch (error) {
    alert("Error de conexión");
  }
});

// ----------------- RESERVAS CON VALIDACIÓN DE DISPONIBILIDAD -----------------

// **NUEVA FUNCIÓN: Verificar disponibilidad en tiempo real**
async function verificarDisponibilidad() {
  const tipo = document.getElementById("tipoReserva").value;
  const fecha = document.getElementById("fechaReserva").value;
  const hora = document.getElementById("horaReserva").value;
  
  if (!fecha || !hora) return;
  
  const messageDiv = document.getElementById("mensajeDisponibilidad");
  if (!messageDiv) {
    // Crear div para mostrar mensajes si no existe
    const div = document.createElement("div");
    div.id = "mensajeDisponibilidad";
    div.style.marginTop = "10px";
    div.style.padding = "10px";
    div.style.borderRadius = "5px";
    div.style.fontWeight = "bold";
    document.getElementById("formReserva").appendChild(div);
  }
  
  try {
    const res = await fetch(`${API_URL}/verificar-disponibilidad?tipo=${tipo}&fecha=${fecha}&hora=${hora}`);
    const data = await res.json();
    
    const msgDiv = document.getElementById("mensajeDisponibilidad");
    if (data.disponible) {
      msgDiv.textContent = "✅ Disponible";
      msgDiv.style.backgroundColor = "#d4edda";
      msgDiv.style.color = "#155724";
      msgDiv.style.display = "block";
    } else {
      msgDiv.textContent = `❌ ${data.mensaje}`;
      msgDiv.style.backgroundColor = "#f8d7da";
      msgDiv.style.color = "#721c24";
      msgDiv.style.display = "block";
    }
  } catch (error) {
    console.error("Error al verificar disponibilidad:", error);
  }
}

// **NUEVA FUNCIÓN: Mostrar horarios ocupados para una fecha**
async function mostrarHorariosOcupados() {
  const fecha = document.getElementById("fechaReserva").value;
  if (!fecha) return;
  
  try {
    const res = await fetch(`${API_URL}/horarios-ocupados/${fecha}`);
    const horarios = await res.json();
    
    console.log("Horarios ocupados para", fecha, ":", horarios);
    
    // Mostrar info visual (opcional)
    const infoDiv = document.getElementById("infoHorarios");
    if (infoDiv) {
      const mesasOcupadas = horarios.mesa.length > 0 ? `Mesas ocupadas: ${horarios.mesa.join(', ')}` : '';
      const pcsOcupadas = horarios.pc.length > 0 ? `PCs ocupadas: ${horarios.pc.join(', ')}` : '';
      infoDiv.innerHTML = `<p style="font-size: 0.9em; color: #666;">${mesasOcupadas} ${pcsOcupadas}</p>`;
    }
  } catch (error) {
    console.error("Error al obtener horarios ocupados:", error);
  }
}

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
      // Limpiar mensaje de disponibilidad
      const msgDiv = document.getElementById("mensajeDisponibilidad");
      if (msgDiv) msgDiv.style.display = "none";
      renderMisReservas();
    } else {
      alert(data.error || "Error al registrar la reserva");
    }
  } catch (error) {
    alert("Error de conexión");
  }
});

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
async function renderHistorial() {
  if (!session) {
    document.getElementById("historialReservas").innerHTML = "<p>Inicia sesión para ver tu historial</p>";
    document.getElementById("historialLibros").innerHTML = "";
    return;
  }
  
  try {
    await renderHistorialReservas();
    await renderHistorialAlquileres();
  } catch (error) {
    console.error("Error al cargar el historial:", error);
  }
}

async function renderHistorialReservas() {
  const div = document.getElementById("historialReservas");
  if (!div || !session) return;

  try {
    const res = await fetch(`${API_URL}/reservas/${session.email}`);
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    
    const reservas = await res.json();
    const hoy = new Date().toISOString().split('T')[0];
    
    div.innerHTML = "<h3>Historial de Reservas</h3>" + 
      (reservas.length > 0 ? reservas.map(r => `
        <div class="card ${r.fecha < hoy ? 'pasada' : ''}">
          <h4>${r.tipo === 'mesa' ? 'Mesa' : 'Computadora'}</h4>
          <p>Personas: ${r.personas}</p>
          <p>Fecha: ${r.fecha} ${r.hora}</p>
          <p>Estado: ${r.fecha < hoy ? 'Completada' : 'Pendiente'}</p>
        </div>
      `).join("") : "<p>No tienes reservas en tu historial.</p>");
  } catch (error) {
    console.error("Error al cargar historial de reservas:", error);
    div.innerHTML = "<p>Error al cargar el historial de reservas. Intenta nuevamente.</p>";
  }
}

async function renderHistorialAlquileres() {
  const div = document.getElementById("historialLibros");
  if (!div || !session) return;

  try {
    const res = await fetch(`${API_URL}/alquileres/${session.email}`);
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    
    const alquileres = await res.json();
    
    div.innerHTML = "<h3>Historial de Alquileres</h3>" + 
      (alquileres.length > 0 ? alquileres.map(a => `
        <div class="card">
          <h4>${a.titulo}</h4>
          <p>Autor: ${a.autor}</p>
          <p>Fecha de alquiler: ${new Date(a.fecha_alquiler).toLocaleDateString()}</p>
          <p>Fecha de devolución: ${a.fecha_devolucion}</p>
          <p>Estado: ${a.devuelto ? 'Devuelto' : 'En curso'}</p>
          ${!a.devuelto ? `<button onclick="devolverLibro(${a.id})">Devolver</button>` : ''}
        </div>
      `).join("") : "<p>No tienes alquileres en tu historial.</p>");
  } catch (error) {
    console.error("Error al cargar historial de alquileres:", error);
    div.innerHTML = "<p>Error al cargar el historial de alquileres. Intenta nuevamente.</p>";
  }
}

// ----------------- Carrusel -----------------
async function renderTopLibros() {
  try {
    const res = await fetch(`${API_URL}/libros`);
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    
    let lista = await res.json();
    const recomendados = [...lista].sort(() => 0.5 - Math.random()).slice(0, 4);

    const div = document.getElementById("carruselLibros");
    div.innerHTML = recomendados.map(b => `
      <div class="card">
        <img src="${b.img}" alt="${b.titulo}" onerror="this.src='https://via.placeholder.com/150x200?text=Imagen+no+disponible'">
        <h4>${b.titulo}</h4>
        <p>${b.autor}</p>
      </div>
    `).join("");
    
    setTimeout(() => {
      itemWidth = 0;
      if (recomendados.length > 0) moverCarrusel(0);
    }, 100);
  } catch (error) {
    console.error("Error al cargar libros del carrusel:", error);
    
    const div = document.getElementById("carruselLibros");
    div.innerHTML = `
      <div class="card"><img src="https://via.placeholder.com/150x200?text=Libro+1" alt="Libro 1"><h4>Cien años de soledad</h4><p>Gabriel García Márquez</p></div>
      <div class="card"><img src="https://via.placeholder.com/150x200?text=Libro+2" alt="Libro 2"><h4>Rayuela</h4><p>Julio Cortázar</p></div>
      <div class="card"><img src="https://via.placeholder.com/150x200?text=Libro+3" alt="Libro 3"><h4>1984</h4><p>George Orwell</p></div>
      <div class="card"><img src="https://via.placeholder.com/150x200?text=Libro+4" alt="Libro 4"><h4>El Principito</h4><p>Antoine de Saint-Exupéry</p></div>
    `;
  }
}

let posCarrusel = 0, itemWidth = 0;
function moverCarrusel(dir) {
  const track = document.getElementById("carruselLibros");
  if (!track || track.children.length === 0) {
    console.error("El carrusel no está disponible");
    return;
  }
  
  if (itemWidth === 0) {
    itemWidth = track.children[0].offsetWidth + 20;
  }
  
  const total = track.children.length;
  const visible = Math.min(4, total);
  const max = -(itemWidth * (total - visible));
  
  posCarrusel += dir * itemWidth;
  
  if (posCarrusel > 0) posCarrusel = 0;
  if (posCarrusel < max) posCarrusel = max;
  
  track.style.transform = `translateX(${posCarrusel}px)`;
}

async function devolverLibro(alquilerId) {
  if (!session) return alert("Debes iniciar sesión");

  try {
    const res = await fetch(`${API_URL}/devolver/${alquilerId}`, { method: "POST" });
    const data = await res.json();
    
    if (data.success) {
      alert("✅ Libro devuelto con éxito");
      renderMisAlquileres();
      if (seccionActual === "historial") renderHistorial();
      renderLibros();
    } else {
      alert(data.error || "Error al devolver el libro");
    }
  } catch (error) {
    alert("Error de conexión");
  }
}

// ----------------- Init -----------------
window.onload = async () => {
  console.log("Iniciando aplicación...");
  
  try {
    renderAuthButtons();
    inicializarEstrellas(); // Inicializar eventos de estrellas

    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById("fechaReserva").min = hoy;
    document.getElementById("fechaDevolucion").min = hoy;
    
    // **EVENTOS PARA VALIDACIÓN DE RESERVAS**
    // Verificar disponibilidad cuando cambie el tipo, fecha u hora
    document.getElementById("tipoReserva").addEventListener("change", verificarDisponibilidad);
    document.getElementById("fechaReserva").addEventListener("change", () => {
      mostrarHorariosOcupados();
      verificarDisponibilidad();
    });
    document.getElementById("horaReserva").addEventListener("change", verificarDisponibilidad);
    
    await Promise.all([renderTopLibros(), renderLibros()]);
    
    console.log("Datos cargados correctamente");
    
    setInterval(() => { 
      if (seccionActual === "home") moverCarrusel(1); 
    }, 4000);
  } catch (error) {
    console.error("Error en la inicialización:", error);
    alert("Hubo un error al cargar la aplicación. Por favor, recarga la página.");
  }
};