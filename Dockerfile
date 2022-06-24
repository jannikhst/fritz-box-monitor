# syntax=docker/dockerfile:1
FROM node:current-alpine

RUN apk add chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
ADD https://raw.githubusercontent.com/jannikhst/fritz-box-monitor/master/package.json /app/
ADD https://raw.githubusercontent.com/jannikhst/fritz-box-monitor/master/index.ts /app/
ADD https://raw.githubusercontent.com/jannikhst/fritz-box-monitor/master/tsconfig.json /app/

RUN npm install
RUN npm install -g typescript
RUN tsc -p .

ENV NODE_ENV=production
CMD node ./dist/index.js