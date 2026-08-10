export interface Service {
  name: string;
  price: number;
}

export const TATTOO_SERVICES: Service[] = [
  { name: 'Tatuagem Pequena (Até 5cm)', price: 150.00 },
  { name: 'Tatuagem Média (Até 15cm)', price: 350.00 },
  { name: 'Tatuagem Grande (Sessão)', price: 700.00 },
  { name: 'Fechamento (Sessão Completa)', price: 1200.00 },
  { name: 'Piercing / Aplicação', price: 80.00 },
  { name: 'Reforma / Cobertura (Cover Up)', price: 450.00 },
  { name: 'Micropigmentação', price: 250.00 },
  { name: 'Tatuagem Realista (Sessão)', price: 900.00 },
  { name: 'Tatuagem Fineline / Minimalista', price: 200.00 },
  { name: 'Tatuagem Blackwork / Old School', price: 500.00 },
  { name: 'Remoção a Laser (Sessão)', price: 300.00 },
];

export const BARBER_SERVICES = TATTOO_SERVICES;
