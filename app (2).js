// FRONTEND - app.js
const API_URL = "http://localhost:3000";
let session = JSON.parse(localStorage.getItem("session")) || null;
let libroSeleccionado = null;

// ----------------- Navegación -----------------
let seccionActual = "home";
function mostrarSeccion(id) {
  if (id === seccionActual) return;
  document.getElementById(seccionActual).classList.remove("activa");
  document.getElementById(seccionActual).style.display = "none";
  const target = document.getElementById(id);
  target.style.display = "block"; target.classList.add("activa");
  seccionActual = id;
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
  document.getElementById("tituloModal").textContent = tipo==="login" ? "Iniciar sesión" : "Registrarse"; 
}
function cerrarModal() { document.getElementById("modalAuth").classList.add("oculto"); }
function logout(){ session=null; localStorage.removeItem("session"); renderAuthButtons(); }

// ----------------- Login/Registro -----------------
document.getElementById("formAuth").addEventListener("submit", async e => {
  e.preventDefault();
  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const titulo = document.getElementById("tituloModal").textContent;

  const endpoint = titulo.includes("Registrarse") ? "/register" : "/login";
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, email, password })
  });
  const data = await res.json();

  if (data.status === "success") {
    session = { nombre: data.user.nombre, email: data.user.email };
    localStorage.setItem("session", JSON.stringify(session));
    cerrarModal();
    renderAuthButtons();
    renderHistorial();
  } else {
    alert(data.message);
  }
});

// ----------------- Libros -----------------
async function renderLibros(filtroGenero = null) {
  const res = await fetch(`${API_URL}/libros`);
  let lista = await res.json();

  if (filtroGenero) lista = lista.filter(l => l.genero === filtroGenero);

  const div = document.getElementById("listaLibros");
  div.innerHTML = lista.map(b => {
    return `<div class="card" onclick="verDetalleLibro(${b.id})">
              <img src="${b.img}">
              <h4>${b.titulo}</h4>
              <p>${b.autor}</p>
            </div>`;
  }).join("") || "<p>No hay libros en esta categoría.</p>";
}

async function verDetalleLibro(id){
  const res = await fetch(`${API_URL}/libros/${id}`);
  const libro = await res.json();
  document.getElementById("detalleTitulo").textContent=libro.titulo;
  document.getElementById("detalleImg").src=libro.img;
  document.getElementById("detalleAutor").textContent="Autor: "+libro.autor;
  document.getElementById("detalleGenero").textContent="Género: "+libro.genero;
  document.getElementById("detalleSinopsis").textContent=libro.sinopsis;
  document.getElementById("detalleAcciones").innerHTML=`<button onclick="prepararAlquiler(${libro.id})">Alquilar</button>`;
  document.getElementById("modalLibro").classList.remove("oculto");
}
function cerrarModalLibro(){ document.getElementById("modalLibro").classList.add("oculto"); }

function prepararAlquiler(idLibro){
  if (!session) return alert("Debes iniciar sesión");
  libroSeleccionado = idLibro;
  document.getElementById("libroAlquiler").value = idLibro;
  document.getElementById("usuarioAlquiler").value = session.email;
  document.getElementById("modalAlquiler").classList.remove("oculto");
}
function cerrarModalAlquiler(){ document.getElementById("modalAlquiler").classList.add("oculto"); }

// ----------------- Alquileres -----------------
document.getElementById("formAlquiler").addEventListener("submit", async e => {
  e.preventDefault();
  if (!session) return alert("Debes iniciar sesión");
  if (!libroSeleccionado) return;

  const fecha = document.getElementById("fechaDevolucion").value;
  if (!fecha) return alert("Selecciona una fecha");

  const res = await fetch(`${API_URL}/alquileres`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idLibro: libroSeleccionado, usuario: session.email, fechaDev: fecha })
  });
  const data = await res.json();

  if (data.success) {
    document.getElementById("msgAlquiler").innerText = "✅ Alquiler exitoso";
    await renderHistorial();
    setTimeout(() => {
      cerrarModalAlquiler();
      document.getElementById("msgAlquiler").innerText = "";
    }, 1500);
  } else {
    alert("❌ Error al registrar el alquiler");
  }
});

async function renderMisAlquileres() {
  const div = document.getElementById("historialLibros");
  if (!div || !session) return;

  const res = await fetch(`${API_URL}/alquileres/${session.email}`);
  const alquileres = await res.json();

  div.innerHTML = "<h3>Mis alquileres</h3>" + 
    (alquileres.map(a => `<div class="card">${a.titulo} - ${a.devuelto ? "Devuelto" : "En curso"}</div>`).join("") 
      || "<p>No alquilaste libros.</p>");
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

  const res = await fetch(`${API_URL}/reservas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tipo, personas, fecha, hora, usuario: session.email })
  });
  const data = await res.json();

  if (data.success) {
    alert("✅ Reserva confirmada");
    await renderHistorial();
    document.getElementById("formReserva").reset();
  } else {
    alert("❌ Error al registrar la reserva");
  }
});

async function renderMisReservas() {
  const div = document.getElementById("historialReservas");
  if (!div || !session) return;

  const res = await fetch(`${API_URL}/reservas/${session.email}`);
  const reservas = await res.json();

  div.innerHTML = "<h3>Mis reservas</h3>" + 
    (reservas.map(r => `<div class="card">${r.tipo} - ${r.personas||1} personas - ${r.fecha} ${r.hora}</div>`).join("") 
      || "<p>No hiciste reservas.</p>");
}

// ----------------- Historial -----------------
async function renderHistorial() {
  await renderMisReservas();
  await renderMisAlquileres();
}

// ----------------- Carrusel -----------------
async function renderTopLibros() {
  const res = await fetch(`${API_URL}/libros`);
  let lista = await res.json();
  const recomendados = [...lista].sort(() => 0.5 - Math.random()).slice(0, 4);

  const div = document.getElementById("carruselLibros");
  div.innerHTML = recomendados.map(b =>
    `<div class="card"><img src="${b.img}"><h4>${b.titulo}</h4><p>${b.autor}</p></div>`
  ).join("");
}

let posCarrusel=0, itemWidth=0;
function moverCarrusel(dir){
  const track=document.getElementById("carruselLibros");
  if(!track||track.children.length===0)return;
  if(itemWidth===0) itemWidth=track.children[0].offsetWidth+20;
  const total=track.children.length, visible=4;
  const max=-(itemWidth*(total-visible));
  posCarrusel+=dir*itemWidth;
  if(posCarrusel>0)posCarrusel=0;
  if(posCarrusel<max)posCarrusel=max;
  track.style.transform=`translateX(${posCarrusel}px)`;
}
setInterval(()=>{ moverCarrusel(1); },4000);

// ----------------- Init -----------------
window.onload=()=>{
  renderAuthButtons();
  renderTopLibros();
  renderHistorial();
  renderLibros();   
};
