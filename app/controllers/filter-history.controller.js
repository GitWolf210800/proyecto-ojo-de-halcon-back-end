import { FilterInputError, FilterSizeError, FilterBusyError } from '../services/filter-history.js';
import { FILTER_METRICS } from '../services/filter-history-metrics.js';
import { TIME_ZONE } from '../services/climate-history.js';

export function createFilterHistoryController({ service }) {
  const handle = operation => async (req, res) => {
    try { return res.status(200).json(await operation(req)); }
    catch (error) {
      if (error instanceof FilterInputError) return res.status(400).json({ message: 'Selección o período no válido. El intervalo máximo por consulta es de 184 días, aproximadamente seis meses' });
      if (error instanceof FilterSizeError) return res.status(422).json({ message: 'El resultado es demasiado grande. Reducí el período o la selección.' });
      if (error instanceof FilterBusyError) {
        res.set('Retry-After', '5');
        return res.status(429).json({ message: 'Hay una consulta histórica en curso. Intentá nuevamente en unos segundos.' });
      }
      return res.status(500).json({ message: 'No se pudo consultar el histórico de filtros.' });
    }
  };
  return {
    catalog: handle(async () => ({ tipo: 'catalogo_filtros', zona_horaria: TIME_ZONE,
      metricas: FILTER_METRICS, sensores: await service.catalog() })),
    consult: handle(req => service.consult(req.body)),
    export: handle(req => service.export(req.body)),
  };
}
