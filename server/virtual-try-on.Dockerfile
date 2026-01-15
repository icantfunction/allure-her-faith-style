FROM node:20-slim

WORKDIR /app
ENV NODE_ENV=production
ENV VTO_PORT=8080

COPY server/virtual-try-on-server.mjs ./virtual-try-on-server.mjs

EXPOSE 8080
CMD ["node", "virtual-try-on-server.mjs"]
