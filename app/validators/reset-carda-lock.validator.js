export class ResetCardaPayloadError extends Error {
  constructor() {
    super('Selección de máquinas inválida');
    this.name = 'ResetCardaPayloadError';
    this.code = 'INVALID_RESET_CARDA_PAYLOAD';
  }
}

const isPlainObject = (value) => value !== null && typeof value === 'object' &&
  Object.getPrototypeOf(value) === Object.prototype;

export function validateResetCardaPayload(body) {
  if (!isPlainObject(body)) throw new ResetCardaPayloadError();
  const names = Object.keys(body);
  if (names.length === 0) throw new ResetCardaPayloadError();
  for (const name of names) {
    if (name.trim().length === 0 || ['__proto__', 'prototype', 'constructor'].includes(name) ||
        !isPlainObject(body[name])) {
      throw new ResetCardaPayloadError();
    }
  }
  // Only selection matters; preserve names literally and ignore display values.
  return names;
}
