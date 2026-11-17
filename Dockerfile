# Imagen del frontend: compila React con Vite y lo sirve con nginx.
# nginx también reenvía /api y la documentación Swagger al API Gateway (ver nginx/default.conf).

# ---------- Etapa 1: compilar ----------
FROM node:22-alpine AS compilacion
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# En el servidor el frontend usa siempre el backend real, en la misma dirección (sin CORS).
ARG VITE_MODO_DATOS=api
ARG VITE_API_URL=/api/v1
ENV VITE_MODO_DATOS=$VITE_MODO_DATOS VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---------- Etapa 2: servir ----------
FROM nginx:1.27-alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=compilacion /app/dist /usr/share/nginx/html
EXPOSE 80
