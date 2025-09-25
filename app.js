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
  else if (id === "libros") {
  renderLibros();
  renderFiltrosGeneros(); // 🔹 cargar botones de géneros
  renderMisAlquileres();
  
}

}

// -------- Carrusel Libros Recomendados --------
let carruselIndex = 0;
let carruselItems = [];
const visibleItems = 5; // 🔹 ahora mostramos 5 a la vez

async function cargarCarruselLibros() {
  try {
    const res = await fetch(`${API_URL}/libros`);
    const libros = await res.json();
    const librosRandom = libros.sort(() => Math.random() - 0.5).slice(0, 10); // 🔹 ahora 10 libros

    const track = document.getElementById("carruselLibros");
    track.innerHTML = librosRandom.map(l => `
      <div class="carrusel-item" onclick="verDetalleLibro(${l.id})">
        <img src="${l.img}" alt="${l.titulo}"
             onerror="this.src='https://via.placeholder.com/150x200?text=Sin+imagen'">
        <h4>${l.titulo}</h4>
        <p>${l.autor}</p>
      </div>
    `).join("");

    carruselItems = track.children;
    carruselIndex = 0;
    actualizarCarrusel();
  } catch (err) {
    console.error(err);
  }
}

function moverCarrusel(dir) {
  const visible = getVisibleItems();
  const maxIndex = carruselItems.length - visible;

  carruselIndex += dir;
  if (carruselIndex < 0) carruselIndex = 0;
  if (carruselIndex > maxIndex) carruselIndex = maxIndex;

  actualizarCarrusel();
}


function actualizarCarrusel() {
  const track = document.getElementById("carruselLibros");
  const anchoItem = carruselItems[0]?.offsetWidth + 30 || 200;
  track.style.transform = `translateX(-${carruselIndex * anchoItem}px)`;

  const visible = getVisibleItems();                  // 👈 recalculamos
  const maxIndex = carruselItems.length - visible;     // 👈 usamos visible real

  const btnPrev = document.querySelector(".carrusel button.prev");
  const btnNext = document.querySelector(".carrusel button.next");

  btnPrev.disabled = carruselIndex === 0;
  btnNext.disabled = carruselIndex >= maxIndex;

  btnPrev.style.opacity = btnPrev.disabled ? "0.4" : "1";
  btnNext.style.opacity = btnNext.disabled ? "0.4" : "1";
}
function getVisibleItems() {
  const track = document.getElementById("carruselLibros");
  const containerWidth = document.querySelector(".carrusel").offsetWidth;
  const itemWidth = carruselItems[0]?.offsetWidth + 30 || 200;
  return Math.floor(containerWidth / itemWidth);
}



// Cargar cuando se inicia la app
document.addEventListener("DOMContentLoaded", cargarCarruselLibros);


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

// ----------------- Filtros de Géneros -----------------
async function renderFiltrosGeneros() {
  try {
    const res = await fetch(`${API_URL}/libros`);
    const libros = await res.json();

    // Obtener géneros únicos
    const generos = [...new Set(libros.map(l => l.genero))];

    const contenedor = document.getElementById("filtrosGeneros");
    contenedor.innerHTML = `
      <button onclick="renderLibros('todos')" class="filtro activo">Todos</button>
      ${generos.map(g => `
        <button onclick="renderLibros('${g}')">${g}</button>
      `).join("")}
    `;

    // Resaltar botón activo
    contenedor.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", e => {
        contenedor.querySelectorAll("button").forEach(b => b.classList.remove("activo"));
        e.target.classList.add("activo");
      });
    });

  } catch (error) {
    console.error("Error al cargar géneros:", error);
  }
}


// ----------------- Filtros de Géneros -----------------
async function renderFiltrosGeneros() {
  try {
    const res = await fetch(`${API_URL}/libros`);
    const libros = await res.json();

    // Obtener géneros únicos
    const generos = [...new Set(libros.map(l => l.genero))];

    const contenedor = document.getElementById("filtrosGeneros");
    contenedor.innerHTML = `
      <button onclick="renderLibros('todos')" class="filtro activo">Todos</button>
      ${generos.map(g => `
        <button onclick="renderLibros('${g}')">${g}</button>
      `).join("")}
    `;

    // Resaltar botón activo
    contenedor.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", e => {
        contenedor.querySelectorAll("button").forEach(b => b.classList.remove("activo"));
        e.target.classList.add("activo");
      });
    });

  } catch (error) {
    console.error("Error al cargar géneros:", error);
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
// Agrega esta función en la sección de Calificaciones
function abrirModalCalificacion(libroId) {
  if (!session) {
    alert("Debes iniciar sesión para calificar");
    return;
  }
  
  libroSeleccionado = libroId;
  calificacionSeleccionada = 0;
  
  // Resetear el formulario
  document.getElementById("calificacionLibroId").value = libroId;
  document.getElementById("comentarioCalificacion").value = '';
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

// CORRECCIONES PARA EL SISTEMA DE CALIFICACIONES EN app.js

// 1. ACTUALIZAR LA FUNCIÓN verDetalleLibro para mostrar calificaciones existentes
async function verDetalleLibro(id) {
  try {
    const res = await fetch(`${API_URL}/libros/${id}`);
    const libro = await res.json();
    
    document.getElementById("detalleTitulo").textContent = libro.titulo;
    document.getElementById("detalleImg").src = libro.img;
    document.getElementById("detalleImg").onerror = function() {
      this.src = 'https://via.placeholder.com/150x200?text=Imagen+no+disponible';
    };
    document.getElementById("detalleAutor").textContent = "Autor: " + libro.autor;
    document.getElementById("detalleGenero").textContent = "Género: " + libro.genero;
    document.getElementById("detalleSinopsis").textContent = libro.sinopsis;
    
    const disponible = libro.copias > 0;
    let botonAlquilar = disponible ? 
      `<button onclick="prepararAlquiler(${libro.id})">Alquilar</button>` :
      `<button disabled>No disponible</button>`;
    
    let botonCalificar = '';
    let seccionCalificaciones = '';

    if (session) {
      try {
        // Verificar si el usuario ya calificó este libro
        const resCalificacion = await fetch(`${API_URL}/calificacion/${libro.id}?usuario=${session.email}`);
        const calificacion = await resCalificacion.json();
        
        if (calificacion && calificacion.calificacion) {
          // Usuario ya calificó - mostrar su calificación
          botonCalificar = `
            <div style="margin: 10px 0; padding: 10px; background: #e8f5e9; border-radius: 8px;">
              <strong>Tu calificación:</strong> ${calificacion.calificacion} ⭐
              ${calificacion.comentario ? `<br><em>"${calificacion.comentario}"</em>` : ''}
            </div>`;
        } else {
          // Verificar si ha alquilado el libro para poder calificar
          const resAlquiler = await fetch(`${API_URL}/alquileres/${session.email}`);
          const alquileres = await resAlquiler.json();
          const haAlquilado = alquileres.some(a => a.libro_id == libro.id);
          
          if (haAlquilado) {
            botonCalificar = `<button onclick="abrirModalCalificacion(${libro.id})" style="background: #4caf50; color: white; margin-left: 10px;">💭 Mi opinión</button>`;
          }
        }
      } catch (error) {
        console.error("Error al verificar calificación:", error);
      }
    }

    // Cargar todas las calificaciones del libro
    try {
      const resTodasCalificaciones = await fetch(`${API_URL}/calificaciones/${libro.id}`);
      const todasCalificaciones = await resTodasCalificaciones.json();
      
      if (todasCalificaciones && todasCalificaciones.length > 0) {
        const promedio = (todasCalificaciones.reduce((sum, cal) => sum + cal.calificacion, 0) / todasCalificaciones.length).toFixed(1);
        
        seccionCalificaciones = `
          <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <h4>Calificaciones (${todasCalificaciones.length})</h4>
            <div style="margin: 10px 0;">
              <strong>Promedio: ${promedio} ⭐</strong>
            </div>
            <button onclick="toggleCalificaciones()" id="btnMostrarCalificaciones" style="background: #007bff; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
              Ver todas las opiniones
            </button>
            <div id="listaCalificaciones" style="display: none; margin-top: 15px;">
              ${todasCalificaciones.map(cal => `
                <div style="border: 1px solid #ddd; padding: 12px; margin: 8px 0; border-radius: 8px; background: white;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong>${cal.nombre_usuario}</strong>
                    <span style="color: #f39c12; font-weight: bold;">${cal.calificacion} ⭐</span>
                  </div>
                  ${cal.comentario ? `<p style="color: #666; font-style: italic; margin: 0;">"${cal.comentario}"</p>` : ''}
                  <small style="color: #999;">${new Date(cal.created_at).toLocaleDateString()}</small>
                </div>
              `).join('')}
            </div>
          </div>`;
      }
    } catch (error) {
      console.error("Error al cargar calificaciones:", error);
    }
    
    document.getElementById("detalleAcciones").innerHTML = botonAlquilar + botonCalificar + seccionCalificaciones;
    document.getElementById("modalLibro").classList.remove("oculto");
  } catch (error) {
    alert("Error al cargar detalles del libro");
  }
}

// 2. NUEVA FUNCIÓN para mostrar/ocultar calificaciones
function toggleCalificaciones() {
  const lista = document.getElementById("listaCalificaciones");
  const boton = document.getElementById("btnMostrarCalificaciones");
  
  if (lista.style.display === "none") {
    lista.style.display = "block";
    boton.textContent = "Ocultar opiniones";
  } else {
    lista.style.display = "none";
    boton.textContent = "Ver todas las opiniones";
  }
}

// 3. MEJORAR la función abrirModalCalificacion
function abrirModalCalificacion(libroId) {
  if (!session) {
    alert("Debes iniciar sesión para calificar");
    return;
  }
  
  document.getElementById("calificacionLibroId").value = libroId;
  document.getElementById("comentarioCalificacion").value = '';
  calificacionSeleccionada = 0;
  resetEstrellas();
  document.getElementById("modalCalificacion").classList.remove("oculto");
}

// 4. MEJORAR el envío de calificaciones
document.getElementById("formCalificacion").addEventListener("submit", async e => {
  e.preventDefault();
  if (!session) {
    alert("Debes iniciar sesión");
    return;
  }
  
  const libroId = document.getElementById("calificacionLibroId").value;
  const comentario = document.getElementById("comentarioCalificacion").value.trim();
  
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
      alert("✅ Calificación enviada exitosamente");
      cerrarModalCalificacion();
      // Recargar los detalles del libro para mostrar la nueva calificación
      verDetalleLibro(libroId);
    } else {
      alert(data.error || "Error al enviar la calificación");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error de conexión");
  }
});

// 5. MEJORAR resetEstrellas y la inicialización
function resetEstrellas() {
  const estrellas = document.querySelectorAll('.estrella');
  estrellas.forEach(star => {
    star.classList.remove('activa');
    star.style.color = '#ccc';
  });
  document.getElementById("textoCalificacion").textContent = "Selecciona una calificación";
}

function inicializarEstrellas() {
  document.querySelectorAll('.estrella').forEach((star, index) => {
    star.addEventListener('click', () => {
      const value = parseInt(star.getAttribute('data-value'));
      calificacionSeleccionada = value;
      
      // Resetear todas las estrellas
      document.querySelectorAll('.estrella').forEach(s => {
        s.classList.remove('activa');
        s.style.color = '#ccc';
      });
      
      // Activar las estrellas hasta el valor seleccionado
      document.querySelectorAll('.estrella').forEach(s => {
        if (parseInt(s.getAttribute('data-value')) <= value) {
          s.classList.add('activa');
          s.style.color = 'gold';
        }
      });
      
      const ratings = ["", "Muy malo", "Regular", "Bueno", "Muy bueno", "Excelente"];
      document.getElementById("textoCalificacion").textContent = 
        `${ratings[value]} (${value} estrellas)`;
    });
    
    // Efecto hover
    star.addEventListener('mouseenter', () => {
      const value = parseInt(star.getAttribute('data-value'));
      document.querySelectorAll('.estrella').forEach(s => {
        if (parseInt(s.getAttribute('data-value')) <= value) {
          s.style.color = 'gold';
        } else {
          s.style.color = '#ccc';
        }
      });
    });
    
    star.addEventListener('mouseleave', () => {
      // Restaurar el estado actual de las estrellas
      document.querySelectorAll('.estrella').forEach(s => {
        const starValue = parseInt(s.getAttribute('data-value'));
        if (starValue <= calificacionSeleccionada) {
          s.style.color = 'gold';
        } else {
          s.style.color = '#ccc';
        }
      });
    });
  });
}
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
    
    
    
    console.log("Datos cargados correctamente");
    mostrarSeccion("home");
    } catch (error) {
      console.error("Error al iniciar la aplicación:", error);
    }
  };