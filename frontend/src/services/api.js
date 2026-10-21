const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(/\/+$/, "");
export const BASE_ORIGIN = new URL(BASE_URL).origin;

export const api = async (
    endpoint,
    method = "GET",
    data = null,
    isFormData = false
  ) => {
    const token = localStorage.getItem("token");

    const options = {
      method,
      headers: {}
    };

    if (token) {
      options.headers["Authorization"] =
        `Bearer ${token}`;
    }

    if (data) {
      if (isFormData) {
        options.body = data;
      } else {
        options.headers["Content-Type"] =
          "application/json";
        options.body = JSON.stringify(data);
      }
    }

    const response = await fetch(
      `${BASE_URL}${endpoint}`,
      options
    );

    let result;

    try {
      result = await response.json();
    } catch {
      result = {};
    }

    if (!response.ok) {
      throw new Error(
        result.message ||
        "Error interno del servidor"
      );
    }

    return result;
  };

export const apiDescargar = async (ruta) => {
  const token = localStorage.getItem("token");

  const options = {
    method: "GET",
    headers: {}
  };

  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${ruta}`, options);

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || "No se pudo descargar el archivo");
  }

  return res.blob();
};

export const getImageUrl = (img, placeholder = "https://via.placeholder.com/60") => {
  if (!img) return placeholder;
  if (img.startsWith("http")) return img;
  return `${BASE_ORIGIN}/${img.replace(/^\/+/, "")}`;
};