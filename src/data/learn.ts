export type GuideGroup = 'Ruta de inicio' | 'Seguridad' | 'Cripto';

export interface Guide {
  id: string;
  group: GuideGroup;
  title: string;
  summary: string;
  steps: string[];
  tip: string;
}

export const GUIDE_GROUPS: { name: GuideGroup; blurb: string }[] = [
  { name: 'Ruta de inicio', blurb: 'Cinco guías cortas, en este orden. Sirven para cualquier inversión.' },
  { name: 'Seguridad', blurb: 'Lo que evita la mayoría de los fraudes y los robos.' },
  { name: 'Cripto', blurb: 'Pasos concretos para comprar, recibir y guardar criptomonedas.' },
];

export const GUIDES: Guide[] = [
  {
    id: 'que-es-invertir',
    group: 'Ruta de inicio',
    title: 'Qué es invertir (y qué no)',
    summary: 'La diferencia entre ahorrar, invertir y apostar.',
    steps: [
      'Ahorrar es guardar dinero con poco riesgo; invertir es ponerlo a trabajar aceptando que su valor puede subir o bajar.',
      'Riesgo y rendimiento van de la mano: nadie puede ofrecerte mucho rendimiento sin mucho riesgo.',
      'Una inversión no es una apuesta si entiendes en qué estás, por qué podría ganar valor y cuánto podrías perder.',
      'Define para qué es el dinero (casa, estudios, retiro) y cuándo lo necesitas. Ese plazo decide dónde ponerlo.',
      'Invierte solo lo que no necesitarás pronto: si lo vas a usar en menos de 2 años, mejor ahorrarlo.',
      'Desconfía de cualquier "ganancia garantizada": no existe.',
    ],
    tip: 'Primero el objetivo y el plazo; después el instrumento.',
  },
  {
    id: 'antes-de-invertir',
    group: 'Ruta de inicio',
    title: 'Antes de invertir: tu base',
    summary: 'Lo que conviene tener resuelto antes de poner un dólar en el mercado.',
    steps: [
      'Arma un fondo de emergencia de 3 a 6 meses de gastos, en una cuenta donde puedas sacarlo rápido.',
      'Paga primero las deudas caras (tarjetas, préstamos de consumo): ninguna inversión rinde de forma segura más que lo que te cobran.',
      'Haz un presupuesto simple y decide cuánto puedes aportar cada mes sin afectar tus gastos básicos.',
      'Entiende la inflación: si tu dinero rinde 2 % y los precios suben 4 %, cada año compras menos.',
      'Prueba la calculadora de interés compuesto de Funda para ver el efecto de aportar poco, pero con constancia.',
      'No tengas prisa: el mercado seguirá ahí mañana.',
    ],
    tip: 'Un fondo de emergencia evita vender tus inversiones justo en el peor momento.',
  },
  {
    id: 'instrumentos',
    group: 'Ruta de inicio',
    title: 'Los instrumentos, en simple',
    summary: 'Qué es cada cosa en la que puedes invertir.',
    steps: [
      'Acciones: pedacitos de una empresa. Si le va bien, tu parte vale más y a veces paga dividendos.',
      'Bonos: préstamos que haces a un gobierno o empresa a cambio de intereses. Suelen ser más estables que las acciones.',
      'ETFs y fondos indexados: una canasta de muchas acciones o bonos en un solo producto, con comisiones bajas.',
      'Oro y materias primas: activos físicos que se usan como refugio o dependen de la oferta y la demanda.',
      'Divisas: el valor de una moneda frente a otra. Importan si ahorras, viajas o recibes dinero en otra moneda.',
      'Criptomonedas: dinero y redes digitales. Muy volátiles; mejor como una parte pequeña.',
    ],
    tip: 'Para empezar, un ETF amplio es la forma más simple de no depender de una sola empresa.',
  },
  {
    id: 'riesgo-diversificacion',
    group: 'Ruta de inicio',
    title: 'Riesgo y diversificación',
    summary: 'Cómo reducir la probabilidad de un golpe grande.',
    steps: [
      'Diversificar es repartir el dinero entre activos que no se mueven igual: así una caída no te arrastra por completo.',
      'Mezcla según tu plazo: a menor plazo, más ahorro y bonos; a mayor plazo, más acciones.',
      'Invierte de a poco con regularidad (DCA) en lugar de adivinar el mejor día.',
      'Una o dos veces al año revisa tu mezcla y reequilíbrala (rebalanceo).',
      'Espera caídas: en bolsa de 10 % a 20 % son normales. Decide de antemano qué harás para no vender por pánico.',
      'Haz el test de perfil de riesgo de Funda para ver un ejemplo de mezcla.',
    ],
    tip: 'No metas todos los huevos en la misma canasta, ni siquiera en la de moda.',
  },
  {
    id: 'primer-paso',
    group: 'Ruta de inicio',
    title: 'Tu primer paso, paso a paso',
    summary: 'De cero a tu primera inversión, con calma.',
    steps: [
      'Elige una plataforma regulada y reconocida, y verifica en su sitio oficial que acepte usuarios de tu país.',
      'Abre la cuenta desde la URL oficial y completa la verificación de identidad (KYC).',
      'Activa el doble factor (2FA) con una app autenticadora antes de depositar.',
      'Empieza con un monto pequeño que no te quite el sueño.',
      'Elige una opción simple y amplia (por ejemplo, un ETF diversificado) antes que una apuesta individual.',
      'Programa un aporte periódico y revisa tus resultados una o dos veces al año, no todos los días.',
    ],
    tip: 'La constancia pesa más que acertar el momento.',
  },
  {
    id: 'estafas',
    group: 'Seguridad',
    title: 'Cómo detectar estafas',
    summary: 'Las banderas rojas más comunes, en cripto y fuera de ella.',
    steps: [
      'Promesas de ganancias fijas o "garantizadas" (por ejemplo, 2 % diario).',
      'Presión para invertir rápido: "solo hoy", "últimos cupos".',
      'Te piden la frase semilla, claves o pagar para "liberar" fondos.',
      'Perfiles que te escriben primero por redes o WhatsApp ofreciendo "ayuda" o "asesoría".',
      'Proyectos nuevos sin equipo visible, sin auditoría y con promesas de x100.',
      'URLs casi iguales a las oficiales o apps fuera de las tiendas oficiales.',
    ],
    tip: 'Si suena demasiado bueno para ser verdad, es porque no lo es.',
  },
  {
    id: 'proteger',
    group: 'Seguridad',
    title: 'Cómo proteger tus cuentas y tu billetera',
    summary: 'Hábitos de seguridad que evitan la mayoría de los robos.',
    steps: [
      'Usa contraseñas únicas y un gestor de contraseñas.',
      'Activa 2FA con app autenticadora, no por SMS.',
      'Guarda en favoritos las URLs oficiales y entra siempre desde ahí.',
      'Escribe tu frase semilla en papel y guárdala en un lugar seguro. Nada de capturas ni notas en la nube.',
      'Para ahorros grandes en cripto, usa una billetera fría (hardware wallet).',
      'Revisa y revoca permisos de aplicaciones DeFi que ya no uses.',
    ],
    tip: 'Ningún soporte técnico real te pedirá tu frase semilla o tus claves.',
  },
  {
    id: 'primera-compra',
    group: 'Cripto',
    title: 'Cómo comprar tu primera cripto',
    summary: 'De cero a tu primera compra en un exchange.',
    steps: [
      'Elige un exchange reconocido y disponible en tu país (mira la sección Plataformas).',
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
    group: 'Cripto',
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
];
