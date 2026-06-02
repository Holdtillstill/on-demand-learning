FROM node:22 AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

FROM node:22
WORKDIR /app
ENV API_TOKEN=do-not-bake-secrets
COPY --from=build /app .
EXPOSE 3000
CMD ["npm", "start"]
