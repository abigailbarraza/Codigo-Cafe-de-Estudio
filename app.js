// Datos iniciales 
let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
let session = JSON.parse(localStorage.getItem("session")) || null;
let reservas = JSON.parse(localStorage.getItem("reservas")) || [];
let alquileres = JSON.parse(localStorage.getItem("alquileres")) || [];
let libroSeleccionado = null;

// Libros 
const libros = [
  { id: 1, titulo: "Cien años de soledad", autor: "García Márquez", genero: "Realismo mágico", copias: 3, img: "https://images.cdn3.buscalibre.com/fit-in/360x360/50/a3/50a33f98323772d2c61aa4b5b2e9c9c4.jpg", sinopsis: "La historia de la familia Buendía en Macondo." },
  { id: 2, titulo: "Rayuela", autor: "Cortázar", genero: "Ficción", copias: 2, img: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Rayuela_JC.png", sinopsis: "Una novela innovadora que permite múltiples formas de lectura." },
  { id: 3, titulo: "Dune", autor: "Frank Herbert", genero: "Ciencia ficción", copias: 4, img: "https://images.cdn1.buscalibre.com/fit-in/360x360/e7/25/e725760e5c93acdeccf44903ff2fcb94.jpg", sinopsis: "La lucha por Arrakis." },
  { id: 4, titulo: "A todos los chicos de los que me enamoré", autor: "Jenny Han", genero: "Rom-Com", copias: 5, img: "https://www.planetadelibros.com.ar/usuaris/libros/fotos/289/original/portada_trilogia-a-todos-los-chicos-de-los-que-me-enamore-pack_jenny-han_201811051133.jpg", sinopsis: "Las cartas secretas de Lara Jean salen a la luz y cambian su vida." },
  { id: 5, titulo: "El verano en que me enamoré", autor: "Jenny Han", genero: "Rom-Com", copias: 3, img: "https://www.planetadelibros.com.ar/usuaris/libros/fotos/69/original/68091_portada_el-verano-en-que-me-enamore_jenny-han_202310231117.jpg", sinopsis: "Un verano que cambia todo para Belly y los hermanos Fisher." },
  { id: 6, titulo: "Tienes un email", autor: "Nora Ephron", genero: "Rom-Com", copias: 2, img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQegCV4sunSNno6pqHCMWZ6Pr4TXXWhkZ7pCw&s", sinopsis: "Dos rivales comerciales descubren que son almas gemelas online." },
  { id: 7, titulo: "La hipótesis del amor", autor: "Ali Hazelwood", genero: "Rom-Com", copias: 6, img: "https://images.cdn2.buscalibre.com/fit-in/360x360/17/51/1751c3b138121d658d12617c581203d4.jpg", sinopsis: "Una comedia romántica ambientada en el mundo académico." },
  { id: 8, titulo: "People We Meet on Vacation", autor: "Emily Henry", genero: "Rom-Com", copias: 4, img: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1748450140i/54985743.jpg", sinopsis: "Dos mejores amigos viajan cada verano juntos hasta que algo cambia." },
  { id: 9, titulo: "Orgullo y Prejuicio", autor: "Jane Austen", genero:"Romance", copias: 4, img:"https://images.cdn2.buscalibre.com/fit-in/360x360/69/73/697367de2a03bc98c4cb963d35ae2af2.jpg",  sinopsis: "La historia de Elizabeth Bennet y el señor Darcy, quienes deben superar sus prejuicios y diferencias sociales para descubrir el verdadero amor."},
  { id: 10,titulo:"IT", autor: "Stephen King", genero: "Terror", copias: 3, img:"https://images.cdn3.buscalibre.com/fit-in/360x360/df/43/df43923a18c57cfc02206ef54e50f192.jpg", sinopsis: "Un grupo de amigos enfrenta a un ser maligno que adopta la forma de sus peores miedos."},
  { id: 11,titulo:"Dracula", autor: "Bram Stoker", genero: "Terror", copias: 5, img:"https://images.cdn1.buscalibre.com/fit-in/360x360/53/c4/53c4c47d539b4e352cb284b18e2c80f8.jpg", sinopsis: "El conde Drácula viaja desde Transilvania a Inglaterra para expandir su maldición." },
  { id: 12, titulo: "Romper El Circulo", autor: "Colleen Hoover", genero: "Rom-Com", copias: 6, img:"https://images.cdn3.buscalibre.com/fit-in/360x360/aa/c4/aac495a3ef1a84293a0e7771c26b5c4e.jpg", sinopsis: "Lily Bloom inicia una relación con Ryle, pero debe enfrentarse a decisiones difíciles."},
  { id: 13, titulo: "Cementerio de Animales", autor: "Stephen King", genero:"Terror", copias: 4, img:"https://images.cdn2.buscalibre.com/fit-in/360x360/95/5b/955be07d4a94383ea56271dc865e5e8c.jpg", sinopsis: "Un cementerio cercano puede devolver a los muertos, pero con consecuencias horribles."},
  { id: 14, titulo: "Los 7 Maridos de Evelyn Hugo", autor: "Taylor Jenkins Reid", genero:"Novela", copias: 5, img:"https://data.livriz.com/media/mediaspace/F9AFB48D-741D-4834-B760-F59344EEFF34/45/24f40356-528a-4173-97ac-8a3bdfa65b7d/9789871886265.jpg", sinopsis:"La vida de una actriz de Hollywood y sus siete matrimonios."},
  { id: 15, titulo: "Farsa de amor a la Española", autor: "Elena Armas", genero: "Rom-Com", copias: 5, img:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9U6uCRLhb1-B1TnCCUQBucIQP0wYwuAB5rw&s", sinopsis:"Historia de engaños, celos y malentendidos en busca del amor."},
  { id: 16, titulo: "Breve historia del tiempo", autor: "Stephen Hawking", genero: "Divulgación científica", copias: 7, img:"https://m.media-amazon.com/images/I/71g2ednj0JL._AC_UF1000,1000_QL80_.jpg", sinopsis:"Exploración accesible de los misterios del universo, desde el Big Bang hasta los agujeros negros." },
  { id: 17, titulo: "El principito", autor: "Antoine de Saint-Exupéry", genero: "Fábula / Filosofía", copias: 10, img:"https://m.media-amazon.com/images/I/81zLwAwD2JL._AC_UF1000,1000_QL80_.jpg", sinopsis:"Un piloto perdido en el desierto descubre a un pequeño príncipe que comparte profundas lecciones sobre la vida y el amor." },
  { id: 18, titulo: "Sapiens: De animales a dioses", autor: "Yuval Noah Harari", genero: "Historia / Ensayo", copias: 6, img:"https://m.media-amazon.com/images/I/71Xw-tWwA2L._AC_UF1000,1000_QL80_.jpg", sinopsis:"Un recorrido por la historia de la humanidad, desde los primeros homo sapiens hasta las sociedades modernas." },
  { id: 19, titulo: "El código Da Vinci", autor: "Dan Brown", genero: "Thriller / Misterio", copias: 8, img:"https://m.media-amazon.com/images/I/81wbE63YXqL._AC_UF1000,1000_QL80_.jpg", sinopsis:"Un profesor de simbología se ve envuelto en una conspiración que conecta el arte, la religión y antiguos secretos ocultos." },
  { id: 20, titulo: "Los tres mosqueteros", autor: "Alexandre Dumas", genero: "Novela histórica / Aventuras", copias: 9, img:"https://m.media-amazon.com/images/I/91MWvytYhWL._AC_UF1000,1000_QL80_.jpg", sinopsis:"Las aventuras de D’Artagnan junto a Athos, Porthos y Aramis en la Francia del siglo XVII, entre honor, intrigas y duelos." },
  { id: 21, titulo: "Crimen y castigo", autor: "Fiódor Dostoyevski", genero: "Novela psicológica", copias: 10, img:"https://m.media-amazon.com/images/I/81wU5cXhD9L._AC_UF1000,1000_QL80_.jpg", sinopsis:"Un joven estudiante lucha con su conciencia tras cometer un asesinato en San Petersburgo." },
  { id: 22, titulo: "La sombra del viento", autor: "Carlos Ruiz Zafón", genero: "Misterio / Ficción histórica", copias: 9, img:"https://m.media-amazon.com/images/I/91f3Z1E8YdL._AC_UF1000,1000_QL80_.jpg", sinopsis:"Un joven descubre un libro maldito en el misterioso Cementerio de los Libros Olvidados." },
  { id: 23, titulo: "El alquimista", autor: "Paulo Coelho", genero: "Ficción / Filosofía", copias: 18, img:"https://m.media-amazon.com/images/I/71aFt4+OTOL._AC_UF1000,1000_QL80_.jpg", sinopsis:"La historia de un joven pastor que viaja en busca de su leyenda personal y el verdadero sentido de la vida." },
  { id: 24, titulo: "La Odisea", autor: "Homero", genero: "Épica / Clásico", copias: 7, img:"https://m.media-amazon.com/images/I/81k8X3h6d2L._AC_UF1000,1000_QL80_.jpg", sinopsis:"El legendario viaje de Ulises de regreso a Ítaca tras la guerra de Troya." },
  { id: 25, titulo: "Matar a un ruiseñor", autor: "Harper Lee", genero: "Drama / Derechos civiles", copias: 8, img:"https://m.media-amazon.com/images/I/81gepf1eMqL._AC_UF1000,1000_QL80_.jpg", sinopsis:"Un retrato de la injusticia racial en el sur de Estados Unidos a través de los ojos de una niña." },
  { id: 26, titulo: "El hobbit", autor: "J.R.R. Tolkien", genero: "Fantasía", copias: 16, img:"https://m.media-amazon.com/images/I/91b0C2YNSrL._AC_UF1000,1000_QL80_.jpg", sinopsis:"Bilbo Bolsón se embarca en una aventura épica junto a enanos y un mago en busca de un tesoro custodiado por un dragón." },
];

//  Navegación 
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

//  Autenticación 
function renderAuthButtons() {
  const div = document.getElementById("authButtons");
  if (session) {
    div.innerHTML = `<span>Hola, ${session.nombre}</span><button onclick="logout()">Salir</button>`;
  } else {
    div.innerHTML = `<button onclick="abrirModal('login')">Iniciar sesión</button><button onclick="abrirModal('registro')">Registrarse</button>`;
  }
}
function abrirModal(tipo) { 
  document.getElementById("modalAuth").classList.remove("oculto"); 
  document.getElementById("tituloModal").textContent = tipo==="login"?"Iniciar sesión":"Registrarse"; 
}
function cerrarModal() { document.getElementById("modalAuth").classList.add("oculto"); }
function logout(){ session=null; localStorage.removeItem("session"); renderAuthButtons(); }

// Manejo de login y registro
document.getElementById("formAuth").addEventListener("submit", e => {
  e.preventDefault();
  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const titulo = document.getElementById("tituloModal").textContent;

  if (!email || !password) {
    alert("⚠️ Completa todos los campos.");
    return;
  }

  if (titulo.includes("Registrarse")) {
    // Registro
    if (!nombre) {
      alert("⚠️ Ingresa un nombre para registrarte.");
      return;
    }
    if (usuarios.some(u => u.email === email)) {
      alert("⚠️ Ya existe un usuario con ese correo.");
      return;
    }
    const nuevoUsuario = { nombre, email, password };
    usuarios.push(nuevoUsuario);
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    session = { nombre, email };
    localStorage.setItem("session", JSON.stringify(session));
    alert("✅ Registro exitoso");
  } else {
    // Login
    const user = usuarios.find(u => u.email === email && u.password === password);
    if (!user) {
      alert("⚠️ Usuario o contraseña incorrectos.");
      return;
    }
    session = { nombre: user.nombre, email: user.email };
    localStorage.setItem("session", JSON.stringify(session));
    alert("✅ Sesión iniciada");
  }

  cerrarModal();
  renderAuthButtons();
  renderMisAlquileres();
  initFormAlquiler();
});

// Tabs de géneros
function renderFiltros() {
  const div = document.getElementById("filtrosGeneros");
  if (!div) return;
  const generos = [...new Set(libros.map(l => l.genero))];

  div.innerHTML = `
    <button class="tab-btn activo" data-genero="todos">Todos</button>
    ${generos.map(g => `<button class="tab-btn" data-genero="${g}">${g}</button>`).join("")}
  `;

  // Evento para cada botón
  div.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      div.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("activo"));
      btn.classList.add("activo");
      const genero = btn.dataset.genero;
      renderLibros(genero === "todos" ? null : genero);
    });
  });
}

// Libros 
function renderLibros(filtroGenero = null) {
  const div = document.getElementById("listaLibros");
  let lista = filtroGenero ? libros.filter(l => l.genero === filtroGenero) : libros;
  
  div.innerHTML = lista.map(b => {
    const activos = alquileres.filter(a => a.idLibro === b.id && !a.devuelto).length;
    const disponibles = b.copias - activos;
    return `<div class="card" onclick="verDetalleLibro(${b.id})">
              <img src="${b.img}">
              <h4>${b.titulo}</h4>
              <p>${b.autor}</p>
              <strong>${disponibles>0?disponibles+" disponibles":"No disponible"}</strong>
            </div>`;
  }).join("") || "<p>No hay libros en esta categoría.</p>";
}

function renderMisAlquileres() {
  const div = document.getElementById("misAlquileres");
  if (!div) return;
  const mios = alquileres.filter(a=>a.usuario===session?.email);
  div.innerHTML = mios.map(a=>{
    const libro=libros.find(l=>l.id===a.idLibro);
    return `<div class="card">${libro.titulo} - ${a.devuelto?"Devuelto":"En curso"}</div>`;
  }).join("")||"No alquilaste libros.";
}

//  Formulario alquiler 
function initFormAlquiler() {
  const select = document.getElementById("libroAlquiler");
  if (!select) return;
  select.innerHTML = '<option value="">-- Seleccioná un libro --</option>' + 
    libros.map(l => `<option value="${l.id}">${l.titulo}</option>`).join("");
  if (session) {
    document.getElementById("usuarioAlquiler").value = session.email;
  }
}

// Abrir modal de alquiler desde botón
function prepararAlquiler(idLibro) {
  if (!session) {
    alert("⚠️ Debes iniciar sesión o registrarte para alquilar un libro.");
    return;
  }
  libroSeleccionado = idLibro;
  document.getElementById("libroAlquiler").value = idLibro;
  document.getElementById("usuarioAlquiler").value = session.email;
  cerrarModalLibro();
  document.getElementById("modalAlquiler").classList.remove("oculto");
}

function cerrarModalAlquiler() {
  document.getElementById("modalAlquiler").classList.add("oculto");
}

// Evento submit alquiler
document.getElementById("formAlquiler").addEventListener("submit", e => {
  e.preventDefault();
  if (!session) {
    alert("⚠️ Debes iniciar sesión o registrarte para alquilar un libro.");
    return;
  }
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
  if (!div) return;
  div.textContent = txt;
  div.style.color = tipo==="error" ? "red" : "green";
  setTimeout(()=>div.textContent="", 3000);
}

//  Reservas 
document.getElementById("formReserva").addEventListener("submit", e => {
  e.preventDefault();
  if (!session) {
    alert("⚠️ Debes iniciar sesión o registrarte para hacer una reserva.");
    return;
  }

  const tipo = document.getElementById("tipoReserva").value;
  const personas = document.getElementById("personas").value;
  const fecha = document.getElementById("fechaReserva").value;
  const hora = document.getElementById("horaReserva").value;

  if (!fecha || !hora) {
    alert("⚠️ Debes completar la fecha y la hora.");
    return;
  }

  reservas.push({ tipo, personas, fecha, hora, usuario: session.email });
  localStorage.setItem("reservas", JSON.stringify(reservas));

  alert("✅ Reserva confirmada");
});

// Modal detalle 
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

// Ranking y carrusel 
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

// Inicializar
window.onload=()=>{
  renderAuthButtons();
  renderFiltros();   // 🔹 Tabs de géneros
  renderLibros();
  renderMisAlquileres();
  renderTopLibros();
  initFormAlquiler();
};

