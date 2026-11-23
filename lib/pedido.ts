/* Código do pedido: "VR-" + data de criação em base 36 + 3 letras aleatórias.
 * Enquanto não há banco de dados, o rastreio lê a data de dentro do código. */
export function novoCodigo() {
  const letras = Array.from({ length: 3 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random() * 24)]).join("");
  return "VR-" + Date.now().toString(36).toUpperCase() + letras;
}
export function dataDoCodigo(codigo: string): number | null {
  const m = /^VR-([0-9A-Z]+)[A-Z]{3}$/.exec(codigo);
  if (!m) return null;
  const t = parseInt(m[1], 36);
  return t > 1.6e12 && t < Date.now() + 60000 ? t : null;
}

export function cpfValido(v: string) {
  const d = v.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  for (const n of [9, 10]) {
    let s = 0;
    for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i);
    if (((s * 10) % 11) % 10 !== Number(d[n])) return false;
  }
  return true;
}
export function cnpjValido(v: string) {
  const d = v.replace(/\D/g, "");
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (n: number) => {
    let s = 0;
    let p = n - 7;
    for (let i = 0; i < n; i++) {
      s += Number(d[i]) * p--;
      if (p < 2) p = 9;
    }
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}
