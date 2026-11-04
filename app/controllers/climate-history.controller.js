import { ClimateInputError, ClimateSizeError, ClimateBusyError, TIME_ZONE } from '../services/climate-history.js';

export function createClimateHistoryController({ service }) {
  const handle = operation => async (req, res) => {
    try {
      return res.status(200).json(await operation(req));
    } catch (error) {
      if (error instanceof ClimateInputError) return res.status(400).json({ message: 'Selección o período no válido. El intervalo máximo por consulta es de 184 días, aproximadamente seis meses' });
      if (error instanceof ClimateBusyError) {
        res.set('Retry-After', '5');
        return res.status(429).json({ message: 'Hay una consulta histórica en curso. Intentá nuevamente en unos segundos.' });
      }
      if (error instanceof ClimateSizeError) return res.status(422).json({ message: 'La consulta supera 12000 puntos. Reducí el período o seleccioná un sensor.' });
      return res.status(500).json({ message: 'No se pudo consultar el histórico de clima.' });
    }
  };
  return {
    catalog: handle(async () => ({ tipo: 'catalogo_clima', zona_horaria: TIME_ZONE, sensores: await service.catalog() })),
    consult: handle(req => service.consult(req.body)),
  };
}
