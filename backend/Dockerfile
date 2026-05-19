FROM node:20-alpine
RUN apk add --no-cache python3 make g++ wget
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN mkdir -p /app/data
EXPOSE 3001
CMD ["node", "server.js"]
