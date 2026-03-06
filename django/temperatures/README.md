# temperatures sandbox

this is not connected to r2lab.inria.fr, it is a standalone sandbox to visualize temperature data from r2lab

## requirements

- we need at least one dataset in JSON format
- it is expected to sit in `data.json` in this same folder
- you can produce one on r2lab.inria.fr with something like 

  ```bash
  cd /tmp
  http POST faraday.inria.fr:8000/api/v1/relays/temperatures duration=1d > temps-1d.json
  http POST faraday.inria.fr:8000/api/v1/relays/temperatures duration=1w sample_period=1h > temps-1w.json
  http POST faraday.inria.fr:8000/api/v1/relays/temperatures duration=3w sample_period=3h > temps-3w.json
  http POST faraday.inria.fr:8000/api/v1/relays/temperatures duration=30d sample_period=6h > temps-1m.json
  ```

- retrieve them

  ```bash
  rsync -ai root@r2lab.inria.fr:/tmp/temps-*.json .
  ```

## run the http server

importantly, python's http server does not support CORS, so we use http-server from npm

```bash
npx http-server --cors . --port 8081
```

## access the page

then open your browser at http://localhost:8081/sandbox.html
