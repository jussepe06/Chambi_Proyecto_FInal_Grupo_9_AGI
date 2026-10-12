// ==========================================================================
// SISTEMA DE AUDIO RETRO-ARCADE CON WEB AUDIO API (SINTETIZADO EN NAVEGADOR)
// Cero dependencias externas, cero archivos .mp3 pesados, 100% nativo.
// ==========================================================================
"use strict";

const AUDIO = (function () {
  let audioCtx = null;
  let muteado = false;

  function obtenerContexto() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Notificación de nuevo pedido (Chime estilo app de delivery: Mi - Sol#)
  function sonarPedido() {
    if (muteado) return;
    const ctx = obtenerContexto();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(659.25, t); // E5
    osc2.frequency.setValueAtTime(830.61, t + 0.12); // G#5

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(t);
    osc1.stop(t + 0.15);
    osc2.start(t + 0.12);
    osc2.stop(t + 0.45);
  }

  // Rugido del motor de la moto al acelerar (Sawtooth con filtro de frecuencias)
  function sonarMotor() {
    if (muteado) return;
    const ctx = obtenerContexto();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.5);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.9);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(320, t);
    filter.frequency.linearRampToValueAtTime(700, t + 0.4);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.95);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.95);
  }

  // Sonido de monedas / caja registradora al completar una entrega exitosa
  function sonarCobra() {
    if (muteado) return;
    const ctx = obtenerContexto();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "triangle";
    osc2.type = "triangle";
    osc1.frequency.setValueAtTime(987.77, t); // B5
    osc2.frequency.setValueAtTime(1318.51, t + 0.08); // E6

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(t);
    osc1.stop(t + 0.12);
    osc2.start(t + 0.08);
    osc2.stop(t + 0.5);
  }

  // Alerta de peligro o rechazo de zona roja
  function sonarAlerta() {
    if (muteado) return;
    const ctx = obtenerContexto();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.setValueAtTime(180, t + 0.1);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  // Tono ascendente de recarga de batería en Tambo o grifo
  function sonarRecarga() {
    if (muteado) return;
    const ctx = obtenerContexto();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(750, t + 0.35);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  function toggleMute() {
    muteado = !muteado;
    return muteado;
  }

  function estaMuteado() {
    return muteado;
  }

  return {
    sonarPedido,
    sonarMotor,
    sonarCobra,
    sonarAlerta,
    sonarRecarga,
    toggleMute,
    estaMuteado,
  };
})();
