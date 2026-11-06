const digitos = (valor) => String(valor || '').replace(/\D/g, '');

function cpfValido(valor) {
  const d = digitos(valor);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const calcular = (n) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return calcular(9) === Number(d[9]) && calcular(10) === Number(d[10]);
}

function telefoneValido(valor) {
  const d = digitos(valor);
  return d.length === 10 || d.length === 11;
}

const texto = (valor, limite = 200) => String(valor ?? '').trim().slice(0, limite);

module.exports = { digitos, cpfValido, telefoneValido, texto };
