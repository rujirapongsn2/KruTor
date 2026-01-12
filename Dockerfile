# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

RUN npm run build

# Production stage
FROM nginx:alpine

# Install SQLite
RUN apk add --no-cache sqlite

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create directories for storage and database
RUN mkdir -p /app/uploads /app/data

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
