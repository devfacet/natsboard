FROM node:8-alpine

WORKDIR /app
COPY . .
RUN yarn install --production

EXPOSE 3000
EXPOSE 3001

CMD ["bin/natsboard"]
