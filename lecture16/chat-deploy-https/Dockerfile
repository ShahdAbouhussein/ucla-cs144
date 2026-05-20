FROM node:lts-alpine
WORKDIR /app
COPY package*.json ./
ENV NODE_ENV=production
RUN npm install --production
COPY . .
EXPOSE 1919
CMD ["node", "app.js"]
