// ==========================================================================
// ARCHIVO: reflejo.js - CARPETA: agentes
// TAXONOMÍA: Agente Reflejo Simple (Capítulo 2 - Russell & Norvig)
// DESCRIPCIÓN: Opera bajo reglas directas de Condición-Acción sin memoria.
// Evalúa únicamente el estímulo sensorial inmediato del paso actual.
// ==========================================================================
"use strict";

const AGENTE_REFLEJO = {
  id: "reflejo",
  nombre: "Agente Reflejo Simple",
  descripcion: "Reglas inmediatas: Si hay batería/combustible crítico recarga; rechaza zonas rojas de noche o pagos menores a S/ 7.0.",
  icono: "⚡",
  color: "#ffd000",

  // Parámetros calibrables (Listos para modificar si el profesor pide cambiar reglas)
  limiteTarifaMinima: 7.0,     // Línea clave: tarifa mínima aceptable
  limiteBateriaCritica: 28.0,   // Línea clave: umbral para parar a cargar celular
  limiteCombustibleCritico: 25.0, // Línea clave: umbral para tanquear gasolina
  horaPeligroNoche: 21 * 60 + 30, // 21:30 en minutos

  // Percibe solo los valores del instante actual (sin memoria)
  percibir: function (estado, pedido, jornada) {
    return {
      bateria: estado.bateria,
      combustible: estado.combustible,
      saldo: estado.saldo,
      tarifa: pedido.pagoTotal,
      distritoDestino: pedido.destino.nombre,
      riesgoZona: pedido.destino.riesgo,
      minutosDia: pedido.minutosDia,
    };
  },

  // Decide mediante la tabla de reglas Condición-Acción
  decidir: function (p, estado, pedido) {
    // Regla 1: Emergencia de batería del celular
    if (p.bateria <= this.limiteBateriaCritica && p.saldo >= MOTOR.CONFIG.COSTO_RECARGA_BATERIA) {
      return {
        accion: "cargar_bateria",
        razon: `Regla Reflejo: Batería crítica (${p.bateria.toFixed(1)}% <= ${this.limiteBateriaCritica}%). Parada técnica en Tambo a cargar celular.`,
        pensamiento: "¡Mi celular se va a apagar! No puedo aceptar pedidos; paro en un Tambo a recargar la batería.",
      };
    }

    // Regla 2: Emergencia de combustible de la moto
    if (p.combustible <= this.limiteCombustibleCritico && p.saldo >= MOTOR.CONFIG.COSTO_GASOLINA_TANQUEO) {
      return {
        accion: "recargar_combustible",
        razon: `Regla Reflejo: Gasolina baja (${p.combustible.toFixed(1)}% <= ${this.limiteCombustibleCritico}%). Parada técnica en grifo a tanquear.`,
        pensamiento: "La aguja del tanque está en rojo; si no tanqueo en el grifo me quedo botado en la pista.",
      };
    }

    // Regla 3: Evasión refleja de peligro en zona roja nocturna
    if (p.riesgoZona === "alta" && p.minutosDia >= this.horaPeligroNoche) {
      return {
        accion: "rechazar",
        razon: `Regla Reflejo: Destino peligroso (${p.distritoDestino} - Zona Roja) pasada la hora límite nocturna.`,
        pensamiento: `No entro a ${p.distritoDestino} tan tarde de noche; regla de seguridad número uno: evadir asaltos.`,
      };
    }

    // Regla 4: Rechazo de pedidos mal pagados
    if (p.tarifa < this.limiteTarifaMinima) {
      return {
        accion: "rechazar",
        razon: `Regla Reflejo: Tarifa insuficiente (S/ ${p.tarifa.toFixed(1)} < S/ ${this.limiteTarifaMinima.toFixed(1)}).`,
        pensamiento: `Pagan muy poco (S/ ${p.tarifa.toFixed(1)}). No vale la pena el desgaste por tan poco dinero.`,
      };
    }

    // Regla por defecto: Acepta si no viola ninguna condición restrictiva
    return {
      accion: "aceptar",
      razon: `Regla Reflejo: Cumple condiciones (Pago S/ ${p.tarifa.toFixed(1)} aceptable y recursos seguros).`,
      pensamiento: `Pedido aceptable a ${p.distritoDestino} por S/ ${p.tarifa.toFixed(1)}. ¡En marcha!`,
    };
  },
};
