# The YtoTech Gamma Api

> An enthusiastic open-data radioactivity API for collecting Gamma ray events.

Live at https://gamma.ytotech.com (well, soon). Blog post on the API soon, too. Maybe.

## Publish radioactivity data

Ask your contributor API credentials to [yoan@ytotech.com](mailto:yoan@ytotech.com).

### Gamma ray events

Then, publish your Gamma ray events with:

```
POST /api/v1/events
```

Exemple using CURL:
```
curl -v -X POST https://gamma.ytotech.com/api/v1/events \
-H "Content-Type:application/json" \
-H "Authorization: Basic <YOUR_API_TOKENS>" \
-d '{
  "timestamp": "2016-10-29T05:17:51.745Z",
  "position": {
    "latitude": 49.418683,
    "longitude": 2.823469
  },
  "type": "gamma"
}'
```

We authenticate the requests using HTTP [Basic Auth](https://en.wikipedia.org/wiki/Basic_access_authentication). Your API credentials must be representend as a string `user:password` and encoded to Base64. This gives something like `eW9hbkB5dG90ZWNoLmNvbTpjb2luY29pbg==` (for user `yoan@ytotech.com` and password `coincoin`).

The timestamp should be an ISO8601 string. We recommend to send uniquely UTC dates, even if the API parse the zone. (No zone specified default to UTC).

### Data points

You can also publish your Geiger counter datapoints: CPM and/or dose (uSv/h) measurements.

```
POST /api/v1/datapoints
```

Exemple using CURL:
```
curl -v -X POST https://gamma.ytotech.com/api/v1/datapoints \
-H "Content-Type:application/json" \
-H "Authorization: Basic <YOUR_API_TOKENS>" \
-d '{
  "timestamp": "2016-10-29T05:17:51.745Z",
  "position": {
    "latitude": 49.418683,
    "longitude": 2.823469
  },
  {
    "unit": "uSvh",
    "value": "0.058"
  },
  {
    "unit": "CPM",
    "value": "3.05"
  }
}'
```

## Where do I find a Geiger counter?

Following your time & money investisment, as well as your precision requirements, I can suggest two alternatives:
* [Radiation Watch Pocket Geiger Type 5](http://www.radiation-watch.org/p/pocketgeiger.html), for an affordable but still usefull background monitoring device;
* [Safecast bGeigie Nano](https://shop.kithub.cc/products/safecast-bgeigie-nano), for a complete, reactive & precise mobile device, with a true [pancake unit](http://www.lndinc.com/products/16/).

Read more on them on the YtoTech blog: [Radiation Watch](https://blog.ytotech.com/2015/12/06/radiation-watch-arduino/), [Safecast](https://blog.ytotech.com/2016/03/30/radiation-watch-safecast/).

They're many other valid choices, from custom and [DIY](http://www.instructables.com/id/Arduino-Geiger-Counter/) kits to high-end [devices](https://medcom.com/product/hawk-radius/).

## Contribute

To run the app locally:
```sh
git clone https://github.com/MonsieurV/gamma-api
cd gamma-api/
npm install
npm run run
```

You'll need a MongoDb datastore. You can instantiate one using [Docker](https://www.docker.com/):

```
docker run --name mongo_for_gamma_API -d mongo -v 127.0.0.1:27017:27017
```

[Yoan](mailto:yoan@ytotech.com).
