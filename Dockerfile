FROM node:22

WORKDIR /www

COPY package.json package-lock.json ./
RUN npm install --include=optional

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
