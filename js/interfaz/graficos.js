// ==========================================================================
// RENDERIZADO DE GRÁFICOS ESTADÍSTICOS COMPARATIVOS EN CANVAS
// ==========================================================================
"use strict";

const GRAFICOS = (function () {
  function renderGraficoPuntajes(canvasId, resultados) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr || 460;
    canvas.height = rect.height * dpr || 260;
    ctx.scale(dpr, dpr);

    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0e17";
    ctx.fillRect(0, 0, w, h);

    // Ejes y márgenes
    const padding = { top: 30, right: 30, bottom: 40, left: 55 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    // Calcular escala Y
    const valores = resultados.map((r) => r.puntajeMedio);
    const minVal = Math.min(-120, Math.min(...valores));
    const maxVal = Math.max(120, Math.max(...valores));
    const rango = maxVal - minVal;

    // Línea base Y = 0
    const yCero = padding.top + chartH * (maxVal / rango);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, yCero);
    ctx.lineTo(padding.left + chartW, yCero);
    ctx.stroke();

    // Dibujar barras para cada agente
    const barW = chartW / (resultados.length * 1.5);
    const gap = (chartW - barW * resultados.length) / (resultados.length + 1);

    resultados.forEach((res, i) => {
      const bx = padding.left + gap + i * (barW + gap);
      const val = res.puntajeMedio;
      const altura = (Math.abs(val) / rango) * chartH;
      const by = val >= 0 ? yCero - altura : yCero;

      // Color de la barra
      ctx.fillStyle = res.agente.color || "#00f0ff";
      ctx.fillRect(bx, by, barW, altura);

      // Margen de error (bigotes)
      if (res.errorStd) {
        const errorH = (res.errorStd / rango) * chartH;
        const centroX = bx + barW / 2;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centroX, by - errorH);
        ctx.lineTo(centroX, by + (val < 0 ? altura + errorH : 0));
        ctx.stroke();
      }

      // Etiqueta del valor numérico
      ctx.fillStyle = "#f0f4f8";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(val.toFixed(1), bx + barW / 2, val >= 0 ? by - 6 : by + altura + 12);

      // Nombre del agente
      ctx.fillStyle = "#8b9bb4";
      ctx.font = "9px system-ui";
      const shortName = res.agente.nombre.split(" ")[1] || res.agente.nombre;
      ctx.fillText(shortName, bx + barW / 2, h - 12);
    });
  }

  function renderGraficoSupervivencia(canvasId, resultados) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr || 460;
    canvas.height = rect.height * dpr || 260;
    ctx.scale(dpr, dpr);

    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a0e17";
    ctx.fillRect(0, 0, w, h);

    const padding = { top: 30, right: 30, bottom: 40, left: 45 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    // Líneas guía 0%, 50%, 100%
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    [0, 50, 100].forEach((pct) => {
      const y = padding.top + chartH * (1 - pct / 100);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + chartW, y);
      ctx.stroke();

      ctx.fillStyle = "#5a6882";
      ctx.font = "9px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${pct}%`, padding.left - 6, y + 3);
    });

    const barW = chartW / (resultados.length * 1.5);
    const gap = (chartW - barW * resultados.length) / (resultados.length + 1);

    resultados.forEach((res, i) => {
      const bx = padding.left + gap + i * (barW + gap);
      const pct = res.tasaSupervivencia;
      const altura = (pct / 100) * chartH;
      const by = padding.top + chartH - altura;

      ctx.fillStyle = res.agente.color || "#00ff88";
      ctx.fillRect(bx, by, barW, altura);

      // Etiqueta %
      ctx.fillStyle = "#f0f4f8";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${pct.toFixed(0)}%`, bx + barW / 2, by - 6);

      // Nombre del agente
      ctx.fillStyle = "#8b9bb4";
      ctx.font = "9px system-ui";
      const shortName = res.agente.nombre.split(" ")[1] || res.agente.nombre;
      ctx.fillText(shortName, bx + barW / 2, h - 12);
    });
  }

  return {
    renderGraficoPuntajes,
    renderGraficoSupervivencia,
  };
})();
