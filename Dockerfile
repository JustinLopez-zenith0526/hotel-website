# Use a secure Node 22 Linux runtime baseline
FROM node:22-alpine

WORKDIR /app

# Copy dependency configuration files
COPY package*.json ./

# Install ALL necessary runtime and TypeScript typing modules
RUN npm install

# Copy all full-stack project code files straight into the container workspace
COPY . .

# Generate your live Prisma client schema models matching your database configurations
RUN npx prisma generate

EXPOSE 3000
ENV NODE_ENV=production

# Run your server files directly using high-performance tsx runtime execution engines!
CMD ["npx", "tsx", "src/server.ts"]
