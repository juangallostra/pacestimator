// ---------- i18n ----------
export const LANGS = ['es', 'ca', 'en'];
export const LANG_LABELS = { es: 'Español', ca: 'Català', en: 'English' };
const STORAGE_KEY = 'ritmoSendero.lang';

const translations = {
  es: {
    app: {
      title: `Ritmo de Sendero`,
      h1: `Estimador de ritmo por desnivel`,
      sub: `Calcula tu ritmo equivalente en llano a partir de tus últimos entrenos y lo aplica al perfil de un track objetivo, tramo a tramo.`
    },
    step1: {
      tag: `Paso 1`,
      title: `Sube tus entrenos`,
      desc: `Arrastra varios GPX de tus últimas salidas (cuantas más, mejor calibrado saldrá tu ritmo base). Necesitan llevar marcas de tiempo por punto — casi cualquier reloj o app de running las incluye al exportar.`,
      gradeWindowLabel: `Ventana lineal para calcular la pendiente:`,
      gradeWindowOpt5: `5 m`,
      gradeWindowOpt10: `10 m`,
      gradeWindowOpt20: `20 m (por defecto)`,
      gradeWindowOpt50: `50 m`,
      gradeWindowOpt100: `100 m`,
      gradeWindowFootnote: `La pendiente de cada tramo se calcula comparando la elevación al principio y al final de una ventana de esta longitud a lo largo del track (no entre cada dos puntos GPS consecutivos, que suelen estar a 1-5 m). Ventanas más cortas dan más detalle pero son más sensibles al ruido de altímetro; ventanas más largas suavizan ese ruido pero difuminan cambios de pendiente cortos (por ejemplo, un repecho de 10 m dentro de una ventana de 50 m puede diluirse).`,
      dropzoneText: `<strong>Arrastra tus archivos .gpx aquí</strong> o haz clic para seleccionarlos (puedes elegir varios a la vez)`,
      hint: `Cómo exportar GPX con tiempos: en Strava, entra en el entreno → menú "···" → Exportar GPX. En Garmin Connect, Coros, Suunto o COROS App hay una opción equivalente en cada actividad.`,
      clearBtn: `Vaciar todos los entrenos`,
      statBaseline: `Ritmo llano equivalente`,
      statRuns: `Entrenos analizados`,
      statDist: `Distancia analizada`,
      statLongest: `Tirada más larga`,
      chartTitle: `Tu curva de esfuerzo — ritmo real vs. pendiente`,
      binLabel: `Ventana de agrupación para el gráfico (% de pendiente):`,
      binOpt1: `1%`,
      binOpt2: `2% (por defecto)`,
      binOpt3: `3%`,
      binOpt5: `5%`,
      chartDesc: `Cada <strong style="color:var(--moss);">punto verde</strong> es tu ritmo real mediano en los tramos de entreno que tenían esa pendiente aproximada — cuanto más grande el punto, más tramos hay con esa pendiente (más fiable). El eje horizontal es la <strong>pendiente</strong> (negativo = bajada, positivo = subida); el eje vertical es tu <strong>ritmo</strong> en min/km, y va al revés de lo intuitivo: más abajo en el gráfico = más rápido. Las dos líneas no son datos tuyos, son lo que predice cada modelo teórico para cada pendiente a partir de tu ritmo llano medio — cuanto más cerca pasen de tus puntos verdes, mejor describe ese modelo tu forma de correr.`,
      legendObserved: `Ritmo observado por tramo (mediana por bin de pendiente)`,
      legendMinetti: `Minetti (2002) — modelo usado para la estimación`,
      legendAcsm: `ACSM — modelo de referencia alternativo`,
      hoverHint: `💡 Pasa el ratón por cualquier punto de las líneas naranja o azulada para ver el cálculo exacto del ritmo predicho en esa pendiente.`,
      explainSummary: `¿De dónde sale tu ritmo llano equivalente, y qué tan bien ajusta?`,
      explainBody: `
        <p><strong>Cómo se construye el gráfico, paso a paso:</strong></p>
        <p>Cada entreno se divide en miles de tramos muy cortos (punto GPS a punto GPS). Para cada tramo se calcula la <strong>pendiente</strong> (desnivel ÷ distancia) y el <strong>ritmo real</strong> que llevabas en ese instante. Luego se agrupan todos los tramos en "cajones" de pendiente (por defecto de 2% de ancho: de -2% a 0%, de 0% a 2%, de 2% a 4%, etc.) y dentro de cada cajón se toma la <strong>mediana</strong> del ritmo — eso es cada punto verde del gráfico. Solo se dibujan cajones con al menos 3 tramos, para no pintar puntos poco fiables basados en uno o dos datos sueltos.</p>
        <p>El ancho de ese cajón ("ventana de agrupación", en % de pendiente) es configurable con el selector de arriba del gráfico. Es un compromiso: un cajón <strong>estrecho</strong> (1%) da más resolución y detecta cambios de ritmo más finos entre pendientes parecidas, pero tiene menos tramos dentro y el punto resultante es más ruidoso (y algunos cajones pueden quedarse sin los 3 tramos mínimos y no dibujarse). Un cajón <strong>ancho</strong> (5%) da puntos más estables porque promedia más datos, pero mezcla pendientes que pueden ser bastante distintas entre sí. 2% suele ser un buen punto de partida salvo que tengas muy pocos o muchísimos datos.</p>
        <p><strong>Ojo, esto es distinto de la "ventana lineal" del Paso 1:</strong> esta ventana de aquí solo agrupa puntos ya calculados para dibujar el gráfico y medir el ajuste (en % de pendiente). La ventana lineal del Paso 1 (en metros) es anterior en la cadena: decide cómo se calcula cada pendiente individual a partir del GPX crudo, comparando la elevación al principio y al final de un tramo de esa longitud sobre el terreno — es la que responde a "¿estás calculando la pendiente entre cada dos puntos del GPX, o sobre una distancia mayor?". Cambiar la ventana lineal cambia qué tramos existen; cambiar este cajón solo cambia cómo se agrupan para el gráfico.</p>
        <p>Correr cuesta arriba o cuesta abajo no gasta la misma energía que en llano a igualdad de ritmo. Para "traducir" cada tramo a su equivalente en llano, esta app usa la ecuación de coste metabólico de <strong>Minetti et al. (2002)</strong>, el modelo de referencia más citado en biomecánica de carrera y el que mejor captura el sobrecoste de frenado en bajadas pronunciadas:</p>
        <p><code>C(i) = 155.4·i⁵ − 30.4·i⁴ − 43.3·i³ + 46.3·i² + 19.5·i + 3.6</code></p>
        <p>Con esa curva de coste, el ritmo real de cada tramo se reescala a "lo que costaría ese mismo esfuerzo en llano": <code>ritmo_llano = ritmo_real × C(0) / C(pendiente)</code>. Tu <strong>ritmo llano equivalente</strong> final es la media de todos esos tramos, ponderada por la distancia de cada uno — así los entrenos largos pesan más que uno corto de recuperación. Esa cifra es la que ves arriba del todo, en "Ritmo llano equivalente", y es el punto de partida (grado 0%) del que salen las dos líneas del gráfico: se dibujan aplicando <code>C(pendiente)/C(0)</code> de cada modelo a ese ritmo base, para cada valor de pendiente entre -30% y +30%.</p>
        <p><strong>De dónde sale exactamente cada punto de la línea naranja:</strong> para cualquier pendiente, se calcula <code>C(pendiente)</code> con la fórmula de Minetti, se divide entre <code>C(0)=3.6</code> (el coste en llano) para obtener un ratio, y ese ratio multiplica tu ritmo llano equivalente. Con tus datos actuales, así queda para varias pendientes de ejemplo:</p>
        <div id="gapWorkedExample"></div>
        <p style="margin-top:10px;">Por eso la curva no es una línea recta: <code>C(i)</code> es un polinomio de grado 5, así que crece más rápido en pendientes muy pronunciadas (subir o bajar un tramo muy inclinado penaliza desproporcionadamente más que uno suave) y tiene su mínimo ligeramente por debajo del 0% — bajar un poco suele costar algo menos de energía que ir en llano, según el modelo.</p>
        <p><strong>¿Cómo de bien ajusta cada modelo?</strong> Debajo del gráfico se muestran dos métricas por modelo, calculadas comparando cada línea contra tus propios puntos verdes:</p>
        <ul>
          <li><strong>Desviación media</strong>: el error medio en % entre lo que predice el modelo y tu ritmo real observado, cajón a cajón. Un 8% significa que, en promedio, el modelo se equivoca por 8 de cada 100 segundos de tu ritmo real en esa pendiente.</li>
          <li><strong>R²</strong>: va de 0 a 1 (a veces puede salir negativo). Indica qué proporción de las diferencias de ritmo entre pendientes explica el modelo. Un R² de 0.85 es un buen ajuste; cerca de 0 o negativo significa que el modelo no está describiendo bien cómo cambia tu ritmo con la pendiente en tu caso concreto.</li>
        </ul>
        <p><strong>Modelo de referencia alternativo — ACSM:</strong> además de Minetti, se dibuja la ecuación de la American College of Sports Medicine (<code>VO₂ = 0.2·v + 0.9·v·pendiente + 3.5</code>), muy usada en fisiología del ejercicio por su sencillez. Es lineal, así que no captura el frenado extra en bajadas pronunciadas, y varios estudios (p. ej. Fikes et al., 1999) han encontrado que sobreestima el coste real de correr — se muestra solo como referencia de comparación, no se usa para calcular tu estimación.</p>
        <p><strong>Para quien quiera profundizar:</strong> un estudio reciente (Looney, Hoogkamer &amp; Kram, <em>European Journal of Applied Physiology</em>, 2026) actualiza y compara varios modelos —incluyendo Minetti y ACSM— con un conjunto de datos mucho mayor, y propone las ecuaciones RE3/HTK como mejora adicional, especialmente en bajada. No están implementadas aquí por no tener sus coeficientes exactos confirmados, pero es la referencia más actual si buscas ir más allá de Minetti.</p>
      `,
      profileTitle: `Perfil de corredor — puntos fuertes y a mejorar`,
      profileDesc: `En cada franja de pendiente, "<strong>% vs. modelo</strong>" compara tu ritmo real medio con el que predice el modelo a partir de tu propio ritmo llano — no te compara con otros corredores. Un <strong style="color:var(--ochre);">+15%</strong> significa que en esa pendiente vas un 15% más lento de lo que tu propio nivel general haría esperar (posible punto débil); un <strong style="color:var(--moss);">-10%</strong> significa que vas un 10% más rápido de lo esperado (punto fuerte relativo).`,
      profileExplainSummary: `¿Cómo se calcula esto?`,
      profileExplainBody: `
        <p>Tus tramos de entreno se agrupan en 5 franjas de pendiente. En cada una se compara tu ritmo real medio con el que predice el modelo de Minetti a partir de tu ritmo llano equivalente — es decir, "lo que te tocaría" en esa pendiente si tu rendimiento fuera igual de eficiente en toda la gama de pendientes.</p>
        <p>Si en una franja vas más lento de lo que el modelo predice, esa franja te cuesta relativamente más que al corredor "estándar" que describe la ecuación — una señal de margen de mejora específico de terreno (técnica, fuerza, confianza), no necesariamente de forma física general. Si vas más rápido de lo esperado, es un punto fuerte relativo.</p>
        <p>Franjas con menos de 1 km analizado se muestran igualmente pero con el aviso de que hay poco dato para fiarse del número.</p>
      `
    },
    step2: {
      tag: `Paso 2`,
      title: `Sube el track objetivo`,
      desc: `El GPX de la carrera o ruta que quieres estimar. No necesita tiempos, solo el trazado con elevación. Todo se procesa en tu navegador.`,
      dropzoneText: `<strong>Arrastra tu archivo .gpx aquí</strong> o haz clic para seleccionarlo`,
      removeBtn: `Quitar track objetivo`
    },
    step3: {
      tag: `Paso 3`,
      title: `Estimación`,
      desc: `Ritmo y tiempo estimados aplicando tu curva de esfuerzo al perfil del track objetivo.`,
      resultTimeLabel: `Tiempo estimado`,
      resultPaceLabel: `Ritmo medio`,
      resultDistLabel: `Distancia · D+ · D-`,
      confidenceTitle: `Nivel de confianza de la estimación`,
      confidenceExplainSummary: `¿Cómo se calcula la confianza?`,
      confidenceExplainBody: `
        <p>No es una probabilidad estadística formal, sino un indicador orientativo que combina cuatro señales sobre cuánto puedes fiarte del número de arriba:</p>
        <ul>
          <li><strong>Volumen de datos</strong>: cuántos km de entrenos has analizado. Con pocos km, el ritmo base está mal calibrado.</li>
          <li><strong>Cobertura de pendientes</strong>: qué parte del track objetivo transcurre por pendientes que ya has corrido antes. En tramos con pendientes que nunca has entrenado, el modelo extrapola con la curva de Minetti sin datos reales que la contrasten.</li>
          <li><strong>Ajuste del modelo</strong>: cuánto se parece la curva teórica a tu ritmo real observado por pendiente (ver el gráfico del Paso 1). Si tu forma de correr cuestas se aleja mucho del modelo estándar, la confianza baja.</li>
          <li><strong>Extrapolación de distancia</strong>: si la carrera es mucho más larga que tu tirada más larga analizada, el ajuste de fatiga (Riegel) es más especulativo.</li>
        </ul>
      `,
      calcExplainSummary: `¿Cómo se calcula el tiempo estimado?`,
      calcExplainBody: `
        <p>El track objetivo también se divide en tramos punto a punto. A cada tramo se le aplica tu ritmo llano equivalente ajustado por su pendiente concreta (la misma ecuación de Minetti, pero ahora en sentido inverso: <code>ritmo_tramo = ritmo_llano × C(pendiente) / C(0)</code>), y se suman los tiempos de todos los tramos.</p>
        <p>Si la distancia del track objetivo supera claramente tu tirada más larga analizada, se añade un pequeño recargo de fatiga (escalado tipo <strong>fórmula de Riegel</strong>, exponente 1.06) sobre el tiempo total — el razonamiento es que mantener el ritmo se hace progresivamente más difícil cuanto más dura el esfuerzo, más allá de lo que ya recoge el modelo de pendiente. Debajo de la tabla se indica si se aplicó y con qué factor.</p>
        <p>El <strong>ritmo medio</strong> es simplemente el tiempo total dividido entre la distancia total del track.</p>
      `,
      profileChartTitle: `Perfil de elevación — color = intensidad estimada`,
      legendFaster: `Más rápido que tu ritmo base`,
      legendBase: `≈ ritmo base`,
      legendSlower: `Más lento (subida exigente)`,
      colorsExplainSummary: `¿Qué significan los colores?`,
      colorsExplainBody: `
        <p>Cada franja del perfil es un tramo del track objetivo, coloreado según el ritmo estimado para ese tramo comparado con tu ritmo llano equivalente: verde donde el modelo predice que irás más rápido que tu base (bajadas suaves, terreno favorable), gris donde el esfuerzo es similar al llano, y naranja/rojo en las subidas más exigentes, donde el ritmo se ralentiza más.</p>
        <p>Pasa el ratón por encima de cualquier punto del perfil para ver la pendiente, el ritmo estimado y el tiempo acumulado hasta ese punto exacto.</p>
      `,
      keyPoints: {
        title: `Puntos clave del recorrido`,
        desc: `Fin de cada subida y bajada significativa (≥30 m de desnivel), con el ritmo de ese tramo y el tiempo estimado de paso por ese punto.`,
        typeSummit: `Cima`,
        typeValley: `Valle`,
        thPoint: `Punto`,
        thElevation: `Elevación`,
        thLeg: `Desnivel del tramo`,
        thPace: `Ritmo del tramo`,
        thTime: `Tiempo estimado`,
        legFormat: `{sign}{m}m en {km} km`
      },
      thKm: `Km`,
      thPace: `Ritmo`,
      thSegTime: `Tiempo tramo`,
      thElapsed: `Acumulado`,
      thGain: `D+`,
      thGrade: `Pend. media`,
      columnsExplainSummary: `¿Qué significa cada columna?`,
      columnsExplainBody: `
        <ul>
          <li><strong>Km</strong>: marca kilométrica sobre el track objetivo (no sobre tus entrenos).</li>
          <li><strong>Ritmo</strong>: ritmo estimado medio durante ese kilómetro concreto, ya ajustado a su desnivel.</li>
          <li><strong>Tiempo tramo</strong>: tiempo estimado para recorrer solo ese kilómetro.</li>
          <li><strong>Acumulado</strong>: tiempo total estimado desde la salida hasta el final de ese kilómetro.</li>
          <li><strong>D+</strong>: desnivel positivo ganado durante ese kilómetro.</li>
          <li><strong>Pend. media</strong>: pendiente media de ese kilómetro (desnivel neto ÷ distancia).</li>
        </ul>
      `,
      disclaimer: `Es una estimación fisiológica (modelo de Minetti, 2002), no una predicción exacta: no tiene en cuenta terreno técnico, nutrición, clima del día de carrera ni tu estado de forma puntual.`
    },
    misc: {
      allRemoved: `Se han quitado todos los entrenos.`,
      noGpxFiles: `No se encontraron archivos .gpx en la selección.`,
      processing: `Procesando {n} archivo(s)...`,
      noTimestamps: `sin marcas de tiempo — omitido`,
      noValidSegments: `sin tramos válidos — omitido`,
      fileReadErrorGeneric: `error al leer el archivo`,
      insufficientData: `Datos insuficientes todavía. Añade más entrenos (con tiempos) para calibrar tu ritmo base.`,
      addedSuffix: `{n} añadido(s)`,
      updatedSuffix: `{n} actualizado(s)`,
      skippedSuffix: `{n} omitido(s)`,
      totalSegments: `{n} tramos en total.`,
      removeTrainingTitle: `Quitar este entreno`,
      trainingRemovedCount: `Entreno eliminado. {n} tramos en total.`,
      targetRemoved: `Track objetivo eliminado.`,
      readingFile: `Leyendo {name}...`,
      trackLoaded: `Track cargado: {dist} km, D+{gainUp}m, D-{gainDown}m.`,
      gpxReadError: `No se pudo leer el GPX: {msg}`,
      riegelApplied: `La distancia objetivo ({dist} km) supera tu tirada más larga analizada ({longest} km), así que se aplicó un factor de fatiga adicional de {factor}x (escalado tipo Riegel, exponente 1.06) sobre el tiempo total.`,
      riegelNotApplied: `La distancia objetivo está dentro del rango de tus tiradas analizadas, no se aplicó corrección de fatiga adicional.`
    },
    errors: {
      cantReadFile: `no se pudo leer {name}`,
      invalidXml: `archivo XML inválido`,
      notEnoughPoints: `el track no tiene suficientes puntos`
    },
    chart: {
      gradeAxis: `pendiente`,
      tooltipLine1: `<strong>{model}</strong> a {grade} de pendiente<br>`,
      notEnoughGradesFit: `Aún no hay suficientes pendientes distintas en tus entrenos para medir el ajuste del modelo.`,
      fitIntro: `Ajuste de cada línea a tus puntos verdes:`,
      avgDeviation: `desviación media`,
      fitConclusion: `en tus {n} pendientes con datos suficientes, <strong>{better}</strong> se ajusta mejor a tu ritmo real.`,
      worked: {
        gradeHeader: `Pendiente`,
        costHeader: `C(pendiente)`,
        ratioHeader: `C(pendiente)/C(0)`,
        paceHeader: `Ritmo predicho (Minetti)`
      }
    },
    profile: {
      zones: {
        strongDown: { label: `Bajada fuerte`, range: `< -15%` },
        modDown: { label: `Bajada moderada`, range: `-15% a -5%` },
        flat: { label: `Llano / rodante`, range: `-5% a +5%` },
        modUp: { label: `Subida moderada`, range: `+5% a +15%` },
        strongUp: { label: `Subida fuerte`, range: `> +15%` }
      },
      notEnoughZoneData: `Aún no tienes al menos 1 km analizado en esta franja de pendiente — sube algún entreno con más terreno así para poder evaluarla.`,
      advice: {
        strongDown: {
          slowBig: `Vas notablemente más lento de lo esperado en las bajadas más pronunciadas — suele ser una mezcla de técnica de pisada y confianza más que de forma física. Series cortas en pendiente técnica, trabajo de cadencia alta y fuerza excéntrica de cuádriceps ayudan bastante aquí.`,
          slowSmall: `Ligeramente más lento de lo esperado en bajada fuerte — con algo más de práctica en terreno técnico debería ajustarse solo.`,
          fast: `Buen punto fuerte: en las bajadas más exigentes rindes mejor de lo que predice el modelo. Aprovéchalo en carrera para recuperar tiempo sobre rivales que frenen más.`
        },
        modDown: {
          slow: `Ritmo algo por debajo de lo esperado en bajada moderada — normalmente mejora solo con más volumen de trail y soltura en el gesto.`,
          fast: `Rindes mejor de lo esperado en bajada moderada — terreno favorable para ti.`
        },
        flat: {
          slow: `En llano/rodante vas algo más lento de lo que tu propio nivel general sugeriría — puede valer la pena algo de trabajo de ritmo específico en llano (series, tempo runs).`,
          fast: `Buena eficiencia en llano/rodante respecto a tu nivel general.`
        },
        modUp: {
          slow: `Las subidas moderadas te penalizan más de lo esperado — repeticiones en cuesta de 3-6 min a ritmo constante suelen dar una mejora notable aquí.`,
          fast: `Punto fuerte en subida moderada — sigues rindiendo por encima de lo esperado según tu modelo.`
        },
        strongUp: {
          slowBig: `En las subidas más exigentes pierdes bastante más tiempo del esperado — trabajo específico de fuerza-resistencia (series cortas muy inclinadas, escaleras, powerhiking con bastones) suele tener el mayor retorno de todos estos puntos.`,
          slowSmall: `Algo por debajo de lo esperado en subida fuerte, pero no es tu mayor margen de mejora.`,
          fast: `Muy buen punto fuerte: en las subidas más duras rindes claramente mejor de lo esperado.`
        }
      },
      notEnoughVariety: `Todavía no hay suficiente variedad de pendientes en tus entrenos para sacar conclusiones por franja — sube entrenos con algo de desnivel variado (subidas y bajadas, no solo llano).`,
      summaryWorst: `Tu mayor margen de mejora relativo: <strong style="color:var(--ochre)">{label}</strong> ({pct}% respecto al modelo). `,
      summaryBest: `Tu punto más fuerte relativo: <strong style="color:var(--moss)">{label}</strong> ({pct}%).`,
      notEnoughDataShort: `sin datos suficientes`,
      vsModel: `{sign}{pct}% vs. modelo`,
      kmAnalyzed: `{km} km analizados`,
      realVsModel: ` · ritmo real {obs}/km · modelo {pred}/km`,
      targetPctSuffix: `{pct}% de tu carrera objetivo va por aquí`,
      targetWarning: `⚠ El {pct}% de tu carrera objetivo transcurre por <strong>{label}</strong>, justo tu mayor margen de mejora. Merece la pena priorizar ese tipo de entreno en las semanas previas.`,
      tooltip: `{dist} km · pend. {grade}% · ritmo {pace}/km · acum. {time}`
    },
    confidence: {
      high: `Alta`, medium: `Media`, low: `Baja`,
      factorVolume: { name: `Volumen de datos`, note: `{km} km analizados en {n} entreno(s). Más de ~60 km bien repartidos da una base sólida.` },
      factorCoverage: { name: `Cobertura de pendientes`, note: `{pct}% del track objetivo transcurre por pendientes que ya has corrido antes; el resto se extrapola con el modelo teórico.` },
      factorFit: { name: `Ajuste del modelo a tu forma de correr`, note: `Desviación media del {mape}% entre la curva de Minetti y tu ritmo real observado por pendiente.` },
      factorDistance: {
        name: `Extrapolación de distancia`,
        noteApplied: `La carrera es más larga que tu tirada más probada, factor de fatiga aplicado: {factor}x.`,
        noteNotApplied: `La distancia está dentro de lo que ya has probado en entrenos.`
      }
    }
  },

  ca: {
    app: {
      title: `Ritmo de Sendero`,
      h1: `Estimador de ritme segons el desnivell`,
      sub: `Calcula el teu ritme equivalent en pla a partir dels teus últims entrenaments i l'aplica al perfil d'un track objectiu, tram a tram.`
    },
    step1: {
      tag: `Pas 1`,
      title: `Puja els teus entrenaments`,
      desc: `Arrossega diversos GPX de les teves últimes sortides (com més en tinguis, millor calibrat sortirà el teu ritme base). Cal que portin marques de temps per punt — gairebé qualsevol rellotge o app de running les inclou en exportar.`,
      gradeWindowLabel: `Finestra lineal per calcular el pendent:`,
      gradeWindowOpt5: `5 m`,
      gradeWindowOpt10: `10 m`,
      gradeWindowOpt20: `20 m (per defecte)`,
      gradeWindowOpt50: `50 m`,
      gradeWindowOpt100: `100 m`,
      gradeWindowFootnote: `El pendent de cada tram es calcula comparant l'elevació a l'inici i al final d'una finestra d'aquesta longitud al llarg del track (no entre cada dos punts GPS consecutius, que solen estar a 1-5 m). Finestres més curtes donen més detall però són més sensibles al soroll de l'altímetre; finestres més llargues suavitzen aquest soroll però difuminen canvis de pendent curts (per exemple, una rampa de 10 m dins d'una finestra de 50 m es pot diluir).`,
      dropzoneText: `<strong>Arrossega els teus fitxers .gpx aquí</strong> o fes clic per seleccionar-los (pots triar-ne diversos alhora)`,
      hint: `Com exportar GPX amb temps: a Strava, entra a l'entrenament → menú "···" → Exporta GPX. A Garmin Connect, Coros, Suunto o l'app COROS hi ha una opció equivalent a cada activitat.`,
      clearBtn: `Buida tots els entrenaments`,
      statBaseline: `Ritme pla equivalent`,
      statRuns: `Entrenaments analitzats`,
      statDist: `Distància analitzada`,
      statLongest: `Tirada més llarga`,
      chartTitle: `La teva corba d'esforç — ritme real vs. pendent`,
      binLabel: `Finestra d'agrupació per al gràfic (% de pendent):`,
      binOpt1: `1%`,
      binOpt2: `2% (per defecte)`,
      binOpt3: `3%`,
      binOpt5: `5%`,
      chartDesc: `Cada <strong style="color:var(--moss);">punt verd</strong> és el teu ritme real mitjà als trams d'entrenament que tenien aquest pendent aproximat — com més gran el punt, més trams hi ha amb aquest pendent (més fiable). L'eix horitzontal és el <strong>pendent</strong> (negatiu = baixada, positiu = pujada); l'eix vertical és el teu <strong>ritme</strong> en min/km, i va al revés de l'intuïtiu: més avall al gràfic = més ràpid. Les dues línies no són dades teves, són el que prediu cada model teòric per a cada pendent a partir del teu ritme pla mitjà — com més a prop passin dels teus punts verds, millor descriu aquell model la teva manera de córrer.`,
      legendObserved: `Ritme observat per tram (mediana per bin de pendent)`,
      legendMinetti: `Minetti (2002) — model utilitzat per a l'estimació`,
      legendAcsm: `ACSM — model de referència alternatiu`,
      hoverHint: `💡 Passa el ratolí per qualsevol punt de les línies taronja o blavosa per veure el càlcul exacte del ritme previst en aquell pendent.`,
      explainSummary: `D'on surt el teu ritme pla equivalent, i com d'ajustat és?`,
      explainBody: `
        <p><strong>Com es construeix el gràfic, pas a pas:</strong></p>
        <p>Cada entrenament es divideix en milers de trams molt curts (punt GPS a punt GPS). Per a cada tram es calcula el <strong>pendent</strong> (desnivell ÷ distància) i el <strong>ritme real</strong> que portaves en aquell instant. Després s'agrupen tots els trams en "calaixos" de pendent (per defecte de 2% d'amplada: de -2% a 0%, de 0% a 2%, de 2% a 4%, etc.) i dins de cada calaix es pren la <strong>mediana</strong> del ritme — això és cada punt verd del gràfic. Només es dibuixen calaixos amb almenys 3 trams, per no pintar punts poc fiables basats en una o dues dades soltes.</p>
        <p>L'amplada d'aquest calaix ("finestra d'agrupació", en % de pendent) es pot configurar amb el selector de sobre del gràfic. És un compromís: un calaix <strong>estret</strong> (1%) dona més resolució i detecta canvis de ritme més fins entre pendents semblants, però té menys trams a dins i el punt resultant és més sorollós (i alguns calaixos poden quedar-se sense els 3 trams mínims i no es dibuixaran). Un calaix <strong>ample</strong> (5%) dona punts més estables perquè promitja més dades, però barreja pendents que poden ser força diferents entre si. El 2% sol ser un bon punt de partida llevat que tinguis molt poques o moltíssimes dades.</p>
        <p><strong>Compte, això és diferent de la "finestra lineal" del Pas 1:</strong> aquesta finestra d'aquí només agrupa punts ja calculats per dibuixar el gràfic i mesurar l'ajust (en % de pendent). La finestra lineal del Pas 1 (en metres) és anterior en la cadena: decideix com es calcula cada pendent individual a partir del GPX cru, comparant l'elevació a l'inici i al final d'un tram d'aquesta longitud sobre el terreny — és la que respon a "estàs calculant el pendent entre cada dos punts del GPX, o sobre una distància més gran?". Canviar la finestra lineal canvia quins trams existeixen; canviar aquest calaix només canvia com s'agrupen per al gràfic.</p>
        <p>Córrer costa amunt o costa avall no gasta la mateixa energia que en pla a igualtat de ritme. Per "traduir" cada tram al seu equivalent en pla, aquesta app fa servir l'equació de cost metabòlic de <strong>Minetti et al. (2002)</strong>, el model de referència més citat en biomecànica de la cursa i el que millor captura el sobrecost de frenada en baixades pronunciades:</p>
        <p><code>C(i) = 155.4·i⁵ − 30.4·i⁴ − 43.3·i³ + 46.3·i² + 19.5·i + 3.6</code></p>
        <p>Amb aquesta corba de cost, el ritme real de cada tram es reescala a "el que costaria aquest mateix esforç en pla": <code>ritme_pla = ritme_real × C(0) / C(pendent)</code>. El teu <strong>ritme pla equivalent</strong> final és la mitjana de tots aquests trams, ponderada per la distància de cadascun — així els entrenaments llargs pesen més que un de curt de recuperació. Aquesta xifra és la que veus a dalt de tot, a "Ritme pla equivalent", i és el punt de partida (grau 0%) d'on surten les dues línies del gràfic: es dibuixen aplicant <code>C(pendent)/C(0)</code> de cada model a aquest ritme base, per a cada valor de pendent entre -30% i +30%.</p>
        <p><strong>D'on surt exactament cada punt de la línia taronja:</strong> per a qualsevol pendent, es calcula <code>C(pendent)</code> amb la fórmula de Minetti, es divideix entre <code>C(0)=3.6</code> (el cost en pla) per obtenir un ràtio, i aquest ràtio multiplica el teu ritme pla equivalent. Amb les teves dades actuals, així queda per a diversos pendents d'exemple:</p>
        <div id="gapWorkedExample"></div>
        <p style="margin-top:10px;">Per això la corba no és una línia recta: <code>C(i)</code> és un polinomi de grau 5, així que creix més ràpid en pendents molt pronunciats (pujar o baixar un tram molt inclinat penalitza desproporcionadament més que un de suau) i té el seu mínim lleugerament per sota del 0% — baixar una mica sol costar una mica menys d'energia que anar en pla, segons el model.</p>
        <p><strong>Com d'ajustat és cada model?</strong> Sota el gràfic es mostren dues mètriques per model, calculades comparant cada línia amb els teus propis punts verds:</p>
        <ul>
          <li><strong>Desviació mitjana</strong>: l'error mitjà en % entre el que prediu el model i el teu ritme real observat, calaix a calaix. Un 8% significa que, de mitjana, el model s'equivoca en 8 de cada 100 segons del teu ritme real en aquell pendent.</li>
          <li><strong>R²</strong>: va de 0 a 1 (de vegades pot sortir negatiu). Indica quina proporció de les diferències de ritme entre pendents explica el model. Un R² de 0.85 és un bon ajust; a prop de 0 o negatiu significa que el model no descriu bé com canvia el teu ritme amb el pendent en el teu cas concret.</li>
        </ul>
        <p><strong>Model de referència alternatiu — ACSM:</strong> a més de Minetti, es dibuixa l'equació de l'American College of Sports Medicine (<code>VO₂ = 0.2·v + 0.9·v·pendent + 3.5</code>), molt utilitzada en fisiologia de l'exercici per la seva senzillesa. És lineal, així que no captura el frenat extra en baixades pronunciades, i diversos estudis (p. ex. Fikes et al., 1999) han trobat que sobreestima el cost real de córrer — es mostra només com a referència de comparació, no s'utilitza per calcular la teva estimació.</p>
        <p><strong>Per a qui vulgui aprofundir-hi:</strong> un estudi recent (Looney, Hoogkamer &amp; Kram, <em>European Journal of Applied Physiology</em>, 2026) actualitza i compara diversos models —incloent-hi Minetti i ACSM— amb un conjunt de dades molt més gran, i proposa les equacions RE3/HTK com a millora addicional, especialment en baixada. No estan implementades aquí per no tenir els seus coeficients exactes confirmats, però és la referència més actual si vols anar més enllà de Minetti.</p>
      `,
      profileTitle: `Perfil de corredor — punts forts i a millorar`,
      profileDesc: `A cada franja de pendent, "<strong>% vs. model</strong>" compara el teu ritme real mitjà amb el que prediu el model a partir del teu propi ritme pla — no et compara amb altres corredors. Un <strong style="color:var(--ochre);">+15%</strong> significa que en aquell pendent vas un 15% més lent del que el teu propi nivell general faria esperar (possible punt feble); un <strong style="color:var(--moss);">-10%</strong> significa que vas un 10% més ràpid de l'esperat (punt fort relatiu).`,
      profileExplainSummary: `Com es calcula això?`,
      profileExplainBody: `
        <p>Els teus trams d'entrenament s'agrupen en 5 franges de pendent. A cadascuna es compara el teu ritme real mitjà amb el que prediu el model de Minetti a partir del teu ritme pla equivalent — és a dir, "el que et tocaria" en aquell pendent si el teu rendiment fos igual d'eficient en tota la gamma de pendents.</p>
        <p>Si en una franja vas més lent del que el model prediu, aquella franja et costa relativament més que al corredor "estàndard" que descriu l'equació — un senyal de marge de millora específic de terreny (tècnica, força, confiança), no necessàriament de forma física general. Si vas més ràpid de l'esperat, és un punt fort relatiu.</p>
        <p>Les franges amb menys d'1 km analitzat es mostren igualment però amb l'avís que hi ha poca dada per fiar-se del número.</p>
      `
    },
    step2: {
      tag: `Pas 2`,
      title: `Puja el track objectiu`,
      desc: `El GPX de la cursa o ruta que vols estimar. No necessita temps, només el traçat amb elevació. Tot es processa al teu navegador.`,
      dropzoneText: `<strong>Arrossega el teu fitxer .gpx aquí</strong> o fes clic per seleccionar-lo`,
      removeBtn: `Treure track objectiu`
    },
    step3: {
      tag: `Pas 3`,
      title: `Estimació`,
      desc: `Ritme i temps estimats aplicant la teva corba d'esforç al perfil del track objectiu.`,
      resultTimeLabel: `Temps estimat`,
      resultPaceLabel: `Ritme mitjà`,
      resultDistLabel: `Distància · D+ · D-`,
      confidenceTitle: `Nivell de confiança de l'estimació`,
      confidenceExplainSummary: `Com es calcula la confiança?`,
      confidenceExplainBody: `
        <p>No és una probabilitat estadística formal, sinó un indicador orientatiu que combina quatre senyals sobre com de fiable és el número de dalt:</p>
        <ul>
          <li><strong>Volum de dades</strong>: quants km d'entrenaments has analitzat. Amb pocs km, el ritme base està mal calibrat.</li>
          <li><strong>Cobertura de pendents</strong>: quina part del track objectiu transcorre per pendents que ja has corregut abans. En trams amb pendents que mai has entrenat, el model extrapola amb la corba de Minetti sense dades reals que la contrastin.</li>
          <li><strong>Ajust del model</strong>: com d'igual és la corba teòrica al teu ritme real observat per pendent (vegeu el gràfic del Pas 1). Si la teva manera de córrer costes s'allunya molt del model estàndard, la confiança baixa.</li>
          <li><strong>Extrapolació de distància</strong>: si la cursa és molt més llarga que la teva tirada més llarga analitzada, l'ajust de fatiga (Riegel) és més especulatiu.</li>
        </ul>
      `,
      calcExplainSummary: `Com es calcula el temps estimat?`,
      calcExplainBody: `
        <p>El track objectiu també es divideix en trams punt a punt. A cada tram se li aplica el teu ritme pla equivalent ajustat pel seu pendent concret (la mateixa equació de Minetti, però ara en sentit invers: <code>ritme_tram = ritme_pla × C(pendent) / C(0)</code>), i se sumen els temps de tots els trams.</p>
        <p>Si la distància del track objectiu supera clarament la teva tirada més llarga analitzada, s'afegeix un petit recàrrec de fatiga (escalat tipus <strong>fórmula de Riegel</strong>, exponent 1.06) sobre el temps total — el raonament és que mantenir el ritme es fa progressivament més difícil com més dura l'esforç, més enllà del que ja recull el model de pendent. Sota la taula s'indica si es va aplicar i amb quin factor.</p>
        <p>El <strong>ritme mitjà</strong> és simplement el temps total dividit per la distància total del track.</p>
      `,
      profileChartTitle: `Perfil d'elevació — color = intensitat estimada`,
      legendFaster: `Més ràpid que el teu ritme base`,
      legendBase: `≈ ritme base`,
      legendSlower: `Més lent (pujada exigent)`,
      colorsExplainSummary: `Què signifiquen els colors?`,
      colorsExplainBody: `
        <p>Cada franja del perfil és un tram del track objectiu, acolorida segons el ritme estimat per a aquell tram comparat amb el teu ritme pla equivalent: verd on el model prediu que aniràs més ràpid que la teva base (baixades suaus, terreny favorable), gris on l'esforç és similar al pla, i taronja/vermell a les pujades més exigents, on el ritme s'alenteix més.</p>
        <p>Passa el ratolí per sobre de qualsevol punt del perfil per veure el pendent, el ritme estimat i el temps acumulat fins a aquell punt exacte.</p>
      `,
      keyPoints: {
        title: `Punts clau del recorregut`,
        desc: `Final de cada pujada i baixada significativa (≥30 m de desnivell), amb el ritme d'aquell tram i el temps estimat de pas per aquell punt.`,
        typeSummit: `Cim`,
        typeValley: `Vall`,
        thPoint: `Punt`,
        thElevation: `Elevació`,
        thLeg: `Desnivell del tram`,
        thPace: `Ritme del tram`,
        thTime: `Temps estimat`,
        legFormat: `{sign}{m}m en {km} km`
      },
      thKm: `Km`,
      thPace: `Ritme`,
      thSegTime: `Temps tram`,
      thElapsed: `Acumulat`,
      thGain: `D+`,
      thGrade: `Pend. mitjana`,
      columnsExplainSummary: `Què significa cada columna?`,
      columnsExplainBody: `
        <ul>
          <li><strong>Km</strong>: marca quilomètrica sobre el track objectiu (no sobre els teus entrenaments).</li>
          <li><strong>Ritme</strong>: ritme estimat mitjà durant aquell quilòmetre concret, ja ajustat al seu desnivell.</li>
          <li><strong>Temps tram</strong>: temps estimat per recórrer només aquell quilòmetre.</li>
          <li><strong>Acumulat</strong>: temps total estimat des de la sortida fins al final d'aquell quilòmetre.</li>
          <li><strong>D+</strong>: desnivell positiu guanyat durant aquell quilòmetre.</li>
          <li><strong>Pend. mitjana</strong>: pendent mitjà d'aquell quilòmetre (desnivell net ÷ distància).</li>
        </ul>
      `,
      disclaimer: `És una estimació fisiològica (model de Minetti, 2002), no una predicció exacta: no té en compte terreny tècnic, nutrició, el clima del dia de la cursa ni el teu estat de forma puntual.`
    },
    misc: {
      allRemoved: `S'han tret tots els entrenaments.`,
      noGpxFiles: `No s'han trobat fitxers .gpx a la selecció.`,
      processing: `Processant {n} fitxer(s)...`,
      noTimestamps: `sense marques de temps — omès`,
      noValidSegments: `sense trams vàlids — omès`,
      fileReadErrorGeneric: `error en llegir el fitxer`,
      insufficientData: `Encara no hi ha dades suficients. Afegeix més entrenaments (amb temps) per calibrar el teu ritme base.`,
      addedSuffix: `{n} afegit(s)`,
      updatedSuffix: `{n} actualitzat(s)`,
      skippedSuffix: `{n} omès(os)`,
      totalSegments: `{n} trams en total.`,
      removeTrainingTitle: `Treure aquest entrenament`,
      trainingRemovedCount: `Entrenament eliminat. {n} trams en total.`,
      targetRemoved: `Track objectiu eliminat.`,
      readingFile: `Llegint {name}...`,
      trackLoaded: `Track carregat: {dist} km, D+{gainUp}m, D-{gainDown}m.`,
      gpxReadError: `No s'ha pogut llegir el GPX: {msg}`,
      riegelApplied: `La distància objectiu ({dist} km) supera la teva tirada més llarga analitzada ({longest} km), així que s'ha aplicat un factor de fatiga addicional de {factor}x (escalat tipus Riegel, exponent 1.06) sobre el temps total.`,
      riegelNotApplied: `La distància objectiu està dins del rang de les teves tirades analitzades, no s'ha aplicat cap correcció de fatiga addicional.`
    },
    errors: {
      cantReadFile: `no s'ha pogut llegir {name}`,
      invalidXml: `fitxer XML no vàlid`,
      notEnoughPoints: `el track no té prou punts`
    },
    chart: {
      gradeAxis: `pendent`,
      tooltipLine1: `<strong>{model}</strong> a un pendent de {grade}<br>`,
      notEnoughGradesFit: `Encara no hi ha prou pendents diferents als teus entrenaments per mesurar l'ajust del model.`,
      fitIntro: `Ajust de cada línia als teus punts verds:`,
      avgDeviation: `desviació mitjana`,
      fitConclusion: `en les teves {n} pendents amb dades suficients, <strong>{better}</strong> s'ajusta millor al teu ritme real.`,
      worked: {
        gradeHeader: `Pendent`,
        costHeader: `C(pendent)`,
        ratioHeader: `C(pendent)/C(0)`,
        paceHeader: `Ritme previst (Minetti)`
      }
    },
    profile: {
      zones: {
        strongDown: { label: `Baixada forta`, range: `< -15%` },
        modDown: { label: `Baixada moderada`, range: `-15% a -5%` },
        flat: { label: `Pla / rodador`, range: `-5% a +5%` },
        modUp: { label: `Pujada moderada`, range: `+5% a +15%` },
        strongUp: { label: `Pujada forta`, range: `> +15%` }
      },
      notEnoughZoneData: `Encara no tens almenys 1 km analitzat en aquesta franja de pendent — puja algun entrenament amb més terreny d'aquest tipus per poder-la avaluar.`,
      advice: {
        strongDown: {
          slowBig: `Vas notablement més lent del que s'esperaria a les baixades més pronunciades — sol ser una barreja de tècnica de trepitjada i confiança més que de forma física. Sèries curtes en pendent tècnic, treball de cadència alta i força excèntrica de quàdriceps ajuden bastant aquí.`,
          slowSmall: `Lleugerament més lent de l'esperat en baixada forta — amb una mica més de pràctica en terreny tècnic hauria d'ajustar-se sol.`,
          fast: `Bon punt fort: a les baixades més exigents rendeixes millor del que prediu el model. Aprofita-ho en cursa per recuperar temps sobre rivals que frenin més.`
        },
        modDown: {
          slow: `Ritme una mica per sota de l'esperat en baixada moderada — normalment millora sol amb més volum de trail i soltesa en el gest.`,
          fast: `Rendeixes millor de l'esperat en baixada moderada — terreny favorable per a tu.`
        },
        flat: {
          slow: `En pla/rodador vas una mica més lent del que el teu propi nivell general suggeriria — pot valer la pena fer una mica de treball de ritme específic en pla (sèries, tempo runs).`,
          fast: `Bona eficiència en pla/rodador respecte al teu nivell general.`
        },
        modUp: {
          slow: `Les pujades moderades et penalitzen més del que s'esperaria — repeticions en costa de 3-6 min a ritme constant solen donar una millora notable aquí.`,
          fast: `Punt fort en pujada moderada — continues rendint per sobre de l'esperat segons el teu model.`
        },
        strongUp: {
          slowBig: `A les pujades més exigents perds bastant més temps de l'esperat — treball específic de força-resistència (sèries curtes molt inclinades, escales, powerhiking amb bastons) sol tenir el retorn més gran de tots aquests punts.`,
          slowSmall: `Una mica per sota de l'esperat en pujada forta, però no és el teu marge de millora més gran.`,
          fast: `Molt bon punt fort: a les pujades més dures rendeixes clarament millor del que s'esperaria.`
        }
      },
      notEnoughVariety: `Encara no hi ha prou varietat de pendents als teus entrenaments per treure conclusions per franja — puja entrenaments amb una mica de desnivell variat (pujades i baixades, no només pla).`,
      summaryWorst: `El teu marge de millora relatiu més gran: <strong style="color:var(--ochre)">{label}</strong> ({pct}% respecte al model). `,
      summaryBest: `El teu punt fort relatiu més gran: <strong style="color:var(--moss)">{label}</strong> ({pct}%).`,
      notEnoughDataShort: `sense dades suficients`,
      vsModel: `{sign}{pct}% vs. model`,
      kmAnalyzed: `{km} km analitzats`,
      realVsModel: ` · ritme real {obs}/km · model {pred}/km`,
      targetPctSuffix: `{pct}% de la teva cursa objectiu passa per aquí`,
      targetWarning: `⚠ El {pct}% de la teva cursa objectiu transcorre per <strong>{label}</strong>, just el teu marge de millora més gran. Val la pena prioritzar aquest tipus d'entrenament en les setmanes prèvies.`,
      tooltip: `{dist} km · pend. {grade}% · ritme {pace}/km · acum. {time}`
    },
    confidence: {
      high: `Alta`, medium: `Mitjana`, low: `Baixa`,
      factorVolume: { name: `Volum de dades`, note: `{km} km analitzats en {n} entrenament(s). Més de ~60 km ben repartits dona una base sòlida.` },
      factorCoverage: { name: `Cobertura de pendents`, note: `{pct}% del track objectiu transcorre per pendents que ja has corregut abans; la resta s'extrapola amb el model teòric.` },
      factorFit: { name: `Ajust del model a la teva manera de córrer`, note: `Desviació mitjana del {mape}% entre la corba de Minetti i el teu ritme real observat per pendent.` },
      factorDistance: {
        name: `Extrapolació de distància`,
        noteApplied: `La cursa és més llarga que la teva tirada més provada, factor de fatiga aplicat: {factor}x.`,
        noteNotApplied: `La distància està dins del que ja has provat en entrenaments.`
      }
    }
  },

  en: {
    app: {
      title: `Ritmo de Sendero`,
      h1: `Grade-adjusted pace estimator`,
      sub: `Calculates your flat-equivalent pace from your recent training runs and applies it to a target track's elevation profile, segment by segment.`
    },
    step1: {
      tag: `Step 1`,
      title: `Upload your training runs`,
      desc: `Drag in several GPX files from your recent runs (the more you add, the better calibrated your base pace will be). They need per-point timestamps — almost any watch or running app includes them on export.`,
      gradeWindowLabel: `Linear window used to compute grade:`,
      gradeWindowOpt5: `5 m`,
      gradeWindowOpt10: `10 m`,
      gradeWindowOpt20: `20 m (default)`,
      gradeWindowOpt50: `50 m`,
      gradeWindowOpt100: `100 m`,
      gradeWindowFootnote: `Each segment's grade is computed by comparing elevation at the start and end of a window of this length along the track (not between every two consecutive GPS points, which are usually just 1-5 m apart). Shorter windows give more detail but are more sensitive to altimeter noise; longer windows smooth that noise but blur short grade changes (e.g. a 10 m ramp inside a 50 m window can get diluted).`,
      dropzoneText: `<strong>Drag your .gpx files here</strong> or click to select them (you can pick several at once)`,
      hint: `How to export GPX with timestamps: on Strava, open the activity → "···" menu → Export GPX. Garmin Connect, Coros, Suunto and the COROS App all have an equivalent option on each activity.`,
      clearBtn: `Clear all training runs`,
      statBaseline: `Flat-equivalent pace`,
      statRuns: `Runs analyzed`,
      statDist: `Distance analyzed`,
      statLongest: `Longest run`,
      chartTitle: `Your effort curve — real pace vs. grade`,
      binLabel: `Bin width for the chart (% grade):`,
      binOpt1: `1%`,
      binOpt2: `2% (default)`,
      binOpt3: `3%`,
      binOpt5: `5%`,
      chartDesc: `Each <strong style="color:var(--moss);">green dot</strong> is your median real pace on training segments with roughly that grade — the bigger the dot, the more segments share that grade (more reliable). The horizontal axis is <strong>grade</strong> (negative = downhill, positive = uphill); the vertical axis is your <strong>pace</strong> in min/km, and runs opposite to intuition: lower on the chart = faster. The two lines aren't your data — they're what each theoretical model predicts for every grade from your average flat pace — the closer they pass to your green dots, the better that model describes how you actually run.`,
      legendObserved: `Observed pace per segment (median per grade bin)`,
      legendMinetti: `Minetti (2002) — model used for the estimate`,
      legendAcsm: `ACSM — alternative reference model`,
      hoverHint: `💡 Hover over any point on the orange or bluish lines to see the exact calculation behind the predicted pace at that grade.`,
      explainSummary: `Where does your flat-equivalent pace come from, and how good is the fit?`,
      explainBody: `
        <p><strong>How the chart is built, step by step:</strong></p>
        <p>Each run is split into thousands of very short segments (GPS point to GPS point). For each segment, the <strong>grade</strong> (elevation change ÷ distance) and the <strong>real pace</strong> you were holding at that moment are computed. All segments are then grouped into grade "bins" (2% wide by default: -2% to 0%, 0% to 2%, 2% to 4%, etc.) and within each bin the <strong>median</strong> pace is taken — that's each green dot on the chart. Only bins with at least 3 segments are drawn, to avoid plotting unreliable points based on one or two stray data points.</p>
        <p>That bin width ("bin size", in % grade) is configurable with the selector above the chart. It's a trade-off: a <strong>narrow</strong> bin (1%) gives more resolution and picks up finer pace changes between similar grades, but has fewer segments inside and the resulting point is noisier (and some bins may fall short of the 3-segment minimum and not get drawn). A <strong>wide</strong> bin (5%) gives more stable points because it averages more data, but mixes grades that can be quite different from each other. 2% is usually a good starting point unless you have very little or a huge amount of data.</p>
        <p><strong>Note this is different from the "linear window" in Step 1:</strong> this bin only groups already-computed points to draw the chart and measure the fit (in % grade). Step 1's linear window (in meters) sits earlier in the chain: it decides how each individual grade is computed from the raw GPX, by comparing elevation at the start and end of a segment of that length on the ground — it's the one that answers "are you computing grade between every two GPX points, or over a longer distance?". Changing the linear window changes which segments exist; changing this bin only changes how they're grouped for the chart.</p>
        <p>Running uphill or downhill doesn't cost the same energy as flat ground at the same pace. To "translate" each segment to its flat equivalent, this app uses the metabolic cost equation from <strong>Minetti et al. (2002)</strong>, the most-cited reference model in running biomechanics and the one that best captures the extra braking cost on steep downhills:</p>
        <p><code>C(i) = 155.4·i⁵ − 30.4·i⁴ − 43.3·i³ + 46.3·i² + 19.5·i + 3.6</code></p>
        <p>With that cost curve, each segment's real pace is rescaled to "what that same effort would cost on flat ground": <code>flat_pace = real_pace × C(0) / C(grade)</code>. Your final <strong>flat-equivalent pace</strong> is the average of all those segments, weighted by each one's distance — so long runs count more than a short recovery jog. That's the number you see right at the top, under "Flat-equivalent pace", and it's the starting point (0% grade) that the chart's two lines are drawn from: they're plotted by applying each model's <code>C(grade)/C(0)</code> to that base pace, for every grade value between -30% and +30%.</p>
        <p><strong>Where exactly each point on the orange line comes from:</strong> for any grade, <code>C(grade)</code> is computed with Minetti's formula, divided by <code>C(0)=3.6</code> (the flat-ground cost) to get a ratio, and that ratio multiplies your flat-equivalent pace. With your current data, here's how it works out for a few example grades:</p>
        <div id="gapWorkedExample"></div>
        <p style="margin-top:10px;">That's why the curve isn't a straight line: <code>C(i)</code> is a 5th-degree polynomial, so it grows faster at very steep grades (climbing or descending a very steep segment costs disproportionately more than a gentle one), and its minimum sits slightly below 0% — a gentle downhill tends to cost a bit less energy than flat ground, according to the model.</p>
        <p><strong>How well does each model fit?</strong> Below the chart, two metrics per model are shown, comparing each line against your own green dots:</p>
        <ul>
          <li><strong>Mean deviation</strong>: the average % error between what the model predicts and your observed real pace, bin by bin. An 8% figure means the model is off, on average, by 8 out of every 100 seconds of your real pace at that grade.</li>
          <li><strong>R²</strong>: ranges from 0 to 1 (can occasionally come out negative). It shows what share of the pace differences between grades the model explains. An R² of 0.85 is a good fit; near 0 or negative means the model isn't describing well how your pace changes with grade in your specific case.</li>
        </ul>
        <p><strong>Alternative reference model — ACSM:</strong> alongside Minetti, the American College of Sports Medicine equation is drawn (<code>VO₂ = 0.2·v + 0.9·v·grade + 3.5</code>), widely used in exercise physiology for its simplicity. It's linear, so it doesn't capture the extra braking cost on steep downhills, and several studies (e.g. Fikes et al., 1999) have found it overestimates real running cost — it's shown only as a comparison reference, it isn't used to compute your estimate.</p>
        <p><strong>For those who want to go deeper:</strong> a recent study (Looney, Hoogkamer &amp; Kram, <em>European Journal of Applied Physiology</em>, 2026) updates and compares several models — including Minetti and ACSM — against a much larger dataset, and proposes the RE3/HTK equations as a further improvement, especially downhill. They aren't implemented here since their exact coefficients aren't confirmed, but it's the most current reference if you want to go beyond Minetti.</p>
      `,
      profileTitle: `Runner profile — strengths and areas to improve`,
      profileDesc: `In each grade band, "<strong>% vs. model</strong>" compares your average real pace with what the model predicts from your own flat pace — it doesn't compare you to other runners. A <strong style="color:var(--ochre);">+15%</strong> means that on that grade you're running 15% slower than your own overall level would suggest (a possible weak spot); a <strong style="color:var(--moss);">-10%</strong> means you're 10% faster than expected (a relative strength).`,
      profileExplainSummary: `How is this calculated?`,
      profileExplainBody: `
        <p>Your training segments are grouped into 5 grade bands. In each one, your average real pace is compared with what the Minetti model predicts from your flat-equivalent pace — in other words, "what you'd expect" on that grade if your performance were equally efficient across the whole range of grades.</p>
        <p>If you're slower than the model predicts on a given band, that band costs you relatively more than it would the "standard" runner the equation describes — a sign of terrain-specific room for improvement (technique, strength, confidence), not necessarily overall fitness. If you're faster than expected, that's a relative strength.</p>
        <p>Bands with less than 1 km analyzed are still shown, but flagged as having too little data to trust the number.</p>
      `
    },
    step2: {
      tag: `Step 2`,
      title: `Upload the target track`,
      desc: `The GPX of the race or route you want to estimate. It doesn't need timestamps, just the track with elevation. Everything is processed in your browser.`,
      dropzoneText: `<strong>Drag your .gpx file here</strong> or click to select it`,
      removeBtn: `Remove target track`
    },
    step3: {
      tag: `Step 3`,
      title: `Estimate`,
      desc: `Estimated pace and time by applying your effort curve to the target track's elevation profile.`,
      resultTimeLabel: `Estimated time`,
      resultPaceLabel: `Average pace`,
      resultDistLabel: `Distance · D+ · D-`,
      confidenceTitle: `Estimate confidence level`,
      confidenceExplainSummary: `How is confidence calculated?`,
      confidenceExplainBody: `
        <p>It's not a formal statistical probability, but a rough indicator combining four signals about how much you can trust the number above:</p>
        <ul>
          <li><strong>Data volume</strong>: how many km of training you've analyzed. With few km, the base pace is poorly calibrated.</li>
          <li><strong>Grade coverage</strong>: how much of the target track runs over grades you've already run before. On segments with grades you've never trained, the model extrapolates using the Minetti curve with no real data to check it against.</li>
          <li><strong>Model fit</strong>: how closely the theoretical curve matches your observed real pace by grade (see the Step 1 chart). If the way you handle climbs and descents diverges a lot from the standard model, confidence drops.</li>
          <li><strong>Distance extrapolation</strong>: if the race is much longer than your longest analyzed run, the fatigue adjustment (Riegel) becomes more speculative.</li>
        </ul>
      `,
      calcExplainSummary: `How is the estimated time calculated?`,
      calcExplainBody: `
        <p>The target track is also split into point-to-point segments. Each segment gets your flat-equivalent pace adjusted for its specific grade (the same Minetti equation, but now run in reverse: <code>segment_pace = flat_pace × C(grade) / C(0)</code>), and the times for every segment are added up.</p>
        <p>If the target track's distance clearly exceeds your longest analyzed run, a small fatigue surcharge is added (<strong>Riegel-style scaling</strong>, exponent 1.06) on top of the total time — the reasoning being that holding pace gets progressively harder the longer the effort lasts, beyond what the grade model already accounts for. Below the table it's noted whether this was applied and with what factor.</p>
        <p>The <strong>average pace</strong> is simply the total time divided by the track's total distance.</p>
      `,
      profileChartTitle: `Elevation profile — color = estimated intensity`,
      legendFaster: `Faster than your base pace`,
      legendBase: `≈ base pace`,
      legendSlower: `Slower (demanding climb)`,
      colorsExplainSummary: `What do the colors mean?`,
      colorsExplainBody: `
        <p>Each band on the profile is a segment of the target track, colored according to that segment's estimated pace compared to your flat-equivalent pace: green where the model predicts you'll go faster than your base pace (gentle downhills, favorable terrain), gray where the effort is similar to flat ground, and orange/red on the most demanding climbs, where pace slows down the most.</p>
        <p>Hover over any point on the profile to see the grade, estimated pace, and elapsed time up to that exact point.</p>
      `,
      keyPoints: {
        title: `Key points on the route`,
        desc: `The end of each significant climb and descent (≥30 m of elevation change), with that segment's pace and the estimated time you'd pass through that point.`,
        typeSummit: `Summit`,
        typeValley: `Valley`,
        thPoint: `Point`,
        thElevation: `Elevation`,
        thLeg: `Segment elevation change`,
        thPace: `Segment pace`,
        thTime: `Estimated time`,
        legFormat: `{sign}{m}m over {km} km`
      },
      thKm: `Km`,
      thPace: `Pace`,
      thSegTime: `Segment time`,
      thElapsed: `Elapsed`,
      thGain: `D+`,
      thGrade: `Avg. grade`,
      columnsExplainSummary: `What does each column mean?`,
      columnsExplainBody: `
        <ul>
          <li><strong>Km</strong>: kilometer mark on the target track (not on your training runs).</li>
          <li><strong>Pace</strong>: average estimated pace during that specific kilometer, already adjusted for its elevation change.</li>
          <li><strong>Segment time</strong>: estimated time to cover just that kilometer.</li>
          <li><strong>Elapsed</strong>: total estimated time from the start to the end of that kilometer.</li>
          <li><strong>D+</strong>: elevation gain during that kilometer.</li>
          <li><strong>Avg. grade</strong>: average grade for that kilometer (net elevation change ÷ distance).</li>
        </ul>
      `,
      disclaimer: `This is a physiological estimate (Minetti, 2002 model), not an exact prediction: it doesn't account for technical terrain, nutrition, race-day weather, or your current form.`
    },
    misc: {
      allRemoved: `All training runs removed.`,
      noGpxFiles: `No .gpx files found in the selection.`,
      processing: `Processing {n} file(s)...`,
      noTimestamps: `no timestamps — skipped`,
      noValidSegments: `no valid segments — skipped`,
      fileReadErrorGeneric: `error reading the file`,
      insufficientData: `Not enough data yet. Add more training runs (with timestamps) to calibrate your base pace.`,
      addedSuffix: `{n} added`,
      updatedSuffix: `{n} updated`,
      skippedSuffix: `{n} skipped`,
      totalSegments: `{n} segments in total.`,
      removeTrainingTitle: `Remove this run`,
      trainingRemovedCount: `Run removed. {n} segments in total.`,
      targetRemoved: `Target track removed.`,
      readingFile: `Reading {name}...`,
      trackLoaded: `Track loaded: {dist} km, D+{gainUp}m, D-{gainDown}m.`,
      gpxReadError: `Couldn't read the GPX: {msg}`,
      riegelApplied: `The target distance ({dist} km) exceeds your longest analyzed run ({longest} km), so an extra fatigue factor of {factor}x was applied (Riegel-style scaling, exponent 1.06) to the total time.`,
      riegelNotApplied: `The target distance is within the range of your analyzed runs, so no extra fatigue correction was applied.`
    },
    errors: {
      cantReadFile: `couldn't read {name}`,
      invalidXml: `invalid XML file`,
      notEnoughPoints: `the track doesn't have enough points`
    },
    chart: {
      gradeAxis: `grade`,
      tooltipLine1: `<strong>{model}</strong> at {grade} grade<br>`,
      notEnoughGradesFit: `There aren't enough distinct grades in your training yet to measure the model's fit.`,
      fitIntro: `Fit of each line to your green dots:`,
      avgDeviation: `mean deviation`,
      fitConclusion: `across your {n} grades with enough data, <strong>{better}</strong> fits your real pace best.`,
      worked: {
        gradeHeader: `Grade`,
        costHeader: `C(grade)`,
        ratioHeader: `C(grade)/C(0)`,
        paceHeader: `Predicted pace (Minetti)`
      }
    },
    profile: {
      zones: {
        strongDown: { label: `Steep downhill`, range: `< -15%` },
        modDown: { label: `Moderate downhill`, range: `-15% to -5%` },
        flat: { label: `Flat / rolling`, range: `-5% to +5%` },
        modUp: { label: `Moderate uphill`, range: `+5% to +15%` },
        strongUp: { label: `Steep uphill`, range: `> +15%` }
      },
      notEnoughZoneData: `You don't have at least 1 km analyzed in this grade band yet — upload a run with more terrain like this to evaluate it.`,
      advice: {
        strongDown: {
          slowBig: `You're noticeably slower than expected on the steepest downhills — usually a mix of foot-strike technique and confidence rather than fitness. Short reps on technical grades, high-cadence work, and eccentric quad strength training help a lot here.`,
          slowSmall: `Slightly slower than expected on steep downhills — with a bit more practice on technical terrain this should sort itself out.`,
          fast: `A real strength: on the most demanding downhills you outperform what the model predicts. Use it in races to make up time on rivals who brake more.`
        },
        modDown: {
          slow: `Pace somewhat below expectations on moderate downhills — this usually improves on its own with more trail volume and a looser running gesture.`,
          fast: `You perform better than expected on moderate downhills — favorable terrain for you.`
        },
        flat: {
          slow: `On flat/rolling terrain you're somewhat slower than your overall level would suggest — some flat-specific pace work (intervals, tempo runs) could be worth it.`,
          fast: `Good efficiency on flat/rolling terrain relative to your overall level.`
        },
        modUp: {
          slow: `Moderate climbs cost you more than expected — 3-6 minute hill repeats at a steady pace usually bring a noticeable improvement here.`,
          fast: `A strength on moderate climbs — you keep performing above what your model expects.`
        },
        strongUp: {
          slowBig: `On the most demanding climbs you lose considerably more time than expected — specific strength-endurance work (short very steep reps, stairs, powerhiking with poles) usually has the biggest payoff of all these points.`,
          slowSmall: `Somewhat below expectations on steep climbs, but not your biggest area for improvement.`,
          fast: `A very strong point: on the toughest climbs you clearly outperform expectations.`
        }
      },
      notEnoughVariety: `There isn't enough variety of grades in your training yet to draw conclusions per band — upload runs with some varied elevation (climbs and descents, not just flat).`,
      summaryWorst: `Your biggest relative room for improvement: <strong style="color:var(--ochre)">{label}</strong> ({pct}% vs. the model). `,
      summaryBest: `Your biggest relative strength: <strong style="color:var(--moss)">{label}</strong> ({pct}%).`,
      notEnoughDataShort: `not enough data`,
      vsModel: `{sign}{pct}% vs. model`,
      kmAnalyzed: `{km} km analyzed`,
      realVsModel: ` · real pace {obs}/km · model {pred}/km`,
      targetPctSuffix: `{pct}% of your target race goes through here`,
      targetWarning: `⚠ {pct}% of your target race runs through <strong>{label}</strong>, exactly your biggest room for improvement. It's worth prioritizing that kind of training in the weeks before.`,
      tooltip: `{dist} km · grade {grade}% · pace {pace}/km · elapsed {time}`
    },
    confidence: {
      high: `High`, medium: `Medium`, low: `Low`,
      factorVolume: { name: `Data volume`, note: `{km} km analyzed across {n} run(s). More than ~60 km well spread out gives a solid base.` },
      factorCoverage: { name: `Grade coverage`, note: `{pct}% of the target track runs over grades you've already run before; the rest is extrapolated with the theoretical model.` },
      factorFit: { name: `Model fit to your running style`, note: `Mean deviation of {mape}% between the Minetti curve and your observed real pace by grade.` },
      factorDistance: {
        name: `Distance extrapolation`,
        noteApplied: `The race is longer than your most-tested run, fatigue factor applied: {factor}x.`,
        noteNotApplied: `The distance is within what you've already tested in training.`
      }
    }
  }
};

function detectInitialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) return saved;
  } catch (e) { /* localStorage unavailable */ }
  const nav = (navigator.language || 'es').toLowerCase();
  if (nav.startsWith('ca')) return 'ca';
  if (nav.startsWith('en')) return 'en';
  return 'es';
}

let currentLang = detectInitialLang();

export function getLang() { return currentLang; }

export function setLang(lang) {
  if (!translations[lang] || lang === currentLang) return false;
  currentLang = lang;
  try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
  document.documentElement.lang = lang;
  return true;
}

function resolve(path) {
  return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), translations[currentLang]);
}

export function t(path, vars) {
  let str = resolve(path);
  if (str === undefined) return path;
  if (vars) {
    for (const k of Object.keys(vars)) str = str.split('{' + k + '}').join(vars[k]);
  }
  return str;
}

// Applies every element with a data-i18n="path" attribute found under `root`.
export function applyStaticTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.innerHTML = t(el.getAttribute('data-i18n'));
  });
  document.documentElement.lang = currentLang;
}
