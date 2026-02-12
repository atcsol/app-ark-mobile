/**
 * Mechanic specialty constants shared across the mobile app.
 */

export const SPECIALTY_OPTIONS = [
  { label: 'Mecanica Geral', value: 'Mecanica Geral', icon: 'tool' },
  { label: 'Motor', value: 'Motor', icon: 'build' },
  { label: 'Transmissao', value: 'Transmissao', icon: 'setting' },
  { label: 'Suspensao', value: 'Suspensao', icon: 'swap' },
  { label: 'Freios', value: 'Freios', icon: 'stop' },
  { label: 'Sistema Eletrico', value: 'Sistema Eletrico', icon: 'thunderbolt' },
  { label: 'Ar Condicionado', value: 'Ar Condicionado', icon: 'experiment' },
  { label: 'Funilaria', value: 'Funilaria', icon: 'highlight' },
  { label: 'Pintura', value: 'Pintura', icon: 'bg-colors' },
  { label: 'Diagnostico Eletronico', value: 'Diagnostico Eletronico', icon: 'search' },
  { label: 'Injecao Eletronica', value: 'Injecao Eletronica', icon: 'rocket' },
  { label: 'Alinhamento e Balanceamento', value: 'Alinhamento e Balanceamento', icon: 'dashboard' },
];

export const SPECIALTY_ICON_MAP: Record<string, string> = Object.fromEntries(
  SPECIALTY_OPTIONS.map((o) => [o.value, o.icon]),
);
