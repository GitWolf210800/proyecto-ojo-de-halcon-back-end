// Closed SQL identifier registry. Neither request bodies nor database values extend it.
const definitions = [
  ['filtro_ventilador', 'Filtro – ventilador', 'Pa'],
  ['prefiltro', 'Prefiltro', 'Pa'],
  ['prefiltro_ventilador', 'Prefiltro – ventilador', 'Pa'],
  ['filtro', 'Filtro', 'Pa'],
  ['filtro_prefiltro', 'Filtro – prefiltro', 'Pa'],
  ['ventilador', 'Ventilador', 'Pa'],
  ['ventilador_1', 'Ventilador 1', 'Pa'],
  ['ventilador_2', 'Ventilador 2', 'Pa'],
  ['ventilador_3', 'Ventilador 3', 'Pa'],
  ['ventilador_4', 'Ventilador 4', 'Pa'],
  ['picos', 'Picos', 'Pa'], ['picos2', 'Picos 2', 'Pa'],
  ['rpm_filtro', 'RPM filtro', 'RPM'], ['rpm_filtro2', 'RPM filtro 2', 'RPM'],
  ['carro', 'Carro', '%'], ['carro2', 'Carro 2', '%'],
  ['desperdicio', 'Desperdicio', 'Pa'],
];
export const FILTER_METRICS = Object.freeze(definitions.map(([campo, etiqueta, unidad]) => {
  const limites = [{ campo: `min_${campo}`, tipo: 'min' }];
  if (campo !== 'desperdicio') limites.push({ campo: `max_${campo}`, tipo: 'max' });
  if (campo === 'filtro_ventilador') limites.push({ campo: 'max_alarma_filtro_ventilador', tipo: 'alarmaMax' });
  return Object.freeze({ campo, etiqueta, unidad, limites: Object.freeze(limites.map(Object.freeze)) });
}));

export function checkedMetrics(metrics) {
  if (!Array.isArray(metrics) || !metrics.length || new Set(metrics).size !== metrics.length ||
      metrics.some(metric => !FILTER_METRICS.includes(metric))) throw new Error('Invalid metric registry selection');
  return metrics;
}
