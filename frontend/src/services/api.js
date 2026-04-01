const BASE_URL = "/api/v1";

export const api = async (endpoint, method = "GET", data = null, isFormData = false) => {
  const options = {
    method,
    headers: {}
  };

  if (data) {
    if (isFormData) {
      options.body = data;
    } else {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(data);
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);

  const text = await response.text();

  if (!response.ok) {
    console.error("ERROR BACKEND:", text);
    throw new Error("Error del servidor");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Respuesta inválida del servidor");
  }
};