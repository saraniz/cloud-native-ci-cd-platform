# -------------------------
# Build stage
# -------------------------
FROM node:22 AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npm run build

# -------------------------
# Production stage (Nginx)
# -------------------------
FROM nginx:alpine

# VITE OUTPUT IS dist (NOT build)
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]