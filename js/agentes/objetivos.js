// ==========================================================================
// ARCHIVO: objetivos.js - CARPETA: agentes
// TAXONOMÍA: Agente Basado en Objetivos (Capítulo 2 - Russell & Norvig)
// DESCRIPCIÓN: Posee un conjunto jerárquico de metas ordenadas por prioridad:
// 1) Seguridad física (Cero asaltos), 2) No quedar varado, 3) Reputación alta,
// 4) Pagar la cuota de la moto y cena, 5) Maximizar ganancia neta.
// Solo acepta una acción si no vulnera un objetivo de mayor jerarquía.
// ==========================================================================
"use strict";

const AGENTE_OBJETIVOS = {
  id: "objetivos",
  nombre: "Agente Basado en Objetivos",
  descripcion: "Jerarquía estricta de 5 metas: 1) Seguridad física, 2) No quedar varado, 3) Reputación >= 4.7★, 4) Pagar cuota de moto y cena, 5) Lucro neto.",
  icono: "🎯",
  color: "#9d4edd",

  // Definición de las metas en estricto orden de precedencia (0 = máxima prioridad)
  METAS: [
    { id: 0, nombre: "Seguridad Operativa", desc: "Evitar zonas rojas de alto peligro a toda costa" },
    { id: 1, nombre: "Operatividad Continua", desc: "Batería y combustible siempre por encima del 18%" },
    { id: 2, nombre: "Reputación Profesional", desc: "Mantener rating en la app >= 4.70 estrellas" },
    { id: 3, nombre: "Meta de Cobertura Base", desc: "Alcanzar S/ 45 para pagar la cuota de la moto y cenar" },
    { id: 4, nombre: "Meta de Ganancia Libre", desc: "Maximizar excedente de dinero para llevar a casa" },
  ],

  // Percibe el progreso hacia cada objetivo
  percibir: function (estado, pedido, jornada) {
    const dineroFaltanteParaCuota = Math.max(0, (MOTOR.CONFIG.CUOTA_ALQUILER_MOTO + MOTOR.CONFIG.COSTO_CENA) - estado.saldo);
    const metaCuotaCumplida = dineroFaltanteParaCuota <= 0;
    const metaOperatividadEnRiesgo = estado.bateria <= 20.0 || estado.combustible <= 20.0;
    const destinoEsZonaRoja = pedido.destino.riesgo === "alta";

    return {
      estado,
      pedido,
      metaCuotaCumplida,
      dineroFaltanteParaCuota,
      metaOperatividadEnRiesgo,
      destinoEsZonaRoja,
      bateriaCritica: estado.bateria <= 22.0,
      combustibleCritico: estado.combustible <= 20.0,
    };
  },

  // Decide analizando qué meta se protege o se compromete
  decidir: function (p, estado, pedido) {
    // Evaluación de Meta 1: Seguridad Física (Prioridad 0)
    // Ningún dinero justifica entrar a zona roja si compromete la integridad
    if (p.destinoEsZonaRoja && (pedido.minutosDia >= (21 * 60) || pedido.probAsalto > 0.45)) {
      return {
        accion: "rechazar",
        razon: `Objetivo 1 [Seguridad Física]: Rechaza pedido a ${pedido.destino.nombre}. Entrar a zona roja arriesga el objetivo máximo de supervivencia.`,
        pensamiento: `Mi Meta 1 es volver sano a casa. No arriesgo mi seguridad en ${pedido.destino.nombre} por ninguna tarifa.`,
      };
    }

    // Evaluación de Meta 2: No quedar varado (Prioridad 1)
    if (p.bateriaCritica && estado.saldo >= MOTOR.CONFIG.COSTO_RECARGA_BATERIA) {
      return {
        accion: "cargar_bateria",
        razon: `Objetivo 2 [Operatividad]: Carga urgente de batería (${estado.bateria.toFixed(1)}%). Protege la meta de movilidad continua.`,
        pensamiento: `Cumplo mi Meta 2: detengo la marcha para cargar el celular antes de que se apague la app.`,
      };
    }

    if (p.combustibleCritico && estado.saldo >= MOTOR.CONFIG.COSTO_GASOLINA_TANQUEO) {
      return {
        accion: "recargar_combustible",
        razon: `Objetivo 2 [Operatividad]: Tanqueo urgente de combustible (${estado.combustible.toFixed(1)}%). Protege la meta de no quedar varado.`,
        pensamiento: `Cumplo mi Meta 2: paro en el grifo a tanquear. Un repartidor sin gasolina pierde su herramienta de trabajo.`,
      };
    }

    // Comprobar si el pedido consumirá recursos indispensables para Meta 2
    if ((estado.combustible - pedido.gastoCombustible) < 15.0 || (estado.bateria - pedido.gastoBateria) < 15.0) {
      return {
        accion: "rechazar",
        razon: `Objetivo 2 [Operatividad]: El viaje a ${pedido.destino.nombre} dejaría combustible o batería por debajo del umbral de seguridad (15%).`,
        pensamiento: `Rechazo porque este viaje amenaza mi Meta 2 de mantener la moto operativa.`,
      };
    }

    // Evaluación de Meta 3 y Meta 4: Alcanzar la cuota diaria (Prioridad 3)
    if (!p.metaCuotaCumplida) {
      return {
        accion: "aceptar",
        razon: `Objetivo 4 [Meta de Cobertura]: Acepta entrega de S/ ${pedido.pagoTotal.toFixed(1)} para cubrir los S/ ${p.dineroFaltanteParaCuota.toFixed(1)} pendientes de cuota y cena.`,
        pensamiento: `Este pedido me acerca a mi Meta 4: pagar la cuota de la moto y asegurar mi cena de hoy.`,
      };
    }

    // Evaluación de Meta 5: Ganancia Libre Excedente (Prioridad 4)
    // Con la cuota ya cubierta, puede ser más selectivo con la distancia y el pago
    if (pedido.pagoTotal >= 8.0) {
      return {
        accion: "aceptar",
        razon: `Objetivo 5 [Ganancia Neta]: Cuota base ya lograda. Acepta viaje con excelente remuneración (S/ ${pedido.pagoTotal.toFixed(1)}).`,
        pensamiento: `¡Metas básicas cumplidas! Este pedido suma directamente a mi ganancia neta personal.`,
      };
    }

    return {
      accion: "rechazar",
      razon: `Objetivo 5 [Ganancia Neta]: Ya cubrí mis metas fijas; descarto pedidos menores a S/ 8.0 para optimizar tiempo.`,
      pensamiento: `Ya pagué mi cuota del día; solo acepto viajes bien pagados para no desgastarme innecesariamente.`,
    };
  },
};
