export class ResetCardaRepositoryError extends Error {
  constructor(code) {
    super('No se pudo completar la operación de datos de desbloqueo');
    this.name = 'ResetCardaRepositoryError';
    this.code = code;
  }
}

// Importing this module neither loads a driver nor opens a connection.
export function createResetCardaRepository(options) {
  const { getConnection } = options ?? {};
  const query = async (sql, parameters) => {
    try {
      return await new Promise((resolve, reject) => {
        getConnection().query(sql, parameters, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
      });
    } catch {
      throw new ResetCardaRepositoryError('SQL_ERROR');
    }
  };

  return {
    async findInstallationByName(nombre) {
      const rows = await query(
        'SELECT nombre, direccion_ip, id_fabrica FROM instalaciones WHERE nombre = ?',
        [nombre],
      );
      if (!Array.isArray(rows)) throw new ResetCardaRepositoryError('INVALID_SQL_RESULT');
      if (rows.length === 0) throw new ResetCardaRepositoryError('INSTALLATION_NOT_FOUND');
      if (rows.length !== 1) throw new ResetCardaRepositoryError('INSTALLATION_NOT_UNIQUE');
      const row = rows[0];
      if (!row || typeof row !== 'object') throw new ResetCardaRepositoryError('INVALID_SQL_RESULT');
      if (typeof row.nombre !== 'string' || row.nombre.trim().length === 0 ||
          typeof row.direccion_ip !== 'string' || row.direccion_ip.trim().length === 0 ||
          row.id_fabrica === null || row.id_fabrica === undefined) {
        throw new ResetCardaRepositoryError('INVALID_INSTALLATION_DATA');
      }
      return { nombre: row.nombre, direccion_ip: row.direccion_ip, id_fabrica: row.id_fabrica };
    },

    async insertUnlockHistory({ userId, machineId }) {
      if (userId === null || userId === undefined || machineId === null || machineId === undefined) {
        throw new ResetCardaRepositoryError('INVALID_HISTORY_DATA');
      }
      const result = await query(
        'INSERT INTO desbloqueo_cardas (id_legajo, fecha, maquinas) VALUES (?, CURRENT_TIMESTAMP, ?)',
        [userId, machineId],
      );
      if (result?.affectedRows !== 1) throw new ResetCardaRepositoryError('HISTORY_NOT_INSERTED');
    },
  };
}
