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

  // Constelacion del fondo: puntos que flotan despacio, lineas entre los cercanos y, con raton, lineas hacia el cursor.
  // Colores del tema (ambar y tinta). Menos puntos en pantallas chicas; quieta con "reducir movimiento"; pausada si la
  // pestana no se ve (requestAnimationFrame ya no corre).
  (() => {
    const lienzo = document.createElement("canvas");
    lienzo.className = "constelacion";
    lienzo.setAttribute("aria-hidden", "true");
    document.body.prepend(lienzo);
    raiz.classList.add("con-constelacion");
    const ctx = lienzo.getContext("2d");
    const quieta = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DISTANCIA = 140, DISTANCIA_CURSOR = 190;
    let ancho = 0, alto = 0, puntos = [], cursor = null, colores = {};

    function leerColores() {
      const s = getComputedStyle(raiz);
      const oscuro = raiz.dataset.temaEfectivo === "oscuro";
      colores = { punto: s.getPropertyValue("--acento").trim(), linea: s.getPropertyValue("--tinta").trim(),
                  fuerzaLinea: oscuro ? 0.16 : 0.13, fuerzaPunto: oscuro ? 0.7 : 0.55 };
    }

    function medir() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      ancho = innerWidth; alto = innerHeight;
      lienzo.width = ancho * dpr; lienzo.height = alto * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cuantos = Math.round(Math.min(110, Math.max(28, (ancho * alto) / 13000)));
      while (puntos.length < cuantos) {
        const ang = Math.random() * Math.PI * 2, vel = 0.12 + Math.random() * 0.22;
        puntos.push({ x: Math.random() * ancho, y: Math.random() * alto, vx: Math.cos(ang) * vel, vy: Math.sin(ang) * vel,
                      r: 1 + Math.random() * 1.3 });
      }
      puntos.length = cuantos;
    }

    function dibujar() {
      ctx.clearRect(0, 0, ancho, alto);
      ctx.lineWidth = 1;
      for (let i = 0; i < puntos.length; i++) {
        const a = puntos[i];
        for (let j = i + 1; j < puntos.length; j++) {
          const b = puntos[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < DISTANCIA) {
            ctx.globalAlpha = (1 - d / DISTANCIA) * colores.fuerzaLinea;
            ctx.strokeStyle = colores.linea;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        if (cursor) {
          const d = Math.hypot(a.x - cursor.x, a.y - cursor.y);
          if (d < DISTANCIA_CURSOR) {
            ctx.globalAlpha = (1 - d / DISTANCIA_CURSOR) * colores.fuerzaLinea * 2.2;
            ctx.strokeStyle = colores.punto;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(cursor.x, cursor.y); ctx.stroke();
          }
        }
      }
      ctx.fillStyle = colores.punto;
      ctx.globalAlpha = colores.fuerzaPunto;
      for (const p of puntos) { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
    }

    function mover() {
      for (const p of puntos) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -20) p.x = ancho + 20; else if (p.x > ancho + 20) p.x = -20;
        if (p.y < -20) p.y = alto + 20; else if (p.y > alto + 20) p.y = -20;
      }
    }

    function fotograma() {
      mover();
      dibujar();
      requestAnimationFrame(fotograma);
    }

    leerColores();
    medir();
    dibujar();
    lienzo.classList.add("lista");
    let espera;
    addEventListener("resize", () => { clearTimeout(espera); espera = setTimeout(() => { medir(); dibujar(); }, 150); });
    new MutationObserver(() => { leerColores(); dibujar(); }).observe(raiz, { attributes: true, attributeFilter: ["data-tema-efectivo"] });
    if (quieta) return;
    if (matchMedia("(pointer: fine)").matches) {
      addEventListener("pointermove", (e) => { cursor = { x: e.clientX, y: e.clientY }; }, { passive: true });
      raiz.addEventListener("pointerleave", () => { cursor = null; });
    }
    requestAnimationFrame(fotograma);
  })();

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
