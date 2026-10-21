import test from "node:test";
import assert from "node:assert/strict";
import { readSession, validateReservation } from "../src/lib/reservations.js";

const valid = {
  name: "María Prueba",
  phone: "55 1234 5678",
  prefix: "+52",
  city: "CDMX",
  consent: true,
};

test("accepts a formatted Mexican contact number and consent", () => {
  assert.deepEqual(validateReservation(valid), {});
});
test("requires all contact fields and explicit consent", () => {
  const errors = validateReservation({
    name: "",
    phone: "",
    prefix: "+52",
    city: "",
    consent: false,
  });
  assert.deepEqual(Object.keys(errors), ["name", "phone", "city", "consent"]);
});
test("rejects Mexican numbers that do not have ten digits", () => {
  for (const phone of ["123456789", "12345678901", "55abcdef78"]) {
    assert.ok(validateReservation({ ...valid, phone }).phone);
  }
});
test("allows international number lengths without applying Mexican rules", () => {
  assert.deepEqual(
    validateReservation({ ...valid, prefix: "+34", phone: "612345678" }),
    {},
  );
});
test("recovers from corrupt session JSON", () => {
  assert.deepEqual(readSession({ getItem: () => "{bad json" }, "cart", {}), {});
});
test("rejects an unexpected session state shape", () => {
  assert.deepEqual(readSession({ getItem: () => "[]" }, "cart", {}), {});
  assert.deepEqual(readSession({ getItem: () => "{}" }, "favorites", []), []);
});
test("reads existing product selections without storing contact data", () => {
  assert.deepEqual(
    readSession({ getItem: () => '{"tirzepatida":2}' }, "cart", {}),
    { tirzepatida: 2 },
  );
});
