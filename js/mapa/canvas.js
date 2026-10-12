// ==========================================================================
// MOTOR DE JUEGO 2D ARCADE EN HTML5 CANVAS - LIMA NOCTURNA A 60 FPS
// Incluye tráfico urbano animado, interpolación de ruta, faros dinámicos,
// partículas de humo, salpicaduras de lluvia y textos flotantes de puntaje.
// ==========================================================================
"use strict";

const CANVAS_MAPA = (function () {
  let canvas = null;
  let ctx = null;
  let animFrameId = null;

  // Estado del motor gráfico
  let estadoRef = null;
  let pedidoRef = null;
  let climaActual = "Despejado";

  // Posición e interpolación de la moto de Chambi
  let chambiPos = { x: 180, y: 310 };
  let viajeAnim = {
    activo: false,
    origen: { x: 180, y: 310 },
    destino: { x: 180, y: 310 },
    tiempoInicio: 0,
    duracion: 1000,
    onCompletado: null,
  };

  // Partículas
  const particulasHumo = [];
  const textosFlotantes = [];
  const gotasLluvia = [];
  const ondasCharco = [];

  // Tráfico urbano de Lima (Cústers, taxis y autos particulares)
  const vehiculosTrafico = [
    { x: 100, y: 0, velocidad: 1.8, tipo: "taxi", color: "#ffd000", via: "javier_prado" },
    { x: 300, y: 0, velocidad: 1.4, tipo: "combi", color: "#00ff88", via: "javier_prado" },
    { x: 0, y: 80, velocidad: 2.2, tipo: "auto", color: "#00f0ff", via: "via_expresa" },
    { x: 0, y: 240, velocidad: 1.6, tipo: "auto", color: "#ff3366", via: "via_expresa" },
  ];

  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext("2d");

    ajustarDimensiones();
    window.addEventListener("resize", ajustarDimensiones);

    // Inicializar lluvia
    gotasLluvia.length = 0;
    for (let i = 0; i < 60; i++) {
      gotasLluvia.push({
        x: Math.random() * (canvas.width / (window.devicePixelRatio || 1)),
        y: Math.random() * (canvas.height / (window.devicePixelRatio || 1)),
        velocidad: 6 + Math.random() * 8,
        longitud: 8 + Math.random() * 10,
      });
    }

    // Iniciar bucle continuo a 60 FPS
    if (animFrameId) cancelAnimationFrame(animFrameId);
    bucleJuego();
  }

  function ajustarDimensiones() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr || 800 * dpr;
    canvas.height = rect.height * dpr || 440 * dpr;
  }

  // Convierte coordenadas de distrito a píxeles del Canvas
  function distritoAPixeles(distrito) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    return {
      x: (distrito.x / 420.0) * (w - 120) + 60,
      y: (distrito.y / 420.0) * (h - 100) + 50,
    };
  }

  // Activa el viaje animado de Chambi entre distritos
  function animarViaje(origenDistrito, destinoDistrito, duracionMs = 900, onLlegada = null) {
    const origPx = distritoAPixeles(origenDistrito);
    const destPx = distritoAPixeles(destinoDistrito);

    viajeAnim.activo = true;
    viajeAnim.origen = origPx;
    viajeAnim.destino = destPx;
    viajeAnim.tiempoInicio = performance.now();
    viajeAnim.duracion = duracionMs;
    viajeAnim.onCompletado = onLlegada;

    // Disparar sonido del motor
    AUDIO.sonarMotor();
  }

  // Agrega texto flotante estilo RPG / Arcade al completar eventos
  function agregarTextoFlotante(texto, x, y, color = "#00ff88") {
    textosFlotantes.push({
      texto,
      x,
      y,
      alpha: 1.0,
      vy: -1.2,
      color,
      tiempoVida: 60,
    });
  }

  // ==========================================================================
  // BUCLE DE RENDERIZADO CONTINUO (60 FPS)
  // ==========================================================================
  function bucleJuego() {
    actualizar();
    dibujar();
    animFrameId = requestAnimationFrame(bucleJuego);
  }

  function actualizar() {
    const ahora = performance.now();

    // Actualizar animación de movimiento de Chambi
    if (viajeAnim.activo) {
      const progreso = Math.min(1.0, (ahora - viajeAnim.tiempoInicio) / viajeAnim.duracion);
      // Easing suave (Cubic ease-in-out)
      const t = progreso < 0.5 ? 4 * progreso * progreso * progreso : 1 - Math.pow(-2 * progreso + 2, 3) / 2;

      chambiPos.x = viajeAnim.origen.x + (viajeAnim.destino.x - viajeAnim.origen.x) * t;
      chambiPos.y = viajeAnim.origen.y + (viajeAnim.destino.y - viajeAnim.origen.y) * t;

      // Generar partículas de humo de escape
      if (Math.random() < 0.6) {
        particulasHumo.push({
          x: chambiPos.x + (Math.random() * 6 - 3),
          y: chambiPos.y + 10,
          vx: (Math.random() - 0.5) * 0.8,
          vy: 0.5 + Math.random() * 0.8,
          radio: 3 + Math.random() * 3,
          alpha: 0.6,
        });
      }

      if (progreso >= 1.0) {
        viajeAnim.activo = false;
        chambiPos.x = viajeAnim.destino.x;
        chambiPos.y = viajeAnim.destino.y;
        if (typeof viajeAnim.onCompletado === "function") {
          viajeAnim.onCompletado();
        }
      }
    } else if (estadoRef && estadoRef.distritoActual) {
      const actualPx = distritoAPixeles(estadoRef.distritoActual);
      chambiPos.x = actualPx.x;
      chambiPos.y = actualPx.y;
    }

    // Actualizar partículas de humo
    for (let i = particulasHumo.length - 1; i >= 0; i--) {
      const p = particulasHumo[i];
      p.x += p.vx;
      p.y += p.vy;
      p.radio += 0.15;
      p.alpha -= 0.02;
      if (p.alpha <= 0) particulasHumo.splice(i, 1);
    }

    // Actualizar textos flotantes
    for (let i = textosFlotantes.length - 1; i >= 0; i--) {
      const tf = textosFlotantes[i];
      tf.y += tf.vy;
      tf.alpha -= 0.016;
      if (tf.alpha <= 0) textosFlotantes.splice(i, 1);
    }

    // Actualizar tráfico vehicular
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    vehiculosTrafico.forEach((v) => {
      if (v.via === "javier_prado") {
        v.x += v.velocidad;
        if (v.x > w + 40) v.x = -40;
      } else {
        v.y += v.velocidad;
        if (v.y > h + 40) v.y = -40;
      }
    });

    // Actualizar lluvia y charcos
    if (climaActual === "Lluvia Fuerte" || climaActual === "Garúa Limeña") {
      gotasLluvia.forEach((g) => {
        g.y += g.velocidad;
        if (g.y > h) {
          g.y = -10;
          g.x = Math.random() * w;
          // Pequeña salpicadura
          if (Math.random() < 0.25) {
            ondasCharco.push({ x: g.x, y: h - 15, radio: 1, alpha: 0.5 });
          }
        }
      });

      for (let i = ondasCharco.length - 1; i >= 0; i--) {
        const o = ondasCharco[i];
        o.radio += 0.8;
        o.alpha -= 0.03;
        if (o.alpha <= 0) ondasCharco.splice(i, 1);
      }
    }
  }

  function dibujar() {
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Asfalto y cuadrícula de Lima
    ctx.fillStyle = "#070b12";
    ctx.fillRect(0, 0, w, h);

    dibujarCuadricula(ctx, w, h);
    dibujarAvenidas(ctx, w, h);
    dibujarPostesLuz(ctx, w, h);
    dibujarTrafico(ctx, w, h);

    // 2. Ruta activa trazada con neón
    if (pedidoRef && estadoRef && !estadoRef.terminado) {
      dibujarRutaActiva(ctx, pedidoRef);
    }

    // 3. Nodos de distritos con halos interactivos
    dibujarDistritos(ctx);

    // 4. Partículas de humo de la moto
    particulasHumo.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 210, 240, ${p.alpha})`;
      ctx.fill();
    });

    // 5. Dibujar a Chambi con Faros Dinámicos
    dibujarChambi(ctx);

    // 6. Efectos de Clima
    dibujarClima(ctx, w, h);

    // 7. Textos Flotantes de Puntaje
    textosFlotantes.forEach((tf) => {
      ctx.save();
      ctx.fillStyle = tf.color;
      ctx.globalAlpha = Math.max(0, tf.alpha);
      ctx.font = "bold 13px system-ui, monospace";
      ctx.shadowColor = tf.color;
      ctx.shadowBlur = 8;
      ctx.textAlign = "center";
      ctx.fillText(tf.texto, tf.x, tf.y);
      ctx.restore();
    });

    ctx.restore();
  }

  function dibujarCuadricula(ctx, w, h) {
    ctx.strokeStyle = "rgba(0, 240, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  function dibujarAvenidas(ctx, w, h) {
    // Vía Expresa (Norte a Sur)
    ctx.save();
    ctx.strokeStyle = "#162032";
    ctx.lineWidth = 22;
    ctx.beginPath();
    ctx.moveTo(w * 0.48, 0);
    ctx.lineTo(w * 0.48, h);
    ctx.stroke();

    // Línea divisoria central
    ctx.strokeStyle = "rgba(255, 208, 0, 0.35)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.stroke();

    // Av. Javier Prado (Oeste a Este)
    ctx.beginPath();
    ctx.moveTo(0, h * 0.42);
    ctx.lineTo(w, h * 0.42);
    ctx.strokeStyle = "#162032";
    ctx.lineWidth = 22;
    ctx.setLineDash([]);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 208, 0, 0.35)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.stroke();
    ctx.restore();
  }

  function dibujarPostesLuz(ctx, w, h) {
    const postes = [
      { x: w * 0.48 + 18, y: h * 0.2 },
      { x: w * 0.48 - 18, y: h * 0.65 },
      { x: w * 0.25, y: h * 0.42 - 18 },
      { x: w * 0.75, y: h * 0.42 + 18 },
    ];

    postes.forEach((pt) => {
      // Halo cálido
      const grad = ctx.createRadialGradient(pt.x, pt.y, 2, pt.x, pt.y, 42);
      grad.addColorStop(0, "rgba(255, 230, 140, 0.28)");
      grad.addColorStop(1, "rgba(255, 230, 140, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 42, 0, Math.PI * 2);
      ctx.fill();

      // Bombilla
      ctx.fillStyle = "#fff4cc";
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function dibujarTrafico(ctx, w, h) {
    vehiculosTrafico.forEach((v) => {
      ctx.save();
      if (v.via === "javier_prado") {
        const y = h * 0.42 + (v.velocidad > 1.5 ? 5 : -5);
        ctx.fillStyle = v.color;
        ctx.fillRect(v.x, y - 4, 18, 9);

        // Faros delanteros
        ctx.fillStyle = "#fff9db";
        ctx.fillRect(v.x + 18, y - 3, 2, 7);
        // Luces rojas traseras
        ctx.fillStyle = "#ff2a55";
        ctx.fillRect(v.x - 2, y - 3, 2, 7);
      } else {
        const x = w * 0.48 + (v.velocidad > 1.8 ? 5 : -5);
        ctx.fillStyle = v.color;
        ctx.fillRect(x - 4, v.y, 9, 18);

        ctx.fillStyle = "#fff9db";
        ctx.fillRect(x - 3, v.y + 18, 7, 2);
        ctx.fillStyle = "#ff2a55";
        ctx.fillRect(x - 3, v.y - 2, 7, 2);
      }
      ctx.restore();
    });
  }

  function dibujarDistritos(ctx) {
    MOTOR.DISTRITOS.forEach((d) => {
      const p = distritoAPixeles(d);

      let colorZona = "#00ff88";
      let colorFondo = "rgba(0, 255, 136, 0.12)";
      if (d.riesgo === "media") {
        colorZona = "#ffd000";
        colorFondo = "rgba(255, 208, 0, 0.14)";
      } else if (d.riesgo === "alta") {
        colorZona = "#ff3366";
        colorFondo = "rgba(255, 51, 102, 0.22)";
      }

      ctx.save();
      // Halo
      ctx.beginPath();
      ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
      ctx.fillStyle = colorFondo;
      ctx.fill();
      ctx.strokeStyle = colorZona;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Centro
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = colorZona;
      ctx.fill();

      // Texto
      ctx.fillStyle = "#f0f4f8";
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(d.nombre, p.x, p.y + 36);

      ctx.fillStyle = colorZona;
      ctx.font = "8px system-ui, sans-serif";
      ctx.fillText(d.riesgo.toUpperCase(), p.x, p.y + 47);
      ctx.restore();
    });
  }

  function dibujarRutaActiva(ctx, pedido) {
    const o = distritoAPixeles(pedido.origen);
    const d = distritoAPixeles(pedido.destino);

    ctx.save();
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 5]);
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.lineTo(d.x, d.y);
    ctx.stroke();

    // Marcador destino con pulso
    ctx.beginPath();
    ctx.arc(d.x, d.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd000";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  function dibujarChambi(ctx) {
    ctx.save();

    // 1. Cono de faro delantero nocturno
    const angulo = viajeAnim.activo
      ? Math.atan2(viajeAnim.destino.y - viajeAnim.origen.y, viajeAnim.destino.x - viajeAnim.origen.x)
      : Math.PI / 2; // Hacia abajo si está quieto

    const luzDist = 55;
    const luzApertura = 0.55;

    const gradLuz = ctx.createRadialGradient(chambiPos.x, chambiPos.y, 5, chambiPos.x, chambiPos.y, luzDist);
    gradLuz.addColorStop(0, "rgba(255, 250, 180, 0.45)");
    gradLuz.addColorStop(1, "rgba(255, 250, 180, 0)");

    ctx.beginPath();
    ctx.moveTo(chambiPos.x, chambiPos.y);
    ctx.arc(chambiPos.x, chambiPos.y, luzDist, angulo - luzApertura, angulo + luzApertura);
    ctx.closePath();
    ctx.fillStyle = gradLuz;
    ctx.fill();

    // 2. Halo protector neón
    ctx.beginPath();
    ctx.arc(chambiPos.x, chambiPos.y, 16, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 240, 255, 0.35)";
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 14;
    ctx.fill();

    // 3. Moto de Chambi (Emoji con escala y animación)
    ctx.font = "22px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🛵", chambiPos.x, chambiPos.y);

    // 4. Cartel de nombre
    ctx.fillStyle = "#00f0ff";
    ctx.font = "bold 10px monospace";
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 4;
    ctx.fillText("CHAMBI", chambiPos.x, chambiPos.y - 24);

    ctx.restore();
  }

  function dibujarClima(ctx, w, h) {
    if (climaActual === "Lluvia Fuerte" || climaActual === "Garúa Limeña") {
      ctx.save();
      ctx.strokeStyle = climaActual === "Lluvia Fuerte" ? "rgba(0, 240, 255, 0.38)" : "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = climaActual === "Lluvia Fuerte" ? 1.5 : 1;

      gotasLluvia.forEach((g) => {
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        ctx.lineTo(g.x + 1, g.y + g.longitud);
        ctx.stroke();
      });

      // Ondas de charcos
      ondasCharco.forEach((o) => {
        ctx.beginPath();
        ctx.ellipse(o.x, o.y, o.radio, o.radio * 0.4, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 240, 255, ${o.alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      ctx.restore();
    }
  }

  // Actualiza la referencia del estado del juego
  function render(estado, pedido, clima) {
    estadoRef = estado;
    pedidoRef = pedido;
    climaActual = clima || "Despejado";
  }

  return {
    init,
    render,
    animarViaje,
    agregarTextoFlotante,
    distritoAPixeles,
  };
})();
