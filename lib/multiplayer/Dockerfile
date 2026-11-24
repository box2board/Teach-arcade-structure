FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json ./
COPY lib/multiplayer ./lib/multiplayer
COPY public/multiplayer ./public/multiplayer
COPY public/mini-games/shared/midway-characters ./public/mini-games/shared/midway-characters
COPY public/mini-games/vendor ./public/mini-games/vendor
COPY public/review-lab ./public/review-lab
COPY public/teacher/set-contract.js ./public/teacher/set-contract.js
USER node
ENV NODE_ENV=production
CMD ["node", "lib/multiplayer/serve.js"]
