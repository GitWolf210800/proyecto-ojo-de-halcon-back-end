// Dependencies are injected so this flow can be tested without opening connections.
export function createRegister({ getConnection, bcryptjs }) {
    const query = (sql, values) => new Promise((resolve, reject) => {
        getConnection().query(sql, values, (error, results) => {
            if (error) return reject(error);
            resolve(results);
        });
    });

    return async function register(req, res) {
        try {
            const { name, lastName, puesto, passUser, legajoPat, passUserPat } = req.body;
            const legajo = parseInt(req.body.legajo);
            const email = req.body.email || 'NULL';
            let clavex;

            // Exact role names only; preserve the three optional representations.
            switch (req.body.clavex) {
                case undefined:
                case null:
                case '': clavex = null; break;
                case 'SUPER_USER': clavex = 0; break;
                case 'ADMIN_LIMITES': clavex = 1; break;
                case 'CALIBRACION_CLIMA': clavex = 2; break;
                case 'VISITANTE': clavex = 3; break;
                default:
                    return res.status(400).send({status: 'Error', message: 'Rol inválido'});
            }

            const sponsors = await query('SELECT * FROM usuarios WHERE id_legajo = ?', [legajoPat]);
            if (!sponsors.length) {
                return res.status(400).send({status: 'Error', message: 'El Usuario Patrocinador ingresado no existe'});
            }
            const validPassword = await bcryptjs.compare(passUserPat, sponsors[0].passwordd);
            if (!validPassword) {
                return res.status(400).send({status: 'Error', message: 'Error de password de usuario Patrocinador'});
            }
            if (sponsors[0].id_priv !== 0) {
                return res.status(400).send({status: 'Error', message: 'El usuario patrocinador ingresado, no tiene autorizacion para la solicitud!'});
            }

            const users = await query('SELECT * FROM usuarios WHERE id_legajo = ?', [legajo]);
            if (users.length) {
                return res.status(400).send({status: 'Error', message: 'Este Usuario ya Existe!'});
            }

            const salt = await bcryptjs.genSalt(5);
            const hashPassword = await bcryptjs.hash(passUser, salt);
            await query(
                'INSERT INTO usuarios (id_legajo, nombre, apellido, puesto, email, passwordd, id_priv) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [legajo, name, lastName, puesto, email, hashPassword, clavex]
            );
            return res.status(201).send({status: 'ok', message: `Usuario ${legajo} agregado`, redirect: '/'});
        } catch {
            return res.status(500).send({status: 'Error', message: 'Error al registrar usuario'});
        }
    };
}
