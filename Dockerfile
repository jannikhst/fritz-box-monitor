# syntax=docker/dockerfile:1
FROM node:current-alpine

RUN apk add chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
COPY ["tsconfig.json", "./"]

RUN npm install

COPY . .

RUN npm install -g typescript

RUN tsc -p .
ENV NODE_ENV=production
CMD node ./dist/index.js