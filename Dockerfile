# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM alpine:3.19 AS certs

ARG DOMAIN=admin.ava-kk.ru
ARG SSL_VALID_DAYS=365

RUN apk add --no-cache openssl && \
    mkdir -p /certs && \
    openssl req -x509 -nodes -newkey rsa:2048 \
      -keyout /certs/admin.key \
      -out /certs/admin.crt \
      -days ${SSL_VALID_DAYS} \
      -subj "/CN=${DOMAIN}" && \
    chmod 600 /certs/admin.key

FROM nginx:1.25-alpine

COPY --from=certs /certs/admin.key /etc/nginx/certs/admin.key
COPY --from=certs /certs/admin.crt /etc/nginx/certs/admin.crt
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-check-certificate -q -O - https://localhost:5000/healthz > /dev/null || exit 1
