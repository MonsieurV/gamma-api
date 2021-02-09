FROM node:alpine

RUN mkdir /app

WORKDIR /app

ADD .babelrc \
    package.json package-lock.json \
  /app/
RUN npm install

ADD src /app/src
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "run-build"]
