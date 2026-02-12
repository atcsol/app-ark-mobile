/**
 * Category preset constants shared across the mobile app.
 */

export const PRESET_COLORS: { label: string; value: string; hex: string }[] = [
  { label: 'Blue', value: 'blue', hex: '#1890ff' },
  { label: 'Purple', value: 'purple', hex: '#722ed1' },
  { label: 'Cyan', value: 'cyan', hex: '#13c2c2' },
  { label: 'Red', value: 'red', hex: '#f5222d' },
  { label: 'Gold', value: 'gold', hex: '#faad14' },
  { label: 'Green', value: 'green', hex: '#52c41a' },
  { label: 'Orange', value: 'orange', hex: '#fa8c16' },
  { label: 'Magenta', value: 'magenta', hex: '#eb2f96' },
  { label: 'Teal', value: 'teal', hex: '#08979c' },
  { label: 'Lime', value: 'lime', hex: '#a0d911' },
  { label: 'Indigo', value: 'indigo', hex: '#2f54eb' },
  { label: 'Brown', value: 'brown', hex: '#8b4513' },
  { label: 'Pink', value: 'pink', hex: '#ff85c0' },
  { label: 'Gray', value: 'gray', hex: '#8c8c8c' },
];

export const PRESET_ICONS: { name: string; label: string }[] = [
  { name: 'car', label: 'Carro' },
  { name: 'tool', label: 'Ferramenta' },
  { name: 'build', label: 'Construcao' },
  { name: 'setting', label: 'Engrenagem' },
  { name: 'thunderbolt', label: 'Eletrica' },
  { name: 'fire', label: 'Calor' },
  { name: 'experiment', label: 'Fluido' },
  { name: 'filter', label: 'Filtro' },
  { name: 'search', label: 'Busca' },
  { name: 'dashboard', label: 'Painel' },
  { name: 'stop', label: 'Disco' },
  { name: 'swap', label: 'Troca' },
  { name: 'bg-colors', label: 'Pintura' },
  { name: 'star', label: 'Estrela' },
  { name: 'safety', label: 'Seguranca' },
  { name: 'highlight', label: 'Destaque' },
  { name: 'bulb', label: 'Lampada' },
  { name: 'rocket', label: 'Turbo' },
  { name: 'flag', label: 'Bandeira' },
  { name: 'tag', label: 'Etiqueta' },
  { name: 'wallet', label: 'Carteira' },
  { name: 'camera', label: 'Camera' },
  { name: 'eye', label: 'Olho' },
  { name: 'key', label: 'Chave' },
  { name: 'lock', label: 'Cadeado' },
  { name: 'heart', label: 'Favorito' },
  { name: 'dollar', label: 'Dinheiro' },
  { name: 'shopping-cart', label: 'Carrinho' },
  { name: 'calendar', label: 'Calendario' },
  { name: 'clock-circle', label: 'Relogio' },
  { name: 'phone', label: 'Telefone' },
  { name: 'home', label: 'Casa' },
  { name: 'bell', label: 'Notificacao' },
  { name: 'warning', label: 'Alerta' },
  { name: 'check-circle', label: 'Verificado' },
  { name: 'trophy', label: 'Trofeu' },
  { name: 'environment', label: 'Local' },
  { name: 'shop', label: 'Loja' },
  { name: 'gift', label: 'Presente' },
];

export function getColorHex(color?: string): string {
  if (!color) return '#8c8c8c';
  const preset = PRESET_COLORS.find(
    (c) => c.value.toLowerCase() === color.toLowerCase(),
  );
  return preset ? preset.hex : color;
}
