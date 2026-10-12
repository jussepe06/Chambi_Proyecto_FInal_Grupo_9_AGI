// ==========================================================================
// ARCHIVO: base.js - CARPETA: agentes
// TAXONOMÍA: Agente Base / Ingenuo / Codicioso (Benchmark Inferior)
// DESCRIPCIÓN: Acepta cualquier pedido que entra sin evaluar batería,
// combustible, distancia ni el nivel de peligro de la zona.
// Sirve como cota inferior para demostrar la ganancia de la IA.
// ==========================================================================
"use strict";

const AGENTE_BASE = {
  id: "base",
  nombre: "Agente Base (Ingenuo)",
  descripcion: "Acepta cualquier pedido sin considerar combustible, batería ni peligro de zona.",
  icono: "🛵",
  color: "#8b9bb4",

  // Percibe el estado y el pedido entrante
  percibir: function (estado, pedido, jornada) {
    return {
      saldo: estado.saldo,
      pedidoId: pedido.id,
      pagoTotal: pedido.pagoTotal,
    };
  },

  // Decide: Siempre acepta si hay pedido activo
  decidir: function (percepcion, estado, pedido) {
    return {
      accion: "aceptar",
      razon: "Acepta impulsivamente por el pago de S/ " + pedido.pagoTotal.toFixed(1) + " sin medir consecuencias.",
      pensamiento: "¡Entró un pedido de S/ " + pedido.pagoTotal.toFixed(1) + "! Lo acepto de inmediato sin pensar.",
    };
  },
};
