FROM node:24-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto de Vite
EXPOSE 5173

# Iniciar servidor de desarrollo expuesto a la red
CMD ["npm", "run", "dev", "--", "--host"]
