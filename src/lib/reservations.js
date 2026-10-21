/** Recover from stale or corrupted session state without breaking the application. */
export function readSession(storage, key, fallback) {
  try {
    const value = JSON.parse(storage.getItem(key));
    if (
      value === null ||
      typeof value !== typeof fallback ||
      Array.isArray(value) !== Array.isArray(fallback)
    )
      return fallback;
    return value;
  } catch {
    return fallback;
  }
}

/** Validate locally; no personal data leaves the browser. */
export function validateReservation(form) {
  const errors = {};
  if (form.name.trim().length < 3) errors.name = "Escribe tu nombre completo.";
  const digits = form.phone.replace(/[\s()+.-]/g, "");
  if (
    !/^\d{7,14}$/.test(digits) ||
    (form.prefix === "+52" && digits.length !== 10)
  ) {
    errors.phone =
      form.prefix === "+52"
        ? "Escribe un número de 10 dígitos."
        : "Escribe un número de contacto válido.";
  }
  if (form.city.trim().length < 2)
    errors.city = "Indica tu ciudad de residencia.";
  if (!form.consent) errors.consent = true;
  return errors;
}
