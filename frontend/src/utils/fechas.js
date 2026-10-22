const pad = (n) => String(n).padStart(2, "0");

export const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

// Date -> "2026-10-20" (en hora local)
export const aClave = (fecha) =>
  `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;

export const hoyClave = () => aClave(new Date());

// "2026-10-20" -> { anio: 2026, mes: 9 }  (mes de 0 a 11)
export const mesDe = (clave) => {
  const [anio, mes] = clave.split("-").map(Number);
  return { anio, mes: mes - 1 };
};

// "2026-10-20" -> "martes 20 de octubre"
export const fechaLarga = (clave) => {
  const [anio, mes, dia] = clave.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  return `${DIAS[fecha.getDay()]} ${dia} de ${MESES[mes - 1]}`;
};