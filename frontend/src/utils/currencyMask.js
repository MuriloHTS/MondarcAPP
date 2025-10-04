export const formatCurrencyInput = (value) => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, "");

  // Converte para número e divide por 100
  const amount = (parseInt(numbers) || 0) / 100;

  // Formata como moeda
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const parseCurrencyInput = (value) => {
  // Remove tudo exceto números, vírgula e ponto
  const cleanValue = value.replace(/[^\d,.-]/g, "");
  // Substitui vírgula por ponto
  const normalizedValue = cleanValue.replace(",", ".");
  // Retorna o valor parseado
  return parseFloat(normalizedValue) || 0;
};
