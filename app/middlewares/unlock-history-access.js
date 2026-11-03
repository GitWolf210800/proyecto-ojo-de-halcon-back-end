export function createUnlockHistoryAccess({ getAccessMode, verifyJwt, repository }) {
  return async function unlockHistoryAccess(req, res, next) {
    if (String(getAccessMode() ?? '').trim().toLowerCase() === 'local') return next();
    let user;
    try {
      const token = req.cookies?.jwt;
      if (typeof token !== 'string' || !token) throw new Error();
      const decoded = verifyJwt(token, { algorithms: ['HS256'] });
      user = decoded?.user;
      if (!((typeof user === 'number' && Number.isSafeInteger(user) && user > 0) ||
        (typeof user === 'string' && /^\d+$/.test(user) && Number.isSafeInteger(Number(user)) && Number(user) > 0))) {
        throw new Error();
      }
    } catch {
      return res.status(401).json({ message: 'Se requiere una sesión válida.' });
    }
    try {
      const users = await repository.findUser(user);
      if (users.length !== 1) return res.status(401).json({ message: 'Se requiere una sesión válida.' });
    } catch {
      return res.status(500).json({ message: 'No se pudo verificar la sesión.' });
    }
    return next();
  };
}
