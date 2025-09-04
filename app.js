// ---------------- Datos iniciales ----------------
let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
let session = JSON.parse(localStorage.getItem("session")) || null;
let reservas = JSON.parse(localStorage.getItem("reservas")) || [];
let alquileres = JSON.parse(localStorage.getItem("alquileres")) || [];
let libroSeleccionado = null;

// ---------------- Libros ----------------
const libros = [
  { id: 1, titulo: "Cien años de soledad", autor: "García Márquez", genero: "Realismo mágico", copias: 3, img: "https://images.cdn3.buscalibre.com/fit-in/360x360/50/a3/50a33f98323772d2c61aa4b5b2e9c9c4.jpg", sinopsis: "La historia de la familia Buendía en Macondo." },
  { id: 2, titulo: "Rayuela", autor: "Cortázar", genero: "Ficción", copias: 2, img: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Rayuela_JC.png", sinopsis: "Una novela innovadora que permite múltiples formas de lectura." },
  { id: 3, titulo: "Dune", autor: "Frank Herbert", genero: "Ciencia ficción", copias: 4, img: "https://images.cdn1.buscalibre.com/fit-in/360x360/e7/25/e725760e5c93acdeccf44903ff2fcb94.jpg", sinopsis: "La lucha por Arrakis." },
  { id: 4, titulo: "A todos los chicos de los que me enamoré", autor: "Jenny Han", genero: "Rom-Com", copias: 5, img: "https://www.planetadelibros.com.ar/usuaris/libros/fotos/289/original/portada_trilogia-a-todos-los-chicos-de-los-que-me-enamore-pack_jenny-han_201811051133.jpg", sinopsis: "Las cartas secretas de Lara Jean salen a la luz y cambian su vida." },
  { id: 5, titulo: "El verano en que me enamoré", autor: "Jenny Han", genero: "Rom-Com", copias: 3, img: "https://www.planetadelibros.com.ar/usuaris/libros/fotos/69/original/68091_portada_el-verano-en-que-me-enamore_jenny-han_202310231117.jpg", sinopsis: "Un verano que cambia todo para Belly y los hermanos Fisher." },
  { id: 6, titulo: "Tienes un email", autor: "Nora Ephron", genero: "Rom-Com", copias: 2, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQegCV4sunSNno6pqHCMWZ6Pr4TXXWhkZ7pCw&s", sinopsis: "Dos rivales comerciales descubren que son almas gemelas online." },
  { id: 7, titulo: "La hipótesis del amor", autor: "Ali Hazelwood", genero: "Rom-Com", copias: 6, img: "https://images.cdn2.buscalibre.com/fit-in/360x360/17/51/1751c3b138121d658d12617c581203d4.jpg", sinopsis: "Una comedia romántica ambientada en el mundo académico." },
  { id: 8, titulo: "People We Meet on Vacation", autor: "Emily Henry", genero: "Rom-Com", copias: 4, img: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1748450140i/54985743.jpg", sinopsis: "Dos mejores amigos viajan cada verano juntos hasta que algo cambia." },
  { id: 9, titulo: "Orgullo y Prejuicio", autor: "Jane Austen", gemero:"Romance", copias: 4, img:"https://images.cdn2.buscalibre.com/fit-in/360x360/69/73/697367de2a03bc98c4cb963d35ae2af2.jpg",  sinopsis: "La historia de Elizabeth Bennet y el señor Darcy, quienes deben superar sus prejuicios y diferencias sociales para descubrir el verdadero amor."},
  { id: 10,titulo:"IT", autor: "Stephen King", genero: "terror", copias: 3, img:"https://images.cdn3.buscalibre.com/fit-in/360x360/df/43/df43923a18c57cfc02206ef54e50f192.jpg", sinopsis: "Un grupo de amigos de la infancia enfrenta a un ser maligno que adopta la forma de sus peores miedos, especialmente el payaso Pennywise, y regresa años después para acabar con él definitivamente."},
  { id: 11,titulo:"Dracula", autor: "Bram Stoker",genero: "Terror", copias: 5, img:"https://images.cdn1.buscalibre.com/fit-in/360x360/53/c4/53c4c47d539b4e352cb284b18e2c80f8.jpg", sinopsis: "El conde Drácula viaja desde Transilvania a Inglaterra para expandir su maldición, mientras un grupo de personas lideradas por Van Helsing lucha por detenerlo." },
  { id: 12, titulo: "Romper El Circulo", autor: "Colleen Hoover", genero: "Rom-Com", copias: 6, img:"https://images.cdn3.buscalibre.com/fit-in/360x360/aa/c4/aac495a3ef1a84293a0e7771c26b5c4e.jpg", sinopsis: "Lily Bloom inicia una relación con Ryle, un brillante neurocirujano, pero debe enfrentarse a dolorosas decisiones cuando el pasado y la violencia amenazan su futuro."}


];

// ---------------- Navegación ----------------
let secciones = ["home", "menu", "reservas", "libros", "historial", "info"];
let seccionActual = "home";
function mostrarSeccion(id) {
  if (id === seccionActual) return;
  document.getElementById(seccionActual).classList.remove("activa");
  document.getElementById(seccionActual).style.display = "none";
  const target = document.getElementById(id);
  target.style.display = "block"; target.classList.add("activa");
  seccionActual = id;
}

// ---------------- Autenticación ----------------
function renderAuthButtons() {
  const div = document.getElementById("authButtons");
  if (session) {
    div.innerHTML = `<span>Hola, ${session.nombre}</span><button onclick="logout()">Salir</button>`;
  } else {
    div.innerHTML = `<button onclick="abrirModal('login')">Iniciar sesión</button><button onclick="abrirModal('registro')">Registrarse</button>`;
  }
}
function abrirModal(tipo) { document.getElementById("modalAuth").classList.remove("oculto"); document.getElementById("tituloModal").textContent = tipo==="login"?"Iniciar sesión":"Registrarse"; }
function cerrarModal() { document.getElementById("modalAuth").classList.add("oculto"); }
function logout(){ session=null; localStorage.removeItem("session"); renderAuthButtons(); }

// ---------------- Reservas ----------------
// (igual que antes, no lo repito por espacio)

// ---------------- Libros ----------------
function renderLibros() {
  const div = document.getElementById("listaLibros");
  div.innerHTML = libros.map(b => {
    const activos = alquileres.filter(a => a.idLibro === b.id && !a.devuelto).length;
    const disponibles = b.copias - activos;
    return `<div class="card" onclick="verDetalleLibro(${b.id})"><img src="${b.img}"><h4>${b.titulo}</h4><p>${b.autor}</p><strong>${disponibles>0?disponibles+" disponibles":"No disponible"}</strong></div>`;
  }).join("");
}
function renderMisAlquileres() {
  const div = document.getElementById("misAlquileres");
  const mios = alquileres.filter(a=>a.usuario===session?.email);
  div.innerHTML = mios.map(a=>{
    const libro=libros.find(l=>l.id===a.idLibro);
    return `<div class="card">${libro.titulo} - ${a.devuelto?"Devuelto":"En curso"}</div>`;
  }).join("")||"No alquilaste libros.";
}

// ---------------- Formulario alquiler ----------------
function initFormAlquiler() {
  const select = document.getElementById("libroAlquiler");
  select.innerHTML = '<option value="">-- Seleccioná un libro --</option>' + 
    libros.map(l => `<option value="${l.id}">${l.titulo}</option>`).join("");
  if (session) {
    document.getElementById("usuarioAlquiler").value = session.email;
  }
}

// Abrir modal de alquiler desde botón
function prepararAlquiler(idLibro) {
  if (!session) return mostrarMsg("Debes iniciar sesión","error");
  libroSeleccionado = idLibro;
  document.getElementById("libroAlquiler").value = idLibro;
  document.getElementById("usuarioAlquiler").value = session.email;
  cerrarModalLibro();
  document.getElementById("modalAlquiler").classList.remove("oculto");
}

function cerrarModalAlquiler() {
  document.getElementById("modalAlquiler").classList.add("oculto");
}

// Evento submit
document.getElementById("formAlquiler").addEventListener("submit", e => {
  e.preventDefault();
  if (!session) return mostrarMsg("Iniciá sesión","error");
  if (!libroSeleccionado) return mostrarMsg("No seleccionaste libro","error");
  const fecha = document.getElementById("fechaDevolucion").value;
  if (!fecha) return mostrarMsg("Elegí una fecha","error");

  alquileres.push({idLibro: libroSeleccionado, usuario: session.email, fechaDev: fecha, devuelto: false});
  localStorage.setItem("alquileres", JSON.stringify(alquileres));

  mostrarMsg("✅ Alquiler confirmado","ok");
  renderLibros();
  renderMisAlquileres();
  libroSeleccionado = null;
  cerrarModalAlquiler();
});

function mostrarMsg(txt, tipo){
  const div = document.getElementById("msgAlquiler");
  div.textContent = txt;
  div.style.color = tipo==="error" ? "red" : "green";
  setTimeout(()=>div.textContent="", 3000);
}

// ---------------- Modal detalle ----------------
function verDetalleLibro(id){
  const libro=libros.find(l=>l.id===id);
  document.getElementById("detalleTitulo").textContent=libro.titulo;
  document.getElementById("detalleImg").src=libro.img;
  document.getElementById("detalleAutor").textContent="Autor: "+libro.autor;
  document.getElementById("detalleGenero").textContent="Género: "+libro.genero;
  document.getElementById("detalleSinopsis").textContent=libro.sinopsis;
  let acciones=`<button onclick="prepararAlquiler(${libro.id})">Alquilar</button>`;
  document.getElementById("detalleAcciones").innerHTML=acciones;
  document.getElementById("modalLibro").classList.remove("oculto");
}
function cerrarModalLibro(){ document.getElementById("modalLibro").classList.add("oculto"); }

// ---------------- Ranking y carrusel ----------------
function renderTopLibros(){
  const ranking=libros.map(l=>{const veces=alquileres.filter(a=>a.idLibro===l.id).length; return {...l,veces};}).sort((a,b)=>b.veces-a.veces).slice(0,10);
  const div=document.getElementById("carruselLibros");
  div.innerHTML=ranking.map(b=>`<div class="card"><img src="${b.img}"><h4>${b.titulo}</h4><p>${b.autor}</p><span>${b.veces} alquileres</span></div>`).join("");
}

// Carrusel
let posicionCarrusel=0, itemWidth=0;
function moverCarrusel(dir){
  const track=document.getElementById("carruselLibros");
  if(!track||track.children.length===0)return;
  if(itemWidth===0) itemWidth=track.children[0].offsetWidth+20;
  const total=track.children.length, visible=4;
  const max=-(itemWidth*(total-visible));
  posicionCarrusel+=dir*itemWidth;
  if(posicionCarrusel>0)posicionCarrusel=0;
  if(posicionCarrusel<max)posicionCarrusel=max;
  track.style.transform=`translateX(${posicionCarrusel}px)`;
}
setInterval(()=>{ moverCarrusel(1); },4000);

// ---------------- Inicializar ----------------
window.onload=()=>{
  renderAuthButtons();
  renderLibros();
  renderMisAlquileres();
  renderTopLibros();
  initFormAlquiler();
};
