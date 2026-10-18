export interface CoinProfile {
  id: string;
  name: string;
  symbol: string;
  tagline: string;
  what: string;
  useCase: string;
  facts: [string, string][];
  risk: string;
}

export const COIN_PROFILES: CoinProfile[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    tagline: 'El oro digital',
    what: 'La primera criptomoneda, creada en 2009 por el anónimo Satoshi Nakamoto. Solo existirán 21 millones de bitcoins, lo que la hace escasa como el oro.',
    useCase: 'Reserva de valor a largo plazo y pagos entre personas sin intermediarios.',
    facts: [
      ['Lanzamiento', '2009'],
      ['Oferta máxima', '21 millones'],
      ['Consenso', 'Proof of Work (minería)'],
      ['Tiempo por bloque', '~10 minutos'],
    ],
    risk: 'Medio dentro de cripto: es la más establecida, pero aún puede caer más de 50% en mercados bajistas.',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    tagline: 'La computadora mundial',
    what: 'Blockchain programable creada en 2015 por Vitalik Buterin. Permite ejecutar contratos inteligentes y aplicaciones descentralizadas.',
    useCase: 'Base de DeFi, NFTs, stablecoins y miles de tokens. ETH paga las comisiones (gas) de la red.',
    facts: [
      ['Lanzamiento', '2015'],
      ['Oferta máxima', 'Sin límite fijo'],
      ['Consenso', 'Proof of Stake'],
      ['Tiempo por bloque', '~12 segundos'],
    ],
    risk: 'Medio-alto: depende de la adopción de su ecosistema y compite con otras redes más rápidas.',
  },
  {
    id: 'ripple',
    name: 'XRP',
    symbol: 'XRP',
    tagline: 'Pagos internacionales rápidos',
    what: 'Criptomoneda del XRP Ledger, impulsada por la empresa Ripple para mover dinero entre países en segundos y con comisiones mínimas.',
    useCase: 'Transferencias y remesas internacionales entre instituciones financieras.',
    facts: [
      ['Lanzamiento', '2012'],
      ['Oferta máxima', '100.000 millones'],
      ['Consenso', 'Protocolo de consenso XRPL'],
      ['Tiempo de confirmación', '3–5 segundos'],
    ],
    risk: 'Alto: muy sensible a noticias regulatorias y a decisiones de la empresa Ripple.',
  },
  {
    id: 'binancecoin',
    name: 'BNB',
    symbol: 'BNB',
    tagline: 'El motor del ecosistema Binance',
    what: 'Token creado por el exchange Binance en 2017. Hoy es la moneda de la BNB Chain, una red con comisiones bajas.',
    useCase: 'Pagar comisiones con descuento en Binance y usar aplicaciones de la BNB Chain.',
    facts: [
      ['Lanzamiento', '2017'],
      ['Oferta máxima', '200 millones (con quemas periódicas)'],
      ['Consenso', 'Proof of Staked Authority'],
      ['Tiempo por bloque', '~1–3 segundos'],
    ],
    risk: 'Alto: su valor depende en gran parte de la salud y regulación de una sola empresa.',
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    tagline: 'Velocidad y bajo costo',
    what: 'Blockchain lanzada en 2020 enfocada en procesar miles de transacciones por segundo con comisiones de centavos.',
    useCase: 'Pagos, DeFi, NFTs y aplicaciones que necesitan rapidez.',
    facts: [
      ['Lanzamiento', '2020'],
      ['Oferta máxima', 'Sin límite fijo (inflación decreciente)'],
      ['Consenso', 'Proof of Stake + Proof of History'],
      ['Tiempo por bloque', '~0,4 segundos'],
    ],
    risk: 'Alto: más joven y volátil; ha tenido interrupciones de red en el pasado.',
  },
  {
    id: 'tether',
    name: 'Tether',
    symbol: 'USDT',
    tagline: 'El dólar digital',
    what: 'La stablecoin más usada: cada USDT busca valer siempre 1 dólar, respaldado por reservas de la empresa Tether.',
    useCase: 'Proteger valor frente a la volatilidad, ahorrar en dólares y mover dinero entre exchanges.',
    facts: [
      ['Lanzamiento', '2014'],
      ['Valor objetivo', '1 USD'],
      ['Redes', 'Ethereum, Tron, Solana y más'],
      ['Emisor', 'Tether Limited'],
    ],
    risk: 'Bajo en precio, pero depende de la confianza en las reservas del emisor.',
  },
];

export interface Guide {
  id: string;
  title: string;
  summary: string;
  steps: string[];
  tip: string;
}

export const GUIDES: Guide[] = [
  {
    id: 'primera-compra',
    title: 'Cómo comprar tu primera cripto',
    summary: 'De cero a tu primera compra en un exchange, paso a paso.',
    steps: [
      'Elige un exchange reconocido y disponible en tu país (mira la sección Billeteras y exchanges).',
      'Crea tu cuenta desde la URL oficial y completa la verificación de identidad (KYC).',
      'Activa el doble factor (2FA) con una app autenticadora antes de depositar.',
      'Deposita dinero (transferencia, tarjeta o P2P). Empieza con un monto pequeño.',
      'Compra la cripto elegida. Para empezar, una orden "de mercado" es la más simple.',
      'Considera la estrategia DCA: repite compras pequeñas cada semana o mes.',
    ],
    tip: 'Invierte solo dinero que no necesites en los próximos años.',
  },
  {
    id: 'recibir',
    title: 'Cómo recibir cripto',
    summary: 'Qué compartir, qué red elegir y cómo no perder fondos.',
    steps: [
      'Abre tu billetera o exchange y busca la opción "Recibir" o "Depositar".',
      'Elige la criptomoneda y la RED (por ejemplo, USDT en Tron/TRC-20 o en Ethereum/ERC-20).',
      'Copia tu dirección o muestra el código QR y compártelo con quien te enviará.',
      'Confirma con el remitente que use exactamente la misma red.',
      'Para montos grandes, haz primero un envío de prueba pequeño.',
      'Espera las confirmaciones de la red; verás el saldo en minutos.',
    ],
    tip: 'Tu dirección es pública y se puede compartir. Tu frase semilla, NUNCA.',
  },
  {
    id: 'proteger',
    title: 'Cómo proteger tu billetera',
    summary: 'Hábitos de seguridad que evitan el 90% de los robos.',
    steps: [
      'Escribe tu frase semilla en papel y guárdala en un lugar seguro. Nada de capturas ni notas en la nube.',
      'Usa contraseñas únicas y un gestor de contraseñas.',
      'Activa 2FA con app autenticadora, no por SMS.',
      'Para ahorros grandes, usa una billetera fría (hardware wallet).',
      'Guarda en favoritos las URLs oficiales y entra siempre desde ahí.',
      'Revisa y revoca permisos de aplicaciones DeFi que ya no uses.',
    ],
    tip: 'Ningún soporte técnico real te pedirá tu frase semilla o tus claves.',
  },
  {
    id: 'estafas',
    title: 'Cómo detectar estafas',
    summary: 'Las banderas rojas más comunes en cripto.',
    steps: [
      'Promesas de ganancias fijas o "garantizadas" (por ejemplo, 2% diario).',
      'Presión para invertir rápido: "solo hoy", "últimos cupos".',
      'Te piden la frase semilla, claves o pagar para "liberar" fondos.',
      'Perfiles que te escriben primero por redes o WhatsApp ofreciendo "ayuda".',
      'Tokens nuevos sin equipo visible, sin auditoría y con promesas de x100.',
      'URLs casi iguales a las oficiales o apps fuera de las tiendas oficiales.',
    ],
    tip: 'Si suena demasiado bueno para ser verdad, es porque no lo es.',
  },
];
