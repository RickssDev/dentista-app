# Imagen base oficial de Node
FROM node:22

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del proyecto
COPY . .

# Exponer el puerto donde corre tu backend
EXPOSE 3000

# Comando para levantar tu app
CMD ["npm", "start"]