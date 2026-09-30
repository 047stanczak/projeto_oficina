# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* bun.lock* ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginx:1.27-alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN apk add --no-cache openssl
COPY gen-cert.sh /docker-entrypoint.d/40-gen-cert.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-gen-cert.sh && chmod +x /docker-entrypoint.d/40-gen-cert.sh
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]
