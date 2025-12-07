# Stage 1: Build the frontend
FROM node:lts-alpine AS builder
WORKDIR /app

# A .dockerignore file is recommended to exclude node_modules and other unnecessary files
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production environment
FROM node:lts-alpine
WORKDIR /app

# Copy server package files and install production dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --only=production

# Copy the rest of the server code
COPY server/. .

# Go back to the app root
WORKDIR /app

# Copy the build output from the builder stage
COPY --from=builder /app/dist ./dist

# Set the final working directory for the runtime
WORKDIR /app/server

# Expose the port and start the server
EXPOSE 8080
CMD ["npm", "start"]
