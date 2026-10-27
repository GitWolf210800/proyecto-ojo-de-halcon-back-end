// No application bootstrap or DB imports: dependencies are supplied at composition.
export const industrialPolicies = Object.freeze({
  edicionCardaLock: Object.freeze({
    allowedPrivileges: Object.freeze([0, 5, 6]),
    message: "El usuario no tiene autorizacion para la peticion",
  }),
  formlimsent: Object.freeze({
    allowedPrivileges: Object.freeze([0, 1]),
    message: "El usuario no tiene autorizacion para la peticion!",
  }),
  formCalSent: Object.freeze({
    allowedPrivileges: Object.freeze([0, 2]),
    message: "El usuario no tiene autorizacion para la peticion",
  }),
});

export function createIndustrialAuthorization({ getConnection, verifyJwt }, policy) {
  const allowed = new Set(policy.allowedPrivileges);
  const deny = (res) => res.status(400).json({ status: "Error", message: policy.message });

  return async function authorizeIndustrial(req, res, next) {
    let authorized = false;
    try {
      const token = req.cookies?.jwt;
      if (typeof token !== "string" || token.length === 0) throw new Error();
      const decoded = verifyJwt(token);
      const user = decoded?.user;
      if (!((typeof user === "number" && Number.isSafeInteger(user)) ||
            (typeof user === "string" && /^\d+$/.test(user)))) {
        throw new Error();
      }

      const users = await new Promise((resolve, reject) => {
        // Resolve the live connection for every request, never capture its instance.
        getConnection().query(
          "SELECT id_priv FROM usuarios WHERE id_legajo = ?",
          [user],
          (error, results) => error ? reject(error) : resolve(results),
        );
      });
      authorized = Array.isArray(users) && users.length === 1 && allowed.has(users[0]?.id_priv);
    } catch {
      // Authentication and SQL details must never reach the response.
      authorized = false;
    }
    if (!authorized) return deny(res);
    // Outside the catch: downstream failures belong to Express, not this barrier.
    return next();
  };
}
