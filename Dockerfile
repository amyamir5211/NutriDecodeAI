# Stage 1: Build the Application
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Argument for API Key (Consumed during build time by Vite)
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

# Build the application
RUN npm run build

# Stage 2: Serve the Application
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy public assets ensuring they are available (double check incase Vite didn't copy root public files correctly, though it should)
# Note: Vite build puts everything from /public into /dist root.

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
