FROM 9.4.0-alpine

WORKDIR /app
COPY . .

EXPOSE 3000
EXPOSE 3001

CMD ["bin/natsboard"]
