const BASE_URL = "http://192.168.1.223:3000/api/v1";
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