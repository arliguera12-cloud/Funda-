export interface Profile {
  what: string;
  useCase: string;
  risk: string;
  facts: [string, string][];
}

// Fichas educativas por activo (misma clave que el catálogo en src/lib/assets.ts)
export const PROFILES: Record<string, Profile> = {
  bitcoin: {
    what: 'La primera criptomoneda, creada en 2009 por el anónimo Satoshi Nakamoto. Solo existirán 21 millones de bitcoins, lo que la hace escasa como el oro.',
    useCase: 'Reserva de valor a largo plazo y pagos entre personas sin intermediarios.',
    risk: 'Medio dentro de cripto: es la más establecida, pero aún puede caer más de 50 % en mercados bajistas.',
    facts: [['Lanzamiento', '2009'], ['Oferta máxima', '21 millones'], ['Consenso', 'Proof of Work (minería)'], ['Tiempo por bloque', '~10 minutos']],
  },
  ethereum: {
    what: 'Blockchain programable creada en 2015 por Vitalik Buterin. Permite ejecutar contratos inteligentes y aplicaciones descentralizadas.',
    useCase: 'Base de DeFi, NFTs, stablecoins y miles de tokens. ETH paga las comisiones (gas) de la red.',
    risk: 'Medio-alto: depende de la adopción de su ecosistema y compite con otras redes más rápidas.',
    facts: [['Lanzamiento', '2015'], ['Oferta máxima', 'Sin límite fijo'], ['Consenso', 'Proof of Stake'], ['Tiempo por bloque', '~12 segundos']],
  },
  ripple: {
    what: 'Criptomoneda del XRP Ledger, impulsada por la empresa Ripple para mover dinero entre países en segundos y con comisiones mínimas.',
    useCase: 'Transferencias y remesas internacionales entre instituciones financieras.',
    risk: 'Alto: muy sensible a noticias regulatorias y a decisiones de la empresa Ripple.',
    facts: [['Lanzamiento', '2012'], ['Oferta máxima', '100.000 millones'], ['Consenso', 'Protocolo propio del XRPL'], ['Confirmación', '3–5 segundos']],
  },
  binancecoin: {
    what: 'Token creado por el exchange Binance en 2017. Hoy es la moneda de la BNB Chain, una red con comisiones bajas.',
    useCase: 'Pagar comisiones con descuento en Binance y usar aplicaciones de la BNB Chain.',
    risk: 'Alto: su valor depende en gran parte de la salud y la regulación de una sola empresa.',
    facts: [['Lanzamiento', '2017'], ['Oferta máxima', '200 millones (con quemas periódicas)'], ['Consenso', 'Proof of Staked Authority'], ['Tiempo por bloque', '~1–3 segundos']],
  },
  solana: {
    what: 'Blockchain lanzada en 2020 enfocada en procesar miles de transacciones por segundo con comisiones de centavos.',
    useCase: 'Pagos, DeFi, NFTs y aplicaciones que necesitan rapidez.',
    risk: 'Alto: más joven y volátil; ha tenido interrupciones de red en el pasado.',
    facts: [['Lanzamiento', '2020'], ['Oferta máxima', 'Sin límite fijo'], ['Consenso', 'Proof of Stake + Proof of History'], ['Tiempo por bloque', '~0,4 segundos']],
  },
  spy: {
    what: 'Un ETF (fondo que cotiza en bolsa) que replica al S&P 500: las 500 mayores empresas de Estados Unidos. Con una sola compra tienes un pedacito de todas.',
    useCase: 'La forma más simple de invertir en la economía estadounidense y diversificar entre sectores.',
    risk: 'Medio-alto: sube con el tiempo, pero en una crisis puede caer más de 30 %. Pensado para plazos largos.',
    facts: [['Qué sigue', 'S&P 500'], ['Tipo', 'ETF de acciones'], ['Lanzamiento', '1993 (primer ETF de EE. UU.)'], ['Gestora', 'State Street (SPDR)']],
  },
  qqq: {
    what: 'ETF que replica al Nasdaq-100: las 100 mayores empresas no financieras que cotizan en el Nasdaq, con mucho peso de tecnología.',
    useCase: 'Apostar por el crecimiento de las grandes tecnológicas, sabiendo que está menos diversificado que el S&P 500.',
    risk: 'Alto: concentra pocas empresas y un solo sector, así que sube más en las buenas épocas y cae más en las malas.',
    facts: [['Qué sigue', 'Nasdaq-100'], ['Tipo', 'ETF de acciones'], ['Lanzamiento', '1999'], ['Gestora', 'Invesco']],
  },
  tlt: {
    what: 'ETF de bonos del Tesoro de Estados Unidos a más de 20 años. Un bono es un préstamo que le haces al gobierno a cambio de intereses.',
    useCase: 'Aportar estabilidad a una cartera y generar ingresos por intereses. Suele moverse distinto que las acciones.',
    risk: 'Medio: si las tasas de interés suben, su precio baja (en 2022 cayó más de 25 %). Cuanto más largo el bono, más sensible.',
    facts: [['Qué sigue', 'Bonos del Tesoro a 20+ años'], ['Tipo', 'ETF de bonos'], ['Lanzamiento', '2002'], ['Gestora', 'iShares (BlackRock)']],
  },
  gld: {
    what: 'ETF respaldado por oro físico: cada acción representa una fracción de oro guardado en bóvedas, sin que tengas que custodiarlo.',
    useCase: 'Refugio en épocas de incertidumbre y protección parcial contra la inflación.',
    risk: 'Medio: el oro no paga intereses ni dividendos y su precio puede estancarse durante años.',
    facts: [['Qué sigue', 'Precio del oro'], ['Tipo', 'ETF de materia prima'], ['Lanzamiento', '2004'], ['Gestora', 'State Street (SPDR)']],
  },
  eur: {
    what: 'La moneda compartida por gran parte de la Unión Europea. Es la segunda divisa más usada del mundo después del dólar.',
    useCase: 'Pagar, viajar o ahorrar en Europa; y medir cuánto vale tu dólar frente a esa economía.',
    risk: 'Bajo para el día a día. Si el euro sube frente al dólar, tu dólar compra menos euros.',
    facts: [['Referencia', 'Banco Central Europeo'], ['Actualización', 'Cada día hábil'], ['Cómo leerlo', '1 USD = X EUR']],
  },
  mxn: {
    what: 'El peso mexicano, una de las monedas emergentes más negociadas. Muy usado en remesas y comercio con Estados Unidos.',
    useCase: 'Enviar dinero, comprar o viajar a México; medir cuánto rinde tu dólar allá.',
    risk: 'Medio: se mueve más que el euro y reacciona a noticias de comercio y tasas de interés.',
    facts: [['Referencia', 'Banco Central Europeo'], ['Actualización', 'Cada día hábil'], ['Cómo leerlo', '1 USD = X MXN']],
  },
  brl: {
    what: 'El real brasileño, la moneda de la mayor economía de Latinoamérica.',
    useCase: 'Comercio, viajes y remesas relacionados con Brasil.',
    risk: 'Medio-alto: es volátil y sensible a la política y a los precios de las materias primas.',
    facts: [['Referencia', 'Banco Central Europeo'], ['Actualización', 'Cada día hábil'], ['Cómo leerlo', '1 USD = X BRL']],
  },
  gbp: {
    what: 'La libra esterlina del Reino Unido, una de las monedas más antiguas todavía en uso.',
    useCase: 'Pagos y viajes en el Reino Unido; referencia de una gran economía financiera.',
    risk: 'Bajo-medio: se mueve con las tasas del Banco de Inglaterra y con las noticias políticas.',
    facts: [['Referencia', 'Banco Central Europeo'], ['Actualización', 'Cada día hábil'], ['Cómo leerlo', '1 USD = X GBP']],
  },
  jpy: {
    what: 'El yen japonés, considerado una moneda refugio: suele fortalecerse cuando hay miedo en los mercados.',
    useCase: 'Viajes y comercio con Japón; indicador del apetito por riesgo en el mundo.',
    risk: 'Medio: depende mucho de las tasas de interés bajas del Banco de Japón frente a las del resto.',
    facts: [['Referencia', 'Banco Central Europeo'], ['Actualización', 'Cada día hábil'], ['Cómo leerlo', '1 USD = X JPY']],
  },
};
