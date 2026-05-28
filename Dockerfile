# Stage 1: Build the TypeScript application matching modern modules
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Run the production application container
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/views ./src/views
COPY --from=builder /app/src/public ./src/public

# Run Prisma client generation for absolute runtime matching
RUN npx prisma generate

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
