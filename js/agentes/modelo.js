// ==========================================================================
// ARCHIVO: modelo.js - CARPETA: agentes
// TAXONOMÍA: Agente Basado en Modelo (Capítulo 2 - Russell & Norvig)
// DESCRIPCIÓN: Mantiene un modelo interno del estado del mundo y del futuro:
// proyecta la cuota obligatoria de la moto, la reserva de combustible para
// regresar a casa, el costo de cena y un colchón de imprevistos por clima.
// ==========================================================================
"use strict";

const AGENTE_MODELO = {
  id: "modelo",
  nombre: "Agente Basado en Modelo",
  descripcion: "Proyecta un modelo interno del turno: calcula reserva para la cuota de la moto, combustible de regreso a casa y colchón de imprevistos.",
  icono: "🧠",
  color: "#00f0ff",

  // Percibe y construye el modelo interno de proyección
  percibir: function (estado, pedido, jornada) {
    const turnosRestantes = jornada.pedidos.length - estado.turnoActual;
    const factorClima = jornada.clima === "Lluvia Fuerte" ? 1.5 : jornada.clima === "Garúa Limeña" ? 1.2 : 1.0;

    // Modelo interno: reservas financieras y operativas requeridas
    const reservaCuotaFija = MOTOR.CONFIG.CUOTA_ALQUILER_MOTO; // S/ 45
    const reservaCena = MOTOR.CONFIG.COSTO_CENA;                 // S/ 12
    const reservaImprevistos = (8.0 * factorClima);              // S/ 8 a S/ 12 por pinchazos o multas
    const reservaTotalDinero = reservaCuotaFija + reservaCena + reservaImprevistos;

    // Proyección de consumo de combustible y batería restante en la jornada
    const consumoCombustibleProyectado = turnosRestantes * 4.0;
    const consumoBateriaProyectado = turnosRestantes * 4.5;

    return {
      estado,
      pedido,
      turnosRestantes,
      clima: jornada.clima,
      reservaTotalDinero,
      reservaCuotaFija,
      reservaCena,
      reservaImprevistos,
      consumoCombustibleProyectado,
      consumoBateriaProyectado,
      saldoActual: estado.saldo,
      combustibleActual: estado.combustible,
      bateriaActual: estado.bateria,
    };
  },

  // Decide contrastando el estado proyectado contra el modelo interno
  decidir: function (m, estado, pedido) {
    // 1. Modelo de gestión de recursos: Parada preventiva si no alcanza para el resto del turno
    if (m.bateriaActual < 35.0 && m.turnosRestantes > 2 && m.saldoActual >= MOTOR.CONFIG.COSTO_RECARGA_BATERIA) {
      return {
        accion: "cargar_bateria",
        razon: `Modelo Interno: Batería restante (${m.bateriaActual.toFixed(1)}%) insuficiente para los ${m.turnosRestantes} turnos proyectados. Carga preventiva.`,
        pensamiento: `Mi modelo predice que me quedaré sin batería en ${Math.floor(m.bateriaActual / 5)} turnos. Cargo ahora para no quedar varado.`,
      };
    }

    if (m.combustibleActual < 30.0 && m.turnosRestantes > 2 && m.saldoActual >= MOTOR.CONFIG.COSTO_GASOLINA_TANQUEO) {
      return {
        accion: "recargar_combustible",
        razon: `Modelo Interno: Tanque (${m.combustibleActual.toFixed(1)}%) insuficiente para completar el recorrido nocturno. Tanqueo preventivo.`,
        pensamiento: `Calculo que el combustible restante no cubre los kilómetros proyectados para terminar la noche. Paro a tanquear.`,
      };
    }

    // 2. Modelo de seguridad territorial: Evaluación de probabilidad acumulada de asalto
    if (pedido.destino.factorPeligro > 0.40 && pedido.minutosDia >= (21 * 60)) {
      return {
        accion: "rechazar",
        razon: `Modelo Interno: Destino ${pedido.destino.nombre} posee riesgo crítico (${(pedido.destino.factorPeligro * 100).toFixed(0)}%) incompatible con la conservación del vehículo.`,
        pensamiento: `El modelo marca alerta roja en ${pedido.destino.nombre}. El riesgo de perder la moto supera cualquier ganancia.`,
      };
    }

    // 3. Modelo de solvencia económica: Comprobar si el saldo neto proyectado cumple la reserva
    const saldoProyectadoTrasGasto = m.saldoActual + pedido.pagoTotal;
    const combustibleTrasViaje = m.combustibleActual - pedido.gastoCombustible;
    const bateriaTrasViaje = m.bateriaActual - pedido.gastoBateria;

    // Si el viaje dejaría los recursos al borde del colapso, rechazar
    if (combustibleTrasViaje <= 10.0 || bateriaTrasViaje <= 10.0) {
      return {
        accion: "rechazar",
        razon: `Modelo Interno: El pedido drena recursos por debajo de la reserva crítica (Gasolina: ${combustibleTrasViaje.toFixed(1)}%, Bat: ${bateriaTrasViaje.toFixed(1)}%).`,
        pensamiento: `Si tomo esta entrega llego al límite de reserva crítica. Rechazo para preservar el vehículo.`,
      };
    }

    // Si el pedido aporta rentabilidad neta segura
    return {
      accion: "aceptar",
      razon: `Modelo Interno: El pedido a ${pedido.destino.nombre} (S/ ${pedido.pagoTotal.toFixed(1)}) es solvente. Saldo proyectado S/ ${saldoProyectadoTrasGasto.toFixed(1)} respeta la reserva requerida (S/ ${m.reservaTotalDinero.toFixed(1)}).`,
      pensamiento: `El viaje es rentable: gano S/ ${pedido.pagoTotal.toFixed(1)} y mantengo mi colchón de seguridad de S/ ${m.reservaTotalDinero.toFixed(1)}.`,
    };
  },
};
