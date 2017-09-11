FROM node:8.4-alpine

WORKDIR /app
ADD package.json package-lock.json /app/
RUN npm install --production
COPY . .

EXPOSE 3000

CMD ["bin/natsboard"]