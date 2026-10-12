// ==========================================================================
// CONTROLADOR PRINCIPAL - EL TURNO DE CHAMBI (LIMA NOCTURNA)
// ==========================================================================
"use strict";

const APP = (function () {
  // Lista oficial de los 5 agentes canónicos
  const AGENTES = [
    AGENTE_BASE,
    AGENTE_REFLEJO,
    AGENTE_MODELO,
    AGENTE_OBJETIVOS,
    AGENTE_UTILIDAD,
  ];

  let modoActual = "agente"; // 'manual' o 'agente'
  let agenteSeleccionado = AGENTE_UTILIDAD;
  let semillaActual = 2025;
  let jornadaActual = null;
  let estadoActual = null;
  let timerPaso = null;
  let velocidadMs = 900;
  let enEjecucionAutomatica = false;

  // Inicialización de la aplicación
  function init() {
    CANVAS_MAPA.init("cityCanvas");
    configurarTabs();
    configurarControles();
    configurarSlidersUtilidad();
    reiniciarPartida();
  }

  // Navegación de pestañas
  function configurarTabs() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");
        tabBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        document.querySelectorAll(".tab-panel").forEach((panel) => {
          panel.classList.remove("active");
        });
        const activePanel = document.getElementById(targetTab);
        if (activePanel) activePanel.classList.add("active");

        detenerAuto();
        if (targetTab === "tab-simulador") {
          modoActual = "agente";
          document.getElementById("btnJugarManual").style.display = "none";
          document.getElementById("btnAutoAgente").style.display = "inline-flex";
          document.getElementById("selectAgente").style.display = "inline-block";
          document.getElementById("panelAccionesManual").style.display = "none";
          reiniciarPartida();
        } else if (targetTab === "tab-manual") {
          modoActual = "manual";
          document.getElementById("btnJugarManual").style.display = "inline-flex";
          document.getElementById("btnAutoAgente").style.display = "none";
          document.getElementById("selectAgente").style.display = "none";
          document.getElementById("panelAccionesManual").style.display = "grid";
          reiniciarPartida();
        } else if (targetTab === "tab-benchmark") {
          ejecutarBenchmarkMasivo(200);
        }
      });
    });
  }

  // Configuración de eventos de UI
  function configurarControles() {
    // Selector de Agente
    const selAgente = document.getElementById("selectAgente");
    if (selAgente) {
      selAgente.addEventListener("change", (e) => {
        const agId = e.target.value;
        agenteSeleccionado = AGENTES.find((a) => a.id === agId) || AGENTE_UTILIDAD;
        reiniciarPartida();
      });
    }

    // Input de Semilla
    const inputSemilla = document.getElementById("inputSemilla");
    if (inputSemilla) {
      inputSemilla.addEventListener("change", (e) => {
        semillaActual = parseInt(e.target.value) || 2025;
        reiniciarPartida();
      });
    }

    // Selector de Velocidad
    const selVel = document.getElementById("selectVelocidad");
    if (selVel) {
      selVel.addEventListener("change", (e) => {
        velocidadMs = parseInt(e.target.value) || 900;
        if (enEjecucionAutomatica) {
          detenerAuto();
          iniciarAuto();
        }
      });
    }

    // Botones de ejecución
    const btnPaso = document.getElementById("btnSiguientePaso");
    if (btnPaso) {
      btnPaso.addEventListener("click", () => {
        if (modoActual === "agente") darPasoAgente();
      });
    }

    const btnAuto = document.getElementById("btnAutoAgente");
    if (btnAuto) {
      btnAuto.addEventListener("click", () => {
        if (enEjecucionAutomatica) {
          detenerAuto();
        } else {
          iniciarAuto();
        }
      });
    }

    const btnReset = document.getElementById("btnReiniciar");
    if (btnReset) {
      btnReset.addEventListener("click", () => reiniciarPartida());
    }

    // Botones de control manual
    const btnAceptarManual = document.getElementById("btnAceptarManual");
    const btnRechazarManual = document.getElementById("btnRechazarManual");
    const btnTanqueoManual = document.getElementById("btnTanqueoManual");
    const btnCargaManual = document.getElementById("btnCargaManual");

    if (btnAceptarManual) btnAceptarManual.addEventListener("click", () => darPasoManual("aceptar"));
    if (btnRechazarManual) btnRechazarManual.addEventListener("click", () => darPasoManual("rechazar"));
    if (btnTanqueoManual) btnTanqueoManual.addEventListener("click", () => darPasoManual("recargar_combustible"));
    if (btnCargaManual) btnCargaManual.addEventListener("click", () => darPasoManual("cargar_bateria"));

    // Botón descargar telemetría
    const btnDescargar = document.getElementById("btnDescargarCSV");
    if (btnDescargar) {
      btnDescargar.addEventListener("click", () => TELEMETRIA.descargarCSV());
    }

    // Botón silenciar / activar audio
    const btnAudio = document.getElementById("btnToggleAudio");
    if (btnAudio) {
      btnAudio.addEventListener("click", () => {
        const mut = AUDIO.toggleMute();
        btnAudio.innerHTML = mut ? `<span>🔇</span> Audio: OFF` : `<span>🔊</span> Audio: ON`;
        btnAudio.style.color = mut ? `var(--text-muted)` : `var(--accent-yellow)`;
      });
    }
  }

  // Vinculación de deslizadores de la función de utilidad
  function configurarSlidersUtilidad() {
    const slPago = document.getElementById("sliderPago");
    const slRiesgo = document.getElementById("sliderRiesgo");
    const slRecursos = document.getElementById("sliderRecursos");
    const slRating = document.getElementById("sliderRating");

    function actualizarPesos() {
      if (slPago) {
        AGENTE_UTILIDAD.pesos.wPago = parseFloat(slPago.value);
        document.getElementById("valPago").textContent = slPago.value;
      }
      if (slRiesgo) {
        AGENTE_UTILIDAD.pesos.wRiesgo = parseFloat(slRiesgo.value);
        document.getElementById("valRiesgo").textContent = slRiesgo.value;
      }
      if (slRecursos) {
        AGENTE_UTILIDAD.pesos.wRecursos = parseFloat(slRecursos.value);
        document.getElementById("valRecursos").textContent = slRecursos.value;
      }
      if (slRating) {
        AGENTE_UTILIDAD.pesos.wRating = parseFloat(slRating.value);
        document.getElementById("valRating").textContent = slRating.value;
      }
    }

    [slPago, slRiesgo, slRecursos, slRating].forEach((sl) => {
      if (sl) sl.addEventListener("input", actualizarPesos);
    });
  }

  // Reinicia la jornada actual
  function reiniciarPartida() {
    detenerAuto();
    jornadaActual = MOTOR.generarJornada(semillaActual);
    estadoActual = MOTOR.crearEstadoInicial();
    actualizarUI();
  }

  // Ciclo automático para ver al agente
  function iniciarAuto() {
    enEjecucionAutomatica = true;
    const btn = document.getElementById("btnAutoAgente");
    if (btn) {
      btn.innerHTML = `<span>⏸️</span> Pausar`;
      btn.classList.add("btn-danger");
    }
    timerPaso = setInterval(() => {
      if (!estadoActual.terminado) {
        darPasoAgente();
      } else {
        detenerAuto();
      }
    }, velocidadMs);
  }

  function detenerAuto() {
    enEjecucionAutomatica = false;
    if (timerPaso) {
      clearInterval(timerPaso);
      timerPaso = null;
    }
    const btn = document.getElementById("btnAutoAgente");
    if (btn) {
      btn.innerHTML = `<span>▶️</span> Auto Run`;
      btn.classList.remove("btn-danger");
    }
  }

  // Ejecuta efectos visuales arcade, textos flotantes y sonido sintetizado
  function ejecutarEfectosAccion(accion, pedido, estadoPre, estadoPost) {
    const destPx = CANVAS_MAPA.distritoAPixeles(pedido.destino);
    const actualPx = CANVAS_MAPA.distritoAPixeles(estadoPre.distritoActual);

    if (accion === "aceptar") {
      CANVAS_MAPA.animarViaje(pedido.origen, pedido.destino, Math.min(velocidadMs * 0.8, 950), () => {
        if (estadoPost.asaltosSufridos > estadoPre.asaltosSufridos) {
          CANVAS_MAPA.agregarTextoFlotante("🚨 ¡ROBO EN ZONA ROJA!", destPx.x, destPx.y - 18, "#ff3366");
          AUDIO.sonarAlerta();
        } else {
          CANVAS_MAPA.agregarTextoFlotante(`+S/ ${pedido.pagoTotal.toFixed(1)}`, destPx.x, destPx.y - 18, "#00ff88");
          AUDIO.sonarCobra();
        }
      });
    } else if (accion === "recargar_combustible") {
      CANVAS_MAPA.agregarTextoFlotante("⛽ +55% Gasolina (Grifo)", actualPx.x, actualPx.y - 18, "#ffd000");
      AUDIO.sonarRecarga();
    } else if (accion === "cargar_bateria") {
      CANVAS_MAPA.agregarTextoFlotante("🔋 +45% Batería (Tambo)", actualPx.x, actualPx.y - 18, "#00f0ff");
      AUDIO.sonarRecarga();
    } else {
      CANVAS_MAPA.agregarTextoFlotante("❌ Rechazado", actualPx.x, actualPx.y - 18, "#8b9bb4");
      AUDIO.sonarAlerta();
    }
  }

  // Paso autónomo del agente activo
  function darPasoAgente() {
    if (estadoActual.terminado) return;
    const pedido = jornadaActual.pedidos[estadoActual.turnoActual];

    // Ciclo Russell & Norvig: 1) Percibir -> 2) Decidir -> 3) Actuar
    const percepcion = agenteSeleccionado.percibir(estadoActual, pedido, jornadaActual);
    const decision = agenteSeleccionado.decidir(percepcion, estadoActual, pedido);

    const estadoPre = JSON.parse(JSON.stringify(estadoActual));
    estadoActual = MOTOR.darPaso(estadoActual, jornadaActual, decision.accion, decision.razon);

    // Registro de telemetría para ML
    TELEMETRIA.registrarPaso(
      semillaActual,
      estadoActual.turnoActual,
      estadoPre,
      pedido,
      agenteSeleccionado.id,
      decision,
      estadoActual
    );

    ejecutarEfectosAccion(decision.accion, pedido, estadoPre, estadoActual);
    mostrarPensamientoAgente(agenteSeleccionado, decision);
    actualizarUI();

    // Notificación sonora para el siguiente pedido
    if (!estadoActual.terminado) {
      setTimeout(() => AUDIO.sonarPedido(), 350);
    }
  }

  // Paso manual del jugador
  function darPasoManual(accion) {
    if (estadoActual.terminado) return;
    const pedido = jornadaActual.pedidos[estadoActual.turnoActual];
    const estadoPre = JSON.parse(JSON.stringify(estadoActual));

    estadoActual = MOTOR.darPaso(estadoActual, jornadaActual, accion, "Decisión del jugador humano");

    TELEMETRIA.registrarPaso(
      semillaActual,
      estadoActual.turnoActual,
      estadoPre,
      pedido,
      "humano",
      { accion, razon: "Control manual" },
      estadoActual
    );

    ejecutarEfectosAccion(accion, pedido, estadoPre, estadoActual);
    mostrarPensamientoManual(accion, pedido);
    actualizarUI();

    if (!estadoActual.terminado) {
      setTimeout(() => AUDIO.sonarPedido(), 350);
    }
  }

  // Muestra el pensamiento en la nubecita y el razonamiento en el HUD
  function mostrarPensamientoAgente(agente, decision) {
    const bubbleAvatar = document.getElementById("bubbleAvatar");
    const bubbleTitle = document.getElementById("bubbleTitle");
    const bubbleText = document.getElementById("bubbleText");
    const reasoningBox = document.getElementById("reasoningBox");

    if (bubbleAvatar) bubbleAvatar.textContent = agente.icono;
    if (bubbleTitle) bubbleTitle.textContent = `${agente.nombre} — Pensamiento:`;
    if (bubbleText) bubbleText.textContent = `"${decision.pensamiento}"`;

    if (reasoningBox) {
      reasoningBox.innerHTML = `
        <div class="reasoning-title">Desglose Lógico (${agente.nombre}):</div>
        <div>${decision.razon}</div>
      `;
    }
  }

  function mostrarPensamientoManual(accion, pedido) {
    const bubbleAvatar = document.getElementById("bubbleAvatar");
    const bubbleTitle = document.getElementById("bubbleTitle");
    const bubbleText = document.getElementById("bubbleText");
    const reasoningBox = document.getElementById("reasoningBox");

    if (bubbleAvatar) bubbleAvatar.textContent = "👤";
    if (bubbleTitle) bubbleTitle.textContent = "Tú (Control Manual) — Decisión:";
    if (bubbleText) {
      if (accion === "aceptar") {
        bubbleText.textContent = `"Acepté el pedido a ${pedido.destino.nombre}. ¡Espero no tener problemas de camino!"`;
      } else if (accion === "recargar_combustible") {
        bubbleText.textContent = `"Paré en el grifo a tanquear gasolina (S/ ${MOTOR.CONFIG.COSTO_GASOLINA_TANQUEO.toFixed(1)}). Prevenir es vivir."`;
      } else if (accion === "cargar_bateria") {
        bubbleText.textContent = `"Entré a un Tambo a cargar el celular (S/ ${MOTOR.CONFIG.COSTO_RECARGA_BATERIA.toFixed(1)}). No puedo perder la app."`;
      } else {
        bubbleText.textContent = `"Rechacé el pedido. A veces no arriesgarse es la mejor jugada."`;
      }
    }

    if (reasoningBox) {
      reasoningBox.innerHTML = `
        <div class="reasoning-title">Acción Humana Ejecutada:</div>
        <div>Acción seleccionada: <strong>${accion.toUpperCase()}</strong>. Recursos y saldo actualizados.</div>
      `;
    }
  }

  // Refresca todos los elementos visuales de la interfaz
  function actualizarUI() {
    const pedido = !estadoActual.terminado ? jornadaActual.pedidos[estadoActual.turnoActual] : null;

    // Renderizar Canvas
    CANVAS_MAPA.render(estadoActual, pedido, jornadaActual.clima);

    // Badges superiores
    const badgeTime = document.getElementById("badgeHora");
    const badgeWeather = document.getElementById("badgeClima");
    if (badgeTime) badgeTime.textContent = pedido ? `🕒 ${pedido.hora}` : "🏁 00:00 (Fin)";
    if (badgeWeather) badgeWeather.textContent = `🌧️ ${jornadaActual.clima}`;

    // HUD Numérico
    const netVal = document.getElementById("hudSaldo");
    if (netVal) {
      netVal.textContent = `S/ ${estadoActual.saldo.toFixed(1)}`;
      netVal.style.color = estadoActual.saldo >= 0 ? "var(--accent-green)" : "var(--accent-red)";
    }

    // Barras de progreso
    actualizarBarra("barBateria", "valBateria", estadoActual.bateria, "%");
    actualizarBarra("barCombustible", "valCombustible", estadoActual.combustible, "%");
    actualizarBarra("barRating", "valRating", (estadoActual.rating / 5.0) * 100, `★ ${estadoActual.rating.toFixed(2)}`);

    // Tarjeta del pedido entrante
    actualizarTarjetaPedido(pedido);

    // Estado del juego / Fin de jornada
    if (estadoActual.terminado) {
      const metricas = MOTOR.calcularMetricas(estadoActual);
      mostrarResumenFinTurno(metricas);
    }
  }

  function actualizarBarra(barId, valId, porcentaje, sufijo) {
    const bar = document.getElementById(barId);
    const val = document.getElementById(valId);
    if (bar) bar.style.width = `${Math.max(0, Math.min(100, porcentaje))}%`;
    if (val) val.textContent = typeof sufijo === "string" && sufijo.startsWith("★") ? sufijo : `${porcentaje.toFixed(0)}${sufijo}`;
  }

  function actualizarTarjetaPedido(pedido) {
    const card = document.getElementById("tarjetaPedido");
    if (!card) return;

    if (!pedido) {
      card.innerHTML = `
        <div style="text-align: center; padding: 1.5rem; color: var(--text-muted);">
          <h4>🏁 Fin de la Jornada</h4>
          <p style="font-size: 0.85rem; margin-top: 0.5rem;">Se completaron los 14 turnos de la noche.</p>
        </div>
      `;
      return;
    }

    let badgeRiesgoClase = "badge-risk-low";
    if (pedido.destino.riesgo === "media") badgeRiesgoClase = "badge-risk-med";
    if (pedido.destino.riesgo === "alta") badgeRiesgoClase = "badge-risk-high";

    card.innerHTML = `
      <div class="order-top">
        <span class="badge ${badgeRiesgoClase}">Riesgo ${pedido.destino.riesgo.toUpperCase()}</span>
        <span class="order-payout">+S/ ${pedido.pagoTotal.toFixed(1)}</span>
      </div>
      <div class="order-route">
        <div class="route-point"><span class="route-dot"></span> <strong>${pedido.negocio}</strong> (${pedido.origen.nombre})</div>
        <div class="route-point"><span class="route-dot dest"></span> Destino: <strong>${pedido.destino.nombre}</strong></div>
      </div>
      <div class="order-metrics">
        <div>
          <div class="metric-mini-label">Distancia</div>
          <div class="metric-mini-val">${pedido.distKm} km</div>
        </div>
        <div>
          <div class="metric-mini-label">Gasto Bat.</div>
          <div class="metric-mini-val">-${pedido.gastoBateria}%</div>
        </div>
        <div>
          <div class="metric-mini-label">Gasto Gas.</div>
          <div class="metric-mini-val">-${pedido.gastoCombustible}%</div>
        </div>
      </div>
    `;
  }

  function mostrarResumenFinTurno(m) {
    const bubbleTitle = document.getElementById("bubbleTitle");
    const bubbleText = document.getElementById("bubbleText");

    if (bubbleTitle) bubbleTitle.textContent = "Balance Final de la Jornada:";
    if (bubbleText) {
      if (m.llegoAlFinal) {
        bubbleText.textContent = `🎉 ¡Jornada exitosa! Saldo neto: S/ ${m.saldoNeto} (después de cuota de moto y cena). Puntaje formal de rendimiento: ${m.puntaje} pts.`;
      } else if (m.varado) {
        bubbleText.textContent = `⚠️ Fracaso operativo: Chambi se quedó varado en la pista por falta de combustible o batería. Puntaje: ${m.puntaje} pts.`;
      } else {
        bubbleText.textContent = `❌ Quiebre económico: No se cubrió la cuota obligatoria de la moto. Saldo negativo: S/ ${m.saldoNeto}. Puntaje: ${m.puntaje} pts.`;
      }
    }
  }

  // ==========================================================================
  // BENCHMARK MASIVO: 200 CORRIDAS POR AGENTE (TABLA ESTADÍSTICA EXACTA)
  // ==========================================================================
  function ejecutarBenchmarkMasivo(totalCorridas = 200) {
    const spinner = document.getElementById("benchmarkSpinner");
    if (spinner) spinner.style.display = "block";

    setTimeout(() => {
      const inicioTiempo = performance.now();
      const resultadosAgentes = [];

      AGENTES.forEach((agente) => {
        const tInicioAgente = performance.now();
        const puntajes = [];
        let exitos = 0;
        let saldoNetoTotal = 0;

        for (let i = 0; i < totalCorridas; i++) {
          const semilla = 2025 + i;
          const jornada = MOTOR.generarJornada(semilla);
          let estado = MOTOR.crearEstadoInicial();

          while (!estado.terminado) {
            const pedido = jornada.pedidos[estado.turnoActual];
            const p = agente.percibir(estado, pedido, jornada);
            const d = agente.decidir(p, estado, pedido);
            estado = MOTOR.darPaso(estado, jornada, d.accion, d.razon);
          }

          const m = MOTOR.calcularMetricas(estado);
          puntajes.push(m.puntaje);
          saldoNetoTotal += m.saldoNeto;
          if (m.llegoAlFinal) exitos++;
        }

        const tFinAgente = performance.now();
        const n = puntajes.length;
        const promedio = puntajes.reduce((a, b) => a + b, 0) / n;
        const varianza = puntajes.reduce((a, b) => a + Math.pow(b - promedio, 2), 0) / (n - 1);
        const stdDev = Math.sqrt(varianza);
        const errorStd95 = 1.96 * (stdDev / Math.sqrt(n)); // 95% intervalo de confianza

        resultadosAgentes.push({
          agente,
          puntajeMedio: promedio,
          errorStd: errorStd95,
          tasaSupervivencia: (exitos / totalCorridas) * 100,
          saldoNetoPromedio: saldoNetoTotal / totalCorridas,
          tiempoMs: tFinAgente - tInicioAgente,
        });
      });

      const tiempoTotalMs = performance.now() - inicioTiempo;
      renderizarTablaBenchmark(resultadosAgentes, totalCorridas, tiempoTotalMs);

      // Renderizar gráficos Canvas
      GRAFICOS.renderGraficoPuntajes("chartPuntajesCanvas", resultadosAgentes);
      GRAFICOS.renderGraficoSupervivencia("chartSupervivenciaCanvas", resultadosAgentes);

      if (spinner) spinner.style.display = "none";
    }, 40);
  }

  function renderizarTablaBenchmark(resultados, corridas, tiempoTotal) {
    const tbody = document.getElementById("tbodyBenchmark");
    if (!tbody) return;

    let html = "";
    resultados.forEach((res) => {
      const dotClase = `dot-${res.agente.id}`;
      html += `
        <tr>
          <td>
            <div class="agent-badge-name">
              <span class="agent-dot ${dotClase}"></span>
              ${res.agente.nombre}
            </div>
          </td>
          <td><strong>${res.puntajeMedio.toFixed(1)} ± ${res.errorStd.toFixed(1)}</strong></td>
          <td>
            <span style="color: ${res.tasaSupervivencia >= 85 ? "var(--accent-green)" : res.tasaSupervivencia >= 40 ? "var(--accent-yellow)" : "var(--accent-red)"}; font-weight: 700;">
              ${res.tasaSupervivencia.toFixed(1)}%
            </span>
          </td>
          <td>S/ ${res.saldoNetoPromedio.toFixed(1)}</td>
          <td>${res.tiempoMs.toFixed(0)} ms</td>
          <td>${corridas}</td>
        </tr>
      `;
    });

    tbody.innerHTML = html;

    const lblTiempo = document.getElementById("benchmarkTiempoTotal");
    if (lblTiempo) lblTiempo.textContent = `${tiempoTotal.toFixed(0)} ms`;
  }

  return {
    init,
    reiniciarPartida,
    ejecutarBenchmarkMasivo,
  };
})();

// Inicializar al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  APP.init();
});
