# Multi-stage Dockerfile for Billza Frontend (Development & Production)

# Stage 1: Development
FROM node:22-alpine AS dev
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps
COPY . .
EXPOSE 3000
ENV HOST=0.0.0.0
ENV PORT=3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]

# Stage 2: Production Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps
COPY . .

ARG VITE_API_BASE_URL="https://api.billza.xyz/api"
ARG VITE_FRONTEND_URL="https://billza.xyz"
ARG VITE_STELLAR_NETWORK="TESTNET"

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_FRONTEND_URL=$VITE_FRONTEND_URL
ENV VITE_STELLAR_NETWORK=$VITE_STELLAR_NETWORK

RUN npm run build

# Stage 3: Production Runtime
FROM node:22-alpine AS production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps --omit=dev
COPY --from=builder /app/dist ./dist
COPY vite.config.ts ./
EXPOSE 3000
ENV HOST=0.0.0.0
ENV PORT=3000
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
