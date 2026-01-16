FROM node:20-slim

WORKDIR /app
ENV NODE_ENV=production

COPY server/tryon-cleanup.mjs ./tryon-cleanup.mjs

CMD ["node", "tryon-cleanup.mjs"]
