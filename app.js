// app.js
const API_URL = "http://localhost:3000";
let session = JSON.parse(localStorage.getItem("session")) || null;
let libroSeleccionado = null;
let calificacionSeleccionada = 0;
let seccionActual = "home";

// ----------------- Navegación -----------------
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
  if (!div) return;
  if (session) {
    div.innerHTML = `<span>Hola, ${session.nombre}</span>
                     <button onclick="logout()">Salir</button>`;
  } else {
    div.innerHTML = `<button onclick="abrirModalAuth('login')">Iniciar sesión</button>
                     <button onclick="abrirModalAuth('registro')">Registrarse</button>`;
  }
}

function abrirModalAuth(tipo) {
  const modal = document.getElementById("modalAuth");
  if (!modal) return;
  document.getElementById("tituloModal").textContent =
    tipo === "login" ? "Iniciar sesión" : "Registrarse";
  document.getElementById("formAuth").reset();
  modal.classList.remove("oculto");
}

function cerrarModalAuth() {
  const modal = document.getElementById("modalAuth");
  if (!modal) return;
  modal.classList.add("oculto");
}

function logout() {
  session = null;
  localStorage.removeItem("session");
  renderAuthButtons();
}

// ----------------- Login/Registro -----------------
document.addEventListener("DOMContentLoaded", () => {
  // Asegurarse de que el form exista antes de agregar listener
  const formAuth = document.getElementById("formAuth");
  if (formAuth) {
    formAuth.addEventListener("submit", async (e) => {
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
          body: JSON.stringify({ nombre, email, password }),
        });
        const data = await res.json();

        if (data.success) {
          session = { id: data.user.id, nombre: data.user.nombre, email: data.user.email };
          localStorage.setItem("session", JSON.stringify(session));
          cerrarModalAuth();
          renderAuthButtons();
          alert("¡Bienvenido " + session.nombre + "!");
          // actualizar vistas que dependan del usuario
          renderMisAlquileres();
          renderMisReservas();
        } else {
          alert(data.error || "Error desconocido");
        }
      } catch (error) {
        console.error("Error auth:", error);
        alert("Error de conexión");
      }
    });
  }
});

// ----------------- Libros -----------------
async function renderLibros(filtroGenero = null) {
  try {
    const res = await fetch(`${API_URL}/libros`);
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
    let lista = await res.json();

    // Generar tabs de géneros automáticamente
    const generos = Array.from(new Set(lista.map(l => l.genero))).sort();
    const filtrosDiv = document.getElementById("filtrosGeneros");
    if (filtrosDiv) {
      filtrosDiv.innerHTML = `<button class="tab-btn ${!filtroGenero || filtroGenero === 'todos' ? 'activo' : ''}" onclick="renderLibros('todos')">Todos</button>` +
        generos.map(g => `<button class="tab-btn ${filtroGenero === g ? 'activo' : ''}" onclick="renderLibros('${g.replace(/'/g, "\\'")}')">${g}</button>`).join("");
    }

    if (filtroGenero && filtroGenero !== "todos") {
      lista = lista.filter(l => l.genero === filtroGenero);
    }

    const div = document.getElementById("listaLibros");
    if (!div) return;

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
    const div = document.getElementById("listaLibros");
    if (div) div.innerHTML = "<p>Error al cargar los libros. Intenta nuevamente.</p>";
  }
}

// Mostrar detalle del libro en modal
async function verDetalleLibro(id) {
  try {
    const res = await fetch(`${API_URL}/libros/${id}`);
    if (!res.ok) throw new Error("Libro no encontrado");
    const libro = await res.json();

    document.getElementById("detalleTitulo").textContent = libro.titulo;
    document.getElementById("detalleImg").src = libro.img || '';
    document.getElementById("detalleAutor").textContent = "Autor: " + libro.autor;
    document.getElementById("detalleGenero").textContent = "Género: " + libro.genero;
    document.getElementById("detalleSinopsis").textContent = libro.sinopsis || "";

    const disponible = libro.copias > 0;
    let botonAlquilar = disponible ?
      `<button onclick="prepararAlquiler(${libro.id})">Alquilar</button>` :
      `<button disabled>No disponible</button>`;

    // Botón "Mi opinión" y "Ver reseñas"
    let botonMiOpinion = `<button onclick="abrirModalCalificacion(${libro.id})">Mi opinión</button>`;
    let botonVerResenas = `<button onclick="verTodasReseñas(${libro.id})">Ver reseñas</button>`;

    // Si está logueado, mostrar ambos botones; si no, el botón "Mi opinión" pedirá login.
    if (!session) {
      botonMiOpinion = `<button onclick="alert('Inicia sesión para dejar tu opinión')">Mi opinión</button>`;
    }

    document.getElementById("detalleAcciones").innerHTML = botonAlquilar + botonMiOpinion + botonVerResenas;

    // Obtener reseñas y promedio para mostrar resumen en modal
    try {
      const resRes = await fetch(`${API_URL}/calificaciones/libro/${id}`);
      if (resRes.ok) {
        const datos = await resRes.json();
        const lista = (datos.reseñas || []).map(r => `
          <div class="card" style="text-align:left; margin-top:8px;">
            <strong>${r.nombre}</strong> – ⭐${r.calificacion}
            <p>${r.comentario || "(sin comentario)"}</p>
            <small>${new Date(r.created_at).toLocaleDateString()}</small>
          </div>
        `).join("");

        document.getElementById("detalleReseñas").innerHTML =
          `<h4>Reseñas (Promedio: ⭐${datos.promedio})</h4>` +
          (lista || "<p>Aún no hay reseñas.</p>");
      } else {
        document.getElementById("detalleReseñas").innerHTML = `<p>No se pudieron cargar las reseñas.</p>`;
      }
    } catch (err) {
      console.error("Error cargando reseñas rápidas:", err);
      document.getElementById("detalleReseñas").innerHTML = `<p>Error al cargar reseñas.</p>`;
    }

    document.getElementById("modalLibro").classList.remove("oculto");
  } catch (error) {
    console.error("Error al cargar detalles del libro:", error);
    alert("Error al cargar detalles del libro");
  }
}

function cerrarModalLibro() {
  document.getElementById("modalLibro").classList.add("oculto");
}

// ----------------- Alquileres -----------------
function prepararAlquiler(idLibro) {
  if (!session) return alert("Debes iniciar sesión");
  libroSeleccionado = idLibro;
  // cargar el select de libros en el modalAlquiler (si existe)
  const select = document.getElementById("libroAlquiler");
  if (select) {
    select.innerHTML = `<option value="${idLibro}">${idLibro}</option>`;
  }
  const usuario = document.getElementById("usuarioAlquiler");
  if (usuario) usuario.value = session.email;
  document.getElementById("modalAlquiler").classList.remove("oculto");
}

function cerrarModalAlquiler() {
  document.getElementById("modalAlquiler").classList.add("oculto");
}

const formAlquiler = document.getElementById("formAlquiler");
if (formAlquiler) {
  formAlquiler.addEventListener("submit", async (e) => {
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
          renderMisAlquileres();
        }, 1200);
      } else {
        alert(data.error || "Error al registrar el alquiler");
      }
    } catch (error) {
      console.error("Error al alquilar:", error);
      alert("Error de conexión");
    }
  });
}

async function renderMisAlquileres() {
  const div = document.getElementById("misAlquileres");
  if (!div || !session) return;

  try {
    const res = await fetch(`${API_URL}/alquileres/${session.email}`);
    if (!res.ok) throw new Error("Error HTTP al obtener alquileres");
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

// ----------------- Calificaciones (modal estrellas) -----------------
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
  const texto = document.getElementById("textoCalificacion");
  if (texto) texto.textContent = "Selecciona una calificación";
}

function inicializarEstrellas() {
  document.querySelectorAll('.estrella').forEach(star => {
    star.addEventListener('click', () => {
      const value = parseInt(star.getAttribute('data-value'));
      calificacionSeleccionada = value;
      resetEstrellas();
      document.querySelectorAll('.estrella').forEach(s => {
        if (parseInt(s.getAttribute('data-value')) <= value) s.classList.add('activa');
      });
      const ratings = ["", "Muy malo", "Regular", "Bueno", "Muy bueno", "Excelente"];
      const texto = document.getElementById("textoCalificacion");
      if (texto) texto.textContent = `${ratings[value]} (${value} estrellas)`;
    });
  });
}

const formCalificacion = document.getElementById("formCalificacion");
if (formCalificacion) {
  formCalificacion.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!session) return alert("Debes iniciar sesión");

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
        // refrescar modal del libro si está abierto
        verDetalleLibro(libroId);
      } else {
        alert(data.error || "Error al enviar la calificación");
      }
    } catch (error) {
      console.error("Error al enviar calificación:", error);
      alert("Error de conexión");
    }
  });
}

// ----------------- Reservas (validación de disponibilidad) -----------------
async function verificarDisponibilidad() {
  const tipo = document.getElementById("tipoReserva").value;
  const fecha = document.getElementById("fechaReserva").value;
  const hora = document.getElementById("horaReserva").value;
  if (!fecha || !hora) return;

  const messageDivId = "mensajeDisponibilidad";
  let msgDiv = document.getElementById(messageDivId);
  if (!msgDiv) {
    msgDiv = document.createElement("div");
    msgDiv.id = messageDivId;
    msgDiv.style.marginTop = "10px";
    msgDiv.style.padding = "10px";
    msgDiv.style.borderRadius = "5px";
    msgDiv.style.fontWeight = "bold";
    document.getElementById("formReserva").appendChild(msgDiv);
  }

  try {
    const res = await fetch(`${API_URL}/verificar-disponibilidad?tipo=${tipo}&fecha=${fecha}&hora=${hora}`);
    const data = await res.json();
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
    console.error("Error verificar disponibilidad:", error);
  }
}

async function mostrarHorariosOcupados() {
  const fecha = document.getElementById("fechaReserva").value;
  if (!fecha) return;
  try {
    const res = await fetch(`${API_URL}/horarios-ocupados/${fecha}`);
    const horarios = await res.json();
    const infoDiv = document.getElementById("infoHorarios");
    if (infoDiv) {
      const mesasOcupadas = horarios.mesa.length > 0 ? `Mesas ocupadas: ${horarios.mesa.join(', ')}` : 'Mesas libres';
      const pcsOcupadas = horarios.pc.length > 0 ? `PCs ocupadas: ${horarios.pc.join(', ')}` : 'PCs libres';
      infoDiv.innerHTML = `<p style="font-size: 0.9em; color: #666;">${mesasOcupadas} | ${pcsOcupadas}</p>`;
    }
  } catch (error) {
    console.error("Error obtener horarios ocupados:", error);
  }
}

const formReserva = document.getElementById("formReserva");
if (formReserva) {
  formReserva.addEventListener("submit", async (e) => {
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
        formReserva.reset();
        const msgDiv = document.getElementById("mensajeDisponibilidad");
        if (msgDiv) msgDiv.style.display = "none";
        renderMisReservas();
      } else {
        alert(data.error || "Error al registrar la reserva");
      }
    } catch (error) {
      console.error("Error reservar:", error);
      alert("Error de conexión");
    }
  });
}

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
    console.error("Error al cargar historial:", error);
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
    if (!div) return;
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

// ----------------- Devolver libro -----------------
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
    console.error("Error devolver libro:", error);
    alert("Error de conexión");
  }
}

// ----------------- Ver TODAS las reseñas (modal aparte) -----------------
async function verTodasReseñas(libroId) {
  try {
    // Pedir datos al backend
    const res = await fetch(`${API_URL}/calificaciones/libro/${libroId}`);
    if (!res.ok) throw new Error("No se pudieron obtener reseñas");
    const datos = await res.json(); // { promedio, reseñas: [...] }

    // Crear modal si no existe
    let modal = document.getElementById("modalResenas");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "modalResenas";
      modal.className = "modal";
      modal.style.zIndex = 2000;
      modal.innerHTML = `<div class="modal-content" id="modalResenasContent" style="max-width:700px; overflow:auto;"></div>`;
      document.body.appendChild(modal);
    }

    const content = document.getElementById("modalResenasContent");
    content.innerHTML = `
      <h3>Reseñas - Promedio: ⭐ ${datos.promedio}</h3>
      <div id="listaResenasGlobal">
        ${(datos.reseñas || []).map(r => `
          <div class="reseña-card" style="margin-bottom:12px;">
            <strong>${r.nombre}</strong> <span>⭐ ${r.calificacion}/5</span>
            <p>${r.comentario || "(sin comentario)"}</p>
            <small>${new Date(r.created_at).toLocaleString()}</small>
          </div>
        `).join('') || "<p>Aún no hay reseñas.</p>"}
      </div>
      <hr>
      <div id="formAgregarResena">
        <h4>Agregar reseña</h4>
        ${session ? `
          <label>Calificación:
            <select id="resenaCalificacion">
              <option value="1">⭐1</option>
              <option value="2">⭐2</option>
              <option value="3">⭐3</option>
              <option value="4">⭐4</option>
              <option value="5">⭐5</option>
            </select>
          </label>
          <br>
          <textarea id="resenaComentario" rows="4" style="width:100%" placeholder="Escribe tu reseña"></textarea>
          <br>
          <button id="btnGuardarResena">Guardar reseña</button>
        ` : `
          <p>Inicia sesión para dejar una reseña.</p>
        `}
        <button id="btnCerrarResenas" style="margin-left:8px;">Cerrar</button>
      </div>
    `;

    // mostrar modal
    modal.classList.remove("oculto");
    modal.style.display = "flex";

    // handlers
    const btnCerrar = document.getElementById("btnCerrarResenas");
    if (btnCerrar) btnCerrar.onclick = () => {
      modal.classList.add("oculto");
      modal.style.display = "none";
    };

    const btnGuardar = document.getElementById("btnGuardarResena");
    if (btnGuardar) {
      btnGuardar.onclick = async () => {
        const cal = document.getElementById("resenaCalificacion").value;
        const com = document.getElementById("resenaComentario").value;
        if (!cal) return alert("Selecciona una calificación");
        try {
          const resSave = await fetch(`${API_URL}/calificacion`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              libroId,
              usuario: session.email,
              calificacion: parseInt(cal),
              comentario: com
            })
          });
          const dataSave = await resSave.json();
          if (dataSave.success) {
            alert("Reseña guardada");
            // refrescar lista
            verTodasReseñas(libroId);
          } else {
            alert(dataSave.error || "No se pudo guardar la reseña");
          }
        } catch (err) {
          console.error("Error guardando reseña:", err);
          alert("Error de conexión");
        }
      };
    }
  } catch (error) {
    console.error("Error verTodasReseñas:", error);
    alert("No se pudieron cargar las reseñas");
  }
}

// ----------------- Init -----------------
window.onload = async () => {
  console.log("Iniciando aplicación...");
  try {
    renderAuthButtons();
    inicializarEstrellas();

    // Fechas mínimas
    const hoy = new Date().toISOString().split('T')[0];
    const fechaReservaEl = document.getElementById("fechaReserva");
    const fechaDevolEl = document.getElementById("fechaDevolucion");
    if (fechaReservaEl) fechaReservaEl.min = hoy;
    if (fechaDevolEl) fechaDevolEl.min = hoy;

    // Eventos para reservas (si existen)
    const tipoReservaEl = document.getElementById("tipoReserva");
    const horaReservaEl = document.getElementById("horaReserva");
    if (tipoReservaEl) tipoReservaEl.addEventListener("change", verificarDisponibilidad);
    if (fechaReservaEl) fechaReservaEl.addEventListener("change", () => { mostrarHorariosOcupados(); verificarDisponibilidad(); });
    if (horaReservaEl) horaReservaEl.addEventListener("change", verificarDisponibilidad);

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
