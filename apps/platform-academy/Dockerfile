FROM node:22-alpine AS build
WORKDIR /app
COPY apps/platform-academy/package*.json ./
RUN npm ci
COPY apps/platform-academy ./
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.29-alpine
USER root
RUN apk upgrade --no-cache
USER 101
ENV PLATFORM_API_UPSTREAM=http://api:8000
COPY --chown=101:101 apps/platform-academy/nginx.conf /etc/nginx/templates/default.conf.template
COPY --chown=101:101 --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
