export interface Platform {
  name: string;
  url: string;
  description: string;
  bestFor: string;
  tags: string[];
}

export const EXCHANGES: Platform[] = [
  {
    name: 'Binance',
    url: 'https://www.binance.com',
    description: 'El exchange más grande del mundo por volumen, con cientos de criptomonedas y mercado P2P.',
    bestFor: 'Variedad de monedas, comisiones bajas y P2P en moneda local.',
    tags: ['Centralizado', 'P2P', 'App móvil'],
  },
  {
    name: 'Coinbase',
    url: 'https://www.coinbase.com',
    description: 'Exchange estadounidense que cotiza en bolsa, conocido por su facilidad de uso.',
    bestFor: 'Principiantes que priorizan una interfaz simple y regulación.',
    tags: ['Centralizado', 'Regulado', 'Principiantes'],
  },
  {
    name: 'Kraken',
    url: 'https://www.kraken.com',
    description: 'Uno de los exchanges más antiguos (2011), con buena reputación en seguridad.',
    bestFor: 'Seguridad y herramientas avanzadas a medida que aprendes.',
    tags: ['Centralizado', 'Seguridad'],
  },
  {
    name: 'Bitso',
    url: 'https://bitso.com',
    description: 'Exchange latinoamericano con presencia en México, Argentina, Colombia y Brasil.',
    bestFor: 'Depósitos y retiros en moneda local de Latinoamérica.',
    tags: ['Latam', 'Moneda local'],
  },
  {
    name: 'OKX',
    url: 'https://www.okx.com',
    description: 'Exchange global con billetera Web3 integrada y acceso a DeFi.',
    bestFor: 'Explorar DeFi desde la misma app del exchange.',
    tags: ['Centralizado', 'Web3'],
  },
  {
    name: 'Bybit',
    url: 'https://www.bybit.com',
    description: 'Exchange global con amplia oferta de productos y mercado P2P.',
    bestFor: 'Usuarios intermedios que buscan variedad de productos.',
    tags: ['Centralizado', 'P2P'],
  },
];

export const WALLETS: Platform[] = [
  {
    name: 'MetaMask',
    url: 'https://metamask.io',
    description: 'La billetera más popular para Ethereum y redes compatibles. Extensión de navegador y app.',
    bestFor: 'Usar aplicaciones DeFi y NFTs en Ethereum y Layer 2.',
    tags: ['Caliente', 'Autocustodia', 'Ethereum'],
  },
  {
    name: 'Trust Wallet',
    url: 'https://trustwallet.com',
    description: 'App móvil multired y sencilla, compatible con miles de tokens.',
    bestFor: 'Principiantes que quieren una billetera móvil para varias redes.',
    tags: ['Caliente', 'Autocustodia', 'Multired'],
  },
  {
    name: 'Phantom',
    url: 'https://phantom.com',
    description: 'Billetera líder en Solana, también compatible con Ethereum y Bitcoin.',
    bestFor: 'Ecosistema Solana con una interfaz muy amigable.',
    tags: ['Caliente', 'Autocustodia', 'Solana'],
  },
  {
    name: 'Exodus',
    url: 'https://www.exodus.com',
    description: 'Billetera de escritorio y móvil con diseño muy visual e intercambio integrado.',
    bestFor: 'Quien quiere ver su portafolio de forma clara en la computadora.',
    tags: ['Caliente', 'Autocustodia', 'Escritorio'],
  },
  {
    name: 'Ledger',
    url: 'https://www.ledger.com',
    description: 'Billetera física (hardware) que mantiene tus claves fuera de internet.',
    bestFor: 'Guardar ahorros a largo plazo con máxima seguridad.',
    tags: ['Fría', 'Hardware', 'Máxima seguridad'],
  },
  {
    name: 'Trezor',
    url: 'https://trezor.io',
    description: 'Pionera de las billeteras físicas (2014), con software de código abierto.',
    bestFor: 'Seguridad máxima con transparencia de código abierto.',
    tags: ['Fría', 'Hardware', 'Código abierto'],
  },
];
