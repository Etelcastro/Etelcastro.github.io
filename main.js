// Tema claro / oscuro / del sistema, barra con borde al bajar y proyectos que aparecen al llegar a ellos.
(() => {
  const raiz = document.documentElement;
  raiz.classList.add("js");

  const sistemaOscuro = matchMedia("(prefers-color-scheme: dark)");
  const elegido = () => raiz.dataset.tema || "";   // "", "claro" u "oscuro"
  const efectivo = () => elegido() || (sistemaOscuro.matches ? "oscuro" : "claro");
  const boton = document.getElementById("tema");
  const texto = document.getElementById("tema-texto");

  function pintarTema() {
    raiz.dataset.temaEfectivo = efectivo();
    texto.textContent = efectivo() === "oscuro" ? "Oscuro" : "Claro";
    boton.setAttribute("aria-label", "Tema " + (efectivo() === "oscuro" ? "oscuro" : "claro") + ". Cambiar a " + (efectivo() === "oscuro" ? "claro" : "oscuro"));
  }
  boton.addEventListener("click", () => {
    const nuevo = efectivo() === "oscuro" ? "claro" : "oscuro";
    // Si coincide con el del sistema, se olvida la eleccion: asi vuelve a seguir al sistema.
    const igualAlSistema = (nuevo === "oscuro") === sistemaOscuro.matches;
    if (igualAlSistema) delete raiz.dataset.tema; else raiz.dataset.tema = nuevo;
    try { if (igualAlSistema) localStorage.removeItem("tema"); else localStorage.setItem("tema", nuevo); } catch (e) {}
    pintarTema();
  });
  sistemaOscuro.addEventListener("change", pintarTema);
  pintarTema();

  const barra = document.querySelector(".barra");
  const sombra = () => barra.classList.toggle("con-sombra", scrollY > 8);
  addEventListener("scroll", sombra, { passive: true });
  sombra();

  const aparecen = document.querySelectorAll(".aparece");
  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver((entradas) => {
      for (const e of entradas) if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    aparecen.forEach((el) => obs.observe(el));
  } else {
    aparecen.forEach((el) => el.classList.add("visible"));
  }
})();
