# gamma-api

An enthusiastic open-data radioactivity API for collecting Gamma ray events.

Live at https://gamma.ytotech.com.

## Publish radioactivity data

Ask contributor credentials to yoan@ytotech.com.

Then, publish your data point with:

```
POST /api/v1/datapoints
```

Exemple using CURL:
```
curl -v -X POST https://gamma.ytotech.com/api/v1/datapoints \
-H "Content-Type:application/json" \
-H "Authorization: TODO TODO" \
-d '{
  "timestamp": "TODO",
  "type": "gamma"
}'
```

## Contribute

To run the app locally:
```sh
git clone https://github.com/MonsieurV/gamma-api
cd gamma-api/
npm install
npm run run
```

You'll need a MongoDb datastore.
