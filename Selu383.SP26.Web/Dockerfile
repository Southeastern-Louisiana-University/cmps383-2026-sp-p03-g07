FROM node:22-alpine
WORKDIR /app

COPY Selu383.SP26.Web/package*.json ./
RUN npm ci

COPY Selu383.SP26.Web/ .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
