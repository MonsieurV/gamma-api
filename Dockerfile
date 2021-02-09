FROM node:alpine

RUN mkdir /app

WORKDIR /app

ADD \
    src \
    .babelrc \
    package.json package-lock.json \
  app/

RUN npm instal
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "run-build"]
