// ==========================================================================
// MOTOR DE SIMULACIÓN - EL TURNO DE CHAMBI (LIMA NOCTURNA)
// ==========================================================================
"use strict";

const MOTOR = (function () {
  // Constantes de calibración del turno
  const CONFIG = {
    CUOTA_ALQUILER_MOTO: 35.0,  // Gasto fijo obligatorio al final del turno
    COSTO_CENA: 10.0,           // Necesidad básica para mantener energía
    COSTO_GASOLINA_TANQUEO: 10.0, // Tanquear en grifo suma +55% combustible
    COSTO_RECARGA_BATERIA: 3.0,   // Cargar batería de celular en tambo/grifo suma +45%
    PENALIZACION_VARADO: 100.0,   // Pérdida severa si batería o combustible llega a 0%
    PENALIZACION_ASALTO: 150.0,   // Pérdida crítica si sufre robo en zona roja
    PENALIZACION_DEUDA: 60.0,     // Pérdida si no cubre la cuota de la moto
    TOTAL_TURNOS: 14,             // 14 pedidos potenciales por noche (19:00 a 00:00)
  };

  // Distritos de Lima modelados con coordenadas lógicas y riesgo base
  const DISTRITOS = [
    { id: "miraflores", nombre: "Miraflores", riesgo: "baja", factorPeligro: 0.03, x: 180, y: 310 },
    { id: "san_isidro", nombre: "San Isidro", riesgo: "baja", factorPeligro: 0.03, x: 210, y: 250 },
    { id: "surquillo", nombre: "Surquillo", riesgo: "media", factorPeligro: 0.12, x: 260, y: 290 },
    { id: "lince", nombre: "Lince", riesgo: "media", factorPeligro: 0.12, x: 220, y: 190 },
    { id: "cercado", nombre: "Cercado Lima", riesgo: "media", factorPeligro: 0.18, x: 240, y: 110 },
    { id: "la_victoria", nombre: "La Victoria", riesgo: "alta", factorPeligro: 0.48, x: 300, y: 170 },
    { id: "sjl", nombre: "San Juan Lurigancho", riesgo: "alta", factorPeligro: 0.52, x: 370, y: 70 },
    { id: "magdalena", nombre: "Magdalena", riesgo: "baja", factorPeligro: 0.04, x: 140, y: 220 },
    { id: "barranco", nombre: "Barranco", riesgo: "baja", factorPeligro: 0.04, x: 200, y: 370 },
  ];

  const NEGOCIOS = [
    "Pollería Norky's", "Chifa Central", "Bembos Express", "Makoto Sushi",
    "Pardos Chicken", "Farmacia InkaFarma", "Tambo 24/7", "Hamburguesería Street"
  ];

  // Generador pseudoaleatorio determinista (Mulberry32)
  function crearPRNG(semilla) {
    let s = Math.floor(semilla) >>> 0;
    return function () {
      s |= 0; s = s + 0x6D2B79F5 | 0;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  // Genera la lista exacta de pedidos y clima para una semilla dada
  function generarJornada(semilla) {
    const rand = crearPRNG(semilla);
    const pedidos = [];

    // Clima de la noche sorteado por semilla
    const rClima = rand();
    const clima = rClima < 0.5 ? "Despejado" : rClima < 0.85 ? "Garúa Limeña" : "Lluvia Fuerte";

    for (let i = 0; i < CONFIG.TOTAL_TURNOS; i++) {
      // Hora simulada: 19:00 a 23:45
      const horaMin = 19 * 60 + Math.floor((i / CONFIG.TOTAL_TURNOS) * (4.5 * 60));
      const hh = String(Math.floor(horaMin / 60)).padStart(2, "0");
      const mm = String(horaMin % 60).padStart(2, "0");
      const horaStr = `${hh}:${mm}`;

      // Distritos de recogida y entrega
      const idxOrig = Math.floor(rand() * DISTRITOS.length);
      let idxDest = Math.floor(rand() * DISTRITOS.length);
      if (idxDest === idxOrig) idxDest = (idxDest + 1) % DISTRITOS.length;

      const origen = DISTRITOS[idxOrig];
      const destino = DISTRITOS[idxDest];
      const negocio = NEGOCIOS[Math.floor(rand() * NEGOCIOS.length)];

      // Distancia euclidiana aproximada convertida a km (2 a 12 km)
      const dx = origen.x - destino.x;
      const dy = origen.y - destino.y;
      const distPx = Math.sqrt(dx * dx + dy * dy);
      const distKm = parseFloat((2.0 + (distPx / 35.0) * 1.5).toFixed(1));

      // Tarifa base proporcional a km + multiplicador nocturno
      const tarifaBase = 5.0 + distKm * 1.6;
      const tienePropina = rand() < 0.45;
      const propina = tienePropina ? parseFloat((2.0 + rand() * 6.0).toFixed(1)) : 0.0;
      const pagoTotal = parseFloat((tarifaBase + propina).toFixed(1));

      // Consumo de recursos estimado
      const gastoBateria = parseFloat((4.0 + distKm * 1.2).toFixed(1));
      const gastoCombustible = parseFloat((3.5 + distKm * 1.4).toFixed(1));

      // Riesgo de asalto: función del distrito destino + hora tardía
      const factorHora = horaMin > (22 * 60) ? 1.4 : 1.0;
      const probAsalto = parseFloat(Math.min(0.85, destino.factorPeligro * factorHora).toFixed(2));

      // Sin asaltos ni averias (completamente desactivados)
      const habraAsalto = false;
      const azarPinchazo = false;

      pedidos.push({
        id: i + 1,
        hora: horaStr,
        minutosDia: horaMin,
        negocio,
        origen,
        destino,
        distKm,
        tarifaBase: parseFloat(tarifaBase.toFixed(1)),
        propina,
        pagoTotal,
        gastoBateria,
        gastoCombustible,
        probAsalto,
        habraAsalto,
        azarPinchazo,
      });
    }

    return { semilla, clima, pedidos };
  }

  // Estado inicial de Chambi al arrancar su turno
  function crearEstadoInicial() {
    return {
      turnoActual: 0,
      saldo: 25.0,              // Caja chica inicial en soles
      combustible: 80.0,        // % de tanque de la moto
      bateria: 85.0,            // % de batería del celular
      rating: 4.95,             // Calificación en la app (1.0 a 5.0)
      pedidosEntregados: 0,
      pedidosRechazados: 0,
      asaltosSufridos: 0,
      averiasSufridas: 0,
      varado: false,            // Si se quedó sin batería o gasolina
      asaltadoGrave: false,     // Si sufrió asalto y perdió la moto
      terminado: false,
      distritoActual: DISTRITOS[0], // Inicia en Miraflores
      historial: [],
    };
  }

  // Aplica la acción elegida por el agente en el paso actual
  function darPaso(estado, jornada, accion, razon = "") {
    if (estado.terminado) return estado;

    const pedido = jornada.pedidos[estado.turnoActual];
    const nuevo = JSON.parse(JSON.stringify(estado));
    nuevo.turnoActual += 1;

    if (accion === "aceptar") {
      // Si el agente decide aceptar el pedido:
      nuevo.saldo += pedido.pagoTotal;
      nuevo.combustible = Math.max(0, nuevo.combustible - pedido.gastoCombustible);
      nuevo.bateria = Math.max(0, nuevo.bateria - pedido.gastoBateria);
      nuevo.distritoActual = pedido.destino;
      nuevo.pedidosEntregados += 1;

      // Asaltos y fallas mecanicas desactivados por completo
      // (sin penalizaciones ni interrupciones fortuitas)

      // Desgaste natural de rating si llueve o demora
      if (jornada.clima === "Lluvia Fuerte" && Math.random() < 0.2) {
        nuevo.rating = Math.max(1.0, nuevo.rating - 0.05);
      } else {
        nuevo.rating = Math.min(5.0, nuevo.rating + 0.01);
      }

    } else if (accion === "recargar_combustible") {
      // Parada estratégica en grifo
      if (nuevo.saldo >= CONFIG.COSTO_GASOLINA_TANQUEO) {
        nuevo.saldo -= CONFIG.COSTO_GASOLINA_TANQUEO;
        nuevo.combustible = Math.min(100, nuevo.combustible + 55.0);
      }
      nuevo.pedidosRechazados += 1;

    } else if (accion === "cargar_bateria") {
      // Parada estratégica en Tambo para cargar celular
      if (nuevo.saldo >= CONFIG.COSTO_RECARGA_BATERIA) {
        nuevo.saldo -= CONFIG.COSTO_RECARGA_BATERIA;
        nuevo.bateria = Math.min(100, nuevo.bateria + 45.0);
      }
      nuevo.pedidosRechazados += 1;

    } else {
      // Acción rechazar / esperar siguiente pedido
      nuevo.pedidosRechazados += 1;
      // Recupera un pequeño respiro de batería si apaga la pantalla
      nuevo.bateria = Math.max(0, nuevo.bateria - 0.5);
    }

    // Verificar condición de quedarse varado
    if (nuevo.combustible <= 0 || nuevo.bateria <= 0) {
      nuevo.varado = true;
      nuevo.terminado = true;
    }

    // Si llegó al final del turno, cobrar cuota de alquiler de la moto y cena
    if (nuevo.turnoActual >= jornada.pedidos.length) {
      nuevo.terminado = true;
      nuevo.saldoFinalBruto = nuevo.saldo;
      nuevo.saldo = nuevo.saldo - CONFIG.CUOTA_ALQUILER_MOTO - CONFIG.COSTO_CENA;
    }

    nuevo.historial.push({
      paso: nuevo.turnoActual,
      pedido,
      accion,
      razon,
      saldo: parseFloat(nuevo.saldo.toFixed(1)),
      combustible: parseFloat(nuevo.combustible.toFixed(1)),
      bateria: parseFloat(nuevo.bateria.toFixed(1)),
      rating: parseFloat(nuevo.rating.toFixed(2)),
      varado: nuevo.varado,
      asaltado: nuevo.asaltosSufridos > 0,
    });

    return nuevo;
  }

  // Cálculo de la métrica unificada de rendimiento para la tabla comparativa
  function calcularMetricas(estadoFinal) {
    const saldoNeto = estadoFinal.saldo;
    let puntaje = saldoNeto;

    // Bonos y penalizaciones
    if (estadoFinal.varado) puntaje -= CONFIG.PENALIZACION_VARADO;
    // Asaltos desactivados: sin penalizacion
    if (estadoFinal.saldo < 0) puntaje -= CONFIG.PENALIZACION_DEUDA;

    // Bono por alta calificación
    if (estadoFinal.rating >= 4.8) puntaje += 15.0;

    const llegoAlFinal = !estadoFinal.varado && !estadoFinal.asaltadoGrave && estadoFinal.saldo >= 0;

    return {
      saldoNeto: parseFloat(saldoNeto.toFixed(1)),
      puntaje: parseFloat(puntaje.toFixed(1)),
      llegoAlFinal,
      varado: estadoFinal.varado,
      asaltos: estadoFinal.asaltosSufridos,
      entregados: estadoFinal.pedidosEntregados,
      rating: parseFloat(estadoFinal.rating.toFixed(2)),
    };
  }

  return {
    CONFIG,
    DISTRITOS,
    generarJornada,
    crearEstadoInicial,
    darPaso,
    calcularMetricas,
  };
})();
