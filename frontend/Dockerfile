# Build and development stage for Billza Frontend
FROM node:22-alpine

WORKDIR /app

# Install dependencies first for optimal Docker layer caching
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Copy application source
COPY . .

# Expose Vite development server port
EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000

# Start Vite dev server accessible from all hosts
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
