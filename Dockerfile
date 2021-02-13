FROM node:alpine

RUN mkdir /app

WORKDIR /app

ADD package.json package-lock.json \
  /app/
RUN npm install

ADD src /app/src

EXPOSE 3000

CMD ["npm", "run", "run"]
