FROM mhart/alpine-node:base

WORKDIR /app
COPY . .

EXPOSE 3000
EXPOSE 3001

CMD ["bin/natsboard"]
