// Ejemplo de login
async function login(email, password) {
  const res = await fetch("http://127.0.0.1:5000/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.status === "success") {
    localStorage.setItem("session", JSON.stringify(data.user));
    alert("Bienvenido " + data.user.nombre);
  } else {
    alert(data.message);
  }
}

// Ejemplo de registro
async function register(nombre, email, password) {
  const res = await fetch("http://127.0.0.1:5000/register", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ nombre, email, password })
  });
  const data = await res.json();
  alert(data.message);
}
