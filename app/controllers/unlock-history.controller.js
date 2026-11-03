function positiveInteger(value, fallback) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 1 ? number : null;
}

export function createUnlockHistoryController({ repository }) {
  return async function unlockHistory(req, res) {
    const page = positiveInteger(req.query.page, 1);
    const pageSize = positiveInteger(req.query.pageSize, 25);
    const offset = (page - 1) * pageSize;
    if (page === null || pageSize === null || pageSize > 100 || !Number.isSafeInteger(offset)) {
      return res.status(400).json({ message: 'page debe ser un entero positivo y pageSize un entero entre 1 y 100.' });
    }
    try {
      const [{ total }] = await repository.count();
      const items = await repository.list(pageSize, offset);
      return res.status(200).json({ items, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
    } catch {
      return res.status(500).json({ message: 'No se pudo consultar el historial de desbloqueos.' });
    }
  };
}
