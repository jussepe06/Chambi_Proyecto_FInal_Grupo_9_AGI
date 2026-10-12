// ==========================================================================
// ARCHIVO: utilidad.js - CARPETA: agentes
// TAXONOMÍA: Agente Basado en Utilidad (Capítulo 2 - Russell & Norvig)
// DESCRIPCIÓN: Balanza cuantitativa multi-atributo. Evalúa simultáneamente:
// 1) Ganancia económica (+), 2) Riesgo de asalto (-), 3) Consumo de recursos (-),
// 4) Reputación (+). Resuelve de forma óptima los compromisos (trade-offs).
// Incluye pesos calibrables reactivos con deslizadores en la interfaz.
// ==========================================================================
"use strict";

const AGENTE_UTILIDAD = {
  id: "utilidad",
  nombre: "Agente Basado en Utilidad",
  descripcion: "Balanza matemática continua: Pondera ganancia vs riesgo de zona vs consumo de recursos. Sliders calibrables en vivo.",
  icono: "⚖️",
  color: "#00ff88",

  // Pesos ponderadores de la función de utilidad (Modificables en tiempo real desde la UI)
  pesos: {
    wPago: 2.0,       // Importancia de la ganancia en soles
    wRiesgo: 2.2,     // Penalización ante peligro de zona y horario
    wRecursos: 1.0,   // Sensibilidad ante drenaje de combustible y batería
    wRating: 1.0,     // Valor de la reputación en la plataforma
  },

  // Percibe las variables cuantitativas del entorno
  percibir: function (estado, pedido, jornada) {
    const turnosRestantes = jornada.pedidos.length - estado.turnoActual;
    const holguraCombustible = estado.combustible - pedido.gastoCombustible;
    const holguraBateria = estado.bateria - pedido.gastoBateria;

    return {
      estado,
      pedido,
      turnosRestantes,
      holguraCombustible,
      holguraBateria,
    };
  },

  // Calcula la función de utilidad para la opción ACEPTAR
  calcularUtilidadAceptar: function (p, estado, pedido) {
    const w = this.pesos;

    // Componente 1: Utilidad financiera directa
    const uFinanciera = w.wPago * pedido.pagoTotal;

    // Componente 2: Desutilidad por riesgo de seguridad (Peligro de zona + nocturnidad)
    const factorHora = pedido.minutosDia > (21 * 60) ? 1.5 : 1.0;
    const uRiesgo = -w.wRiesgo * (pedido.probAsalto * 100 * factorHora * 0.4);

    // Componente 3: Desutilidad por gasto de insumos físicos (gasolina + batería)
    const uRecursos = -w.wRecursos * (pedido.gastoCombustible * 0.8 + pedido.gastoBateria * 0.8);

    // Componente 4: Bono de reputación
    const uRating = w.wRating * (pedido.pagoTotal > 12.0 ? 3.0 : 1.0);

    // Componente 5: Penalización extrema si el viaje causa quiebre operativo
    let uPenalizacion = 0;
    if (p.holguraCombustible <= 0 || p.holguraBateria <= 0) {
      uPenalizacion = -500.0; // Inaceptable: se queda varado
    } else if (p.holguraCombustible < 15.0 || p.holguraBateria < 15.0) {
      uPenalizacion = -45.0;  // Riesgo alto de quedarse sin recursos
    }

    const total = uFinanciera + uRiesgo + uRecursos + uRating + uPenalizacion;

    return {
      total: parseFloat(total.toFixed(2)),
      uFinanciera: parseFloat(uFinanciera.toFixed(2)),
      uRiesgo: parseFloat(uRiesgo.toFixed(2)),
      uRecursos: parseFloat(uRecursos.toFixed(2)),
      uRating: parseFloat(uRating.toFixed(2)),
      uPenalizacion: parseFloat(uPenalizacion.toFixed(2)),
    };
  },

  // Calcula la función de utilidad para la opción RECHAZAR / ACCIÓN ALTERNATIVA
  calcularUtilidadRechazar: function (p, estado) {
    // Si la batería o combustible son críticamente bajos, la utilidad de recargar es alta
    if (estado.bateria < 25.0 && estado.saldo >= MOTOR.CONFIG.COSTO_RECARGA_BATERIA) {
      return { accion: "cargar_bateria", valor: 15.0 };
    }
    if (estado.combustible < 25.0 && estado.saldo >= MOTOR.CONFIG.COSTO_GASOLINA_TANQUEO) {
      return { accion: "recargar_combustible", valor: 18.0 };
    }

    // Rechazar pasivamente tiene utilidad base 0 (ni gana ni arriesga)
    return { accion: "rechazar", valor: 0.0 };
  },

  // Decide comparando qué alternativa arroja el mayor valor neto en la balanza
  decidir: function (p, estado, pedido) {
    const uAceptar = this.calcularUtilidadAceptar(p, estado, pedido);
    const uAlternativa = this.calcularUtilidadRechazar(p, estado);

    if (uAlternativa.accion !== "rechazar") {
      // Prioridad a la parada técnica si la utilidad de recargar supera el viaje
      if (uAlternativa.valor > uAceptar.total) {
        return {
          accion: uAlternativa.accion,
          razon: `Función de Utilidad: La utilidad de parada técnica (${uAlternativa.accion} = +${uAlternativa.valor}) supera tomar el pedido (${uAceptar.total}).`,
          pensamiento: `Mi función de utilidad prioriza recargar recursos críticos antes de seguir aceptando pedidos.`,
          uDetalle: uAceptar,
        };
      }
    }

    const acepta = uAceptar.total > 0;

    if (acepta) {
      return {
        accion: "aceptar",
        razon: `Función de Utilidad: U(Aceptar) = +${uAceptar.total} > 0. Ponderación favorable [Pago: +${uAceptar.uFinanciera}, Riesgo: ${uAceptar.uRiesgo}, Recursos: ${uAceptar.uRecursos}].`,
        pensamiento: `La balanza matemática es positiva (+${uAceptar.total}). El pago de S/ ${pedido.pagoTotal.toFixed(1)} compensa ampliamente el esfuerzo y el riesgo.`,
        uDetalle: uAceptar,
      };
    } else {
      return {
        accion: "rechazar",
        razon: `Función de Utilidad: U(Aceptar) = ${uAceptar.total} <= 0. Desfavorable [Pago: +${uAceptar.uFinanciera}, Riesgo: ${uAceptar.uRiesgo}, Recursos: ${uAceptar.uRecursos}].`,
        pensamiento: `La utilidad neta es negativa (${uAceptar.total}). El riesgo o desgaste superan con creces la ganancia. Rechazo.`,
        uDetalle: uAceptar,
      };
    }
  },
};
