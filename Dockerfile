FROM node:20-alpine

WORKDIR '/app'
RUN npm i -g @nestjs/cli
COPY package.json .
COPY package-lock.json .
RUN npm install
COPY . .
RUN npm run build
CMD [ "node", "dist/main.js" ]