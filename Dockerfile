# Stage 1: Build the Angular frontend
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --production=false
COPY . .
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --production
COPY --from=build /app/dist /app/dist
COPY server.js .
RUN mkdir -p data

EXPOSE 3000
CMD ["node", "server.js"]
