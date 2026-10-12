# El Turno de Chambi: ¿Logrará sobrevivir al delivery nocturno en Lima? 🛵💨

**Trabajo Final de Agentes Inteligentes — USIL 2026-2 (Parte 1)**  
Simulador táctico multiagente y banco de pruebas de toma de decisiones bajo incertidumbre, recursos críticos y riesgo territorial.

* **Demo en línea (GitHub Pages):** [https://jussepe06.github.io/AI-Grupo-9-Snake-juego-proyecto-final/](https://jussepe06.github.io/AI-Grupo-9-Snake-juego-proyecto-final/)
* **Repositorio:** [https://github.com/jussepe06/AI-Grupo-9-Snake-juego-proyecto-final.git](https://github.com/jussepe06/AI-Grupo-9-Snake-juego-proyecto-final.git)

---

## 🌆 1. Problema y Contexto de la Simulación

Miles de repartidores de delivery en Lima (*Rappi, PedidosYa*) salen cada noche a trabajar en moto o bicicleta eléctrica para generar su sustento diario. Durante una jornada nocturna (19:00 a 00:00), se enfrentan a un problema clásico de **toma de decisiones secuencial bajo recursos finitos y riesgo estocástico**:
* **Recursos Críticos Físicos:** La batería del smartphone se drena con el GPS de la app de delivery; si llega a 0%, la app se apaga y el repartidor no cobra. El combustible de la moto es limitado; si se acaba en una avenida, queda varado en plena noche.
* **Riesgo Territorial Nocturno:** Entregar en distritos de alto peligro (zonas rojas como La Victoria o San Juan de Lurigancho) pasada la medianoche incrementa exponencialmente la probabilidad de asalto y pérdida de la herramienta de trabajo.
* **Metas Financieras Obligatorias:** Al final de la noche debe pagar una cuota fija obligatoria por el alquiler del vehículo (S/ 45) y costear su alimentación (S/ 12). Si no genera ese mínimo, termina en quiebre financiero.
* **El Dilema:** Aceptar todos los pedidos parece rentable al inicio, pero desgasta los recursos y conduce al asalto o al varado; rechazar demasiado evita riesgos pero impide pagar la cuota de la moto.

Este simulador modela la noche de **Chambi**, un repartidor en Lima, para comparar empíricamente cómo deciden las **5 familias canónicas de agentes inteligentes de Russell & Norvig** en el mismo entorno.

---

## 📐 2. Especificación Formal del Entorno (Marco PEAS)

| Componente | Especificación Técnica |
| :--- | :--- |
| **P (Performance / Rendimiento)** | • Maximizar el **saldo neto final** (ganancias menos cuota obligatoria de la moto S/ 45 y cena S/ 12).<br>• Penalizaciones severas por quedar varado (-100 pts) o sufrir asalto (-150 pts).<br>• Bono de reputación profesional si mantiene calificación $\ge 4.80\star$. |
| **E (Environment / Entorno)** | • **Dinámico y Secuencial:** Cada decisión altera la posición geográfica, el nivel de batería y el combustible.<br>• **Parcialmente Estocástico y Reproducible:** El clima (despejado, garúa limeña, lluvia) y los pedidos se determinan mediante una semilla pseudoaleatoria (PRNG Mulberry32) para garantizar comparaciones justas.<br>• **Discreto:** 14 turnos de entrega por jornada nocturna. |
| **A (Actuators / Actuadores)** | • `Aceptar`: Toma el pedido, viaja al destino, cobra tarifa y propina, y consume batería/combustible.<br>• `Rechazar`: Desprecia el pedido y espera la siguiente oportunidad.<br>• `Recargar Combustible`: Parada técnica en grifo (+55% combustible por S/ 15).<br>• `Cargar Batería`: Parada técnica en Tambo (+45% batería por S/ 3). |
| **S (Sensors / Sensores)** | • Sensores numéricos estructurados: Batería actual (%), Combustible actual (%), Saldo en soles (S/), Calificación (★), Hora actual, Distrito actual y Ficha del pedido entrante (Distrito origen, destino, tarifa base, propina, distancia en km, nivel de riesgo de asalto). |

---

## 🤖 3. Las 5 Familias de Agentes de Russell & Norvig

Cada técnica está implementada en un archivo modular independiente dentro de `js/agentes/`:

| Técnica | Archivo | Cómo Razona y Decide |
| :--- | :--- | :--- |
| **Modo Base (Ingenuo)** | `base.js` | Codicioso / impulsivo. Acepta cualquier pedido que entra sin evaluar recursos ni peligro de zona. Sirve como cota inferior (benchmark). |
| **Reflejo Simple** | `reflejo.js` | Reglas fijas *Condición-Acción* sin memoria: si la batería o combustible están críticos ($\le 20\%$) hace parada técnica; si el destino es zona roja de noche o paga menos de S/ 7, rechaza. |
| **Basado en Modelo** | `modelo.js` | Mantiene un **modelo interno del mundo proyectado**: calcula la cuota fija obligatoria de la moto, el combustible para volver a casa y un colchón de imprevistos por lluvia antes de autorizar un gasto. |
| **Basado en Objetivos** | `objetivos.js` | Jerarquía estricta de 5 metas en cascada: 1) Seguridad física (cero asaltos), 2) No quedar varado, 3) Reputación $\ge 4.7\star$, 4) Cubrir cuota de moto y cena, 5) Lucro neto. Bloquea cualquier viaje que amenace una meta superior. |
| **Basado en Utilidad** | `utilidad.js` | Balanza matemática continua multi-atributo: $U(s) = w_1 \cdot \text{Pago} - w_2 \cdot \text{Riesgo} - w_3 \cdot \text{Recursos} + w_4 \cdot \text{Rating}$. Resuelve de forma óptima los compromisos (*trade-offs*) con pesos calibrables en vivo. |

---

## 📊 4. Tabla de Resultados Estadísticos (Benchmark Masivo)

Evaluación masiva de **200 jornadas nocturnas simuladas por técnica** (semillas base 2025 a 2224). Cada agente enfrentó exactamente los mismos pedidos y contingencias meteorológicas:

| Técnica | Puntaje Promedio (95% Confianza) | % Supervivencia (Sin Quiebre) | Saldo Neto Promedio | Tiempo de Cómputo (200 Runs) |
| :--- | :--- | :--- | :--- | :--- |
| **Modo Base** | −60.7 ± 3.8 pts | 0.0 % | S/ 86.90 | 18 ms |
| **Reflejo Simple** | −21.0 ± 4.1 pts | 65.5 % | S/ 70.00 | 22 ms |
| **Basado en Modelo** | −0.2 ± 3.9 pts | 72.0 % | S/ 74.90 | 45 ms |
| **Basado en Objetivos** | 24.2 ± 3.2 pts | 83.0 % | S/ 45.20 | 48 ms |
| **Basado en Utilidad** | **41.8 ± 3.0 pts** | **89.0 %** | **S/ 63.00** | **52 ms** |

*Nota: El margen ± corresponde al intervalo de confianza del 95% ($1.96 \cdot \frac{\sigma}{\sqrt{N}}$). El tiempo es medido en el motor JavaScript del navegador.*

---

## 🎮 5. Modos de Uso del Simulador

1. **🤖 Ver a un Agente:** Observa la toma de decisiones autónoma paso a paso. Una nube de pensamiento dinámico sobre la moto explica la lógica interna de cada acción en tiempo real, mientras el mapa de Lima dibuja la ruta y el clima.
2. **👤 Jugar Yo (Manual):** Toma el control como repartidor humano; acepta o rechaza pedidos y gestiona el dinero para tanquear en el grifo o cargar batería en Tambo.
3. **📊 Comparar Agentes (Benchmark):** Ejecuta 200 jornadas estocásticas en menos de 60 milisegundos y genera gráficos de barras y de supervivencia directamente en Canvas.
4. **📥 Descarga de Telemetría para ML:** Exporta el historial de 2,800 decisiones a un archivo `.csv` con todas las variables tabulares, listo para entrenar modelos predictivos en el Avance 2 (Semana 15).

---

## 🚀 6. Cómo Ejecutar el Proyecto

### En Línea (Recomendado)
Abre la demo directamente en tu navegador:  
👉 **[https://jussepe06.github.io/AI-Grupo-9-Snake-juego-proyecto-final/](https://jussepe06.github.io/AI-Grupo-9-Snake-juego-proyecto-final/)**

### Localmente (Sin dependencias externas)
1. Clona el repositorio:
   ```bash
   git clone https://github.com/jussepe06/AI-Grupo-9-Snake-juego-proyecto-final.git
   cd AI-Grupo-9-Snake-juego-proyecto-final
   ```
2. Inicia un servidor web local con Python:
   ```bash
   python -m http.server 8080
   ```
3. Abre en tu navegador: `http://localhost:8080` (o haz doble clic sobre `index.html`).

---

## 📂 7. Estructura del Repositorio

```text
├── index.html                  # Aplicación SPA principal (Pestañas, HUD, Canvas)
├── .nojekyll                   # Compatibilidad de despliegue en GitHub Pages
├── css/
│   └── estilos.css             # Diseño Cyber-Urban, paleta neon y responsive
├── js/
│   ├── agentes/
│   │   ├── base.js             # Agente ingenuo impulsivo
│   │   ├── reflejo.js          # Agente reflejo simple (Condición-Acción)
│   │   ├── modelo.js           # Agente basado en modelo (Reservas proyectadas)
│   │   ├── objetivos.js        # Agente basado en objetivos (Metas jerárquicas)
│   │   └── utilidad.js         # Agente basado en utilidad (Balanza multi-atributo)
│   ├── nucleo/
│   │   ├── motor.js            # Motor físico, distritos, pedidos y semilla PRNG
│   │   └── telemetria.js       # Registro de features y exportación a CSV para ML
│   ├── mapa/
│   │   └── canvas.js           # Renderizado Canvas 2D de Lima, moto, rutas y lluvia
│   ├── interfaz/
│   │   └── graficos.js         # Gráficos estadísticos Canvas del benchmark
│   └── principal.js            # Controlador principal de UI y ciclo de turnos
└── README.md                   # Documentación técnica completa
```

---

## 👥 8. Integrantes y Roles

| Integrante | Rol en el Proyecto | Responsabilidad Técnica |
| :--- | :--- | :--- |
| **Josué Gutierrez** (Líder del Proyecto) | Arquitecto de Inteligencia Artificial & Jefe de Proyecto | Diseño formal de la taxonomía de agentes (Russell & Norvig), formulación matemática de la función de utilidad multicriterio (`utilidad.js`), modelado del agente de modelo (`modelo.js`) y orquestación general. |
| **Diego Valera** | Desarrollador de Agentes & Lógica Reactiva | Implementación del agente reflejo simple (`reflejo.js`), reglas condición-acción, modo base ingenuo (`base.js`) y calibración empírica de umbrales de recarga. |
| **Danitza Callupe** | Desarrolladora del Motor del Entorno & Físicas | Modelado urbano de distritos de Lima, matriz de riesgo territorial, física de consumo de combustible/batería (`motor.js`), contingencias de clima y generador determinista por semillas PRNG. |
| **Yared Chanca** | Desarrollador Frontend, Canvas & Telemetría | Renderizado del motor visual en HTML5 Canvas (`canvas.js`), animaciones de ruta, panel HUD interactivo, módulo de telemetría y exportador de dataset para Machine Learning (`telemetria.js`). |

**Flujo de Trabajo del Repositorio:**
* `main`: Versión estable de producción desplegada directamente en GitHub Pages.
* `develop`: Rama de integración para pruebas completas del simulador y corridas de benchmark.
* `feature/ia-agentes`, `feature/motor-entorno`, `feature/frontend-telemetria`: Ramas de desarrollo por componente.

---

## 🤖 9. Declaración de Uso de IA
Se utilizaron asistentes de IA para acelerar el maquetado de estilos CSS y la generación de la paleta visual neón. La formulación matemática de los agentes de Russell & Norvig, la jerarquía de metas y la función de utilidad fueron diseñadas y calibradas por el equipo de desarrollo.
