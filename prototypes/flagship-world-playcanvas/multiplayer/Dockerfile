FROM node:22-alpine
WORKDIR /app/multiplayer
COPY multiplayer/package*.json ./
RUN npm ci --omit=dev
COPY multiplayer/server.mjs multiplayer/physics.js ./
COPY multiplayer.html multiplayer-main.js /app/
ENV PORT=2567
EXPOSE 2567
USER node
CMD ["node", "server.mjs"]
