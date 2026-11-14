import { IMOVEIS, TIPOS, rotuloTipo, type Imovel, type Tipo } from '../data/imoveis';

export interface Filtro { tipo: Tipo | 'todos'; codigo: string; }
export const FILTRO_VAZIO: Filtro = { tipo: 'todos', codigo: '' };
export const tipoValido = (value: string | null): Tipo | 'todos' => TIPOS.find(tipo => tipo.id === value)?.id ?? 'todos';
const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

export function filtrar(filtro: Filtro): Imovel[] {
  const termo = normalizar(filtro.codigo.trim());
  return IMOVEIS.filter(imovel =>
    (filtro.tipo === 'todos' || imovel.tipo === filtro.tipo) &&
    (!termo || normalizar(`${imovel.codigo} ${imovel.titulo} ${rotuloTipo(imovel.tipo)}`).includes(termo)),
  );
}
