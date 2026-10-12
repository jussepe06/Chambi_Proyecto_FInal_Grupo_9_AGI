// ==========================================================================
// TELEMETRÍA Y GENERADOR DE DATASET ML (PREPARACIÓN AVANCE 2)
// ==========================================================================
"use strict";

const TELEMETRIA = (function () {
  const dataset = [];

  // Registra una fila de datos tabulares por cada paso de decisión
  function registrarPaso(semilla, paso, estado, pedido, agenteId, decision, estadoPost) {
    const fila = {
      semilla,
      paso,
      hora: pedido.hora,
      minutosDia: pedido.minutosDia,
      distritoOrigen: pedido.origen.nombre,
      distritoDestino: pedido.destino.nombre,
      riesgoZona: pedido.destino.riesgo,
      distKm: pedido.distKm,
      tarifaBase: pedido.tarifaBase,
      propina: pedido.propina,
      pagoTotal: pedido.pagoTotal,
      gastoBateriaEst: pedido.gastoBateria,
      gastoCombustibleEst: pedido.gastoCombustible,
      riesgoZonaEst: pedido.probAsalto,
      bateriaPre: parseFloat(estado.bateria.toFixed(1)),
      combustiblePre: parseFloat(estado.combustible.toFixed(1)),
      saldoPre: parseFloat(estado.saldo.toFixed(1)),
      agente: agenteId,
      accion: decision.accion,
      exitoPaso: !estadoPost.varado && !estadoPost.asaltadoGrave,
      saldoPost: parseFloat(estadoPost.saldo.toFixed(1)),
    };

    dataset.push(fila);
  }

  // Exporta el dataset completo acumulado a formato CSV descargable
  function descargarCSV() {
    if (dataset.length === 0) {
      alert("Aún no hay datos de telemetría registrados. Ejecuta una simulación o el benchmark primero.");
      return;
    }

    const headers = Object.keys(dataset[0]);
    let csvContent = headers.join(",") + "\n";

    dataset.forEach((row) => {
      const linea = headers.map((h) => {
        const val = row[h];
        if (typeof val === "string") return `"${val}"`;
        return val;
      }).join(",");
      csvContent += linea + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dataset_chambi_telemetria_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function getCount() {
    return dataset.length;
  }

  function limpiar() {
    dataset.length = 0;
  }

  return {
    registrarPaso,
    descargarCSV,
    getCount,
    limpiar,
  };
})();
