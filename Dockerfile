FROM node:8.1.3-alpine

WORKDIR /app
COPY . .
npm install --production

EXPOSE 3000

CMD ["bin/natsboard"]