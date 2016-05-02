FROM node:6.0-wheezy
RUN npm install natsboard -g
#ENV URL $NATS_MONITOR_URL

EXPOSE 3000
CMD natsboard --nats-mon-url $NATS_MONITOR_URL

# Build
#docker build -t urashidmalik/natsboard .
#docker run -d -p 3000:3000 --env NATS_MONITOR_URL=1.1.1.1:8222 urashidmalik/natsboard
