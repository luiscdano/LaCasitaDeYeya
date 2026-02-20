FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --no-fund --no-audit

COPY src ./src

EXPOSE 8789

CMD ["npm", "start"]
