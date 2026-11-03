// Resolve the current connection on every query, including after reconnects.
export function createUnlockHistoryRepository({ getConnection }) {
  const query = (sql, values) => new Promise((resolve, reject) => {
    getConnection().query(sql, values, (error, rows) => {
      if (error) return reject(error);
      resolve(rows);
    });
  });
  return {
    findUser: (legajo) => query('SELECT id_legajo FROM usuarios WHERE id_legajo = ?', [legajo]),
    count: () => query('SELECT COUNT(*) AS total FROM desbloqueo_cardas WHERE ? = ?', [1, 1]),
    list: (limit, offset) => query(`SELECT d.id_desbloqueo, d.id_legajo, u.nombre, u.apellido, d.fecha, d.maquinas
FROM desbloqueo_cardas AS d
LEFT JOIN usuarios AS u ON u.id_legajo = d.id_legajo
ORDER BY d.fecha DESC, d.id_desbloqueo DESC
LIMIT ? OFFSET ?`, [limit, offset]),
  };
}
