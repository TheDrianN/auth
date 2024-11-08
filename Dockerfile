# Usa la imagen base de Node.js
FROM node:18

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos necesarios para instalar dependencias y Prisma
COPY package*.json ./
COPY prisma ./prisma/

# Instala las dependencias (incluyendo Prisma Client)
RUN npm install

# Genera Prisma Client a partir del archivo schema.prisma
RUN npx prisma generate

# Copia el resto del código del proyecto
COPY . .

# Si usas TypeScript, compila el proyecto
RUN npm run build

# Establece las variables de entorno necesarias
ENV NODE_ENV=production

# Expone el puerto del microservicio
EXPOSE 3002

# Comando por defecto para iniciar la aplicación
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
