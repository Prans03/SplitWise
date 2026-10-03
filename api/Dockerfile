FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install && npm install -g ts-node-dev
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]
