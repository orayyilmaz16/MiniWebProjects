export function uid(prefix = "id") {
  return `${prefix}_${crypto.getRandomValues(new Uint32Array(4)).join("")}_${Date.now()}`;
}
