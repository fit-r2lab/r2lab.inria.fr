# devel guide

the default configs are generally suitable for production

for devel, several pieces are needed to run the project locally, and this is a
quick guide to get you up and running

here's the ports we commonly use for these services:
this is to avoid conflicts with other e.g. fastapi instances etc..

- `localhost:9999` for the `r2lab-api` API server
- `localhost:10000` for the `r2lab-sidecar` ws server
- `localhost:10001` for the `r2lab.inria.fr` django server

## make targets

see also ./Makefile that has some convenience targets to run the various pieces,
e.g. `make dev-api` and similar

## in `r2lab-api` repo

```bash
cd ~/git/r2lab-api/
uv sync
source .venv/bin/activate

fastapi run --reload --port 9999 r2lab_api/app.py
```

### `.env`

```bash
$ cat .env
R2LAB_DATABASE_URL=postgresql://r2lab:r2lab@localhost:5432/r2lab
R2LAB_JWT_SECRET=this-is-my-dev-secret-key
R2LAB_JWT_EXPIRE_MINUTES=1440
R2LAB_MAIL_MODE=console
$
```

## in this repo `r2lab.inria.fr`

### in `django` folder

```bash
cd ~/git/r2lab.inria.fr/
cd django/
uv sync
source .venv/bin/activate
uv run python manage.py runserver 10001
```

the config that says to use local sidecar is in `django/r2lab/settings.py`
it can be overridden by redefining the `SIDECAR` env. variable

### in the `react` server

```bash
npx vite build --watch
# NOTE: instead one could do
#npm run dev
# and you will have hot reload if you go to
# http://localhost:5173/react/admin (or signup)
# but it won't be allowed to access the API
```

## in `r2lab-sidecar` repo

```bash
cd ~/git/r2lab-sidecar/
uv sync
source .venv/bin/activate

r2lab-sidecar -D
```

## in `rhubarbe` repo

**not using uv - this is by design, user slices on faraday won't be using uv**

```bash
conda activate rhubarbe
pip install -e .
```

the local config file has this:

```bash
❯ rhubarbe config sidecar r2labapi
1-th config file = /Users/tparment/git/rhubarbe/rhubarbe/config/rhubarbe.conf
2-th config file = ./rhubarbe.conf
==========  section r2labapi
resource_name = r2lab.inria.fr
url = http://localhost:9999
==========  section sidecar
url = wss://localhost:10000
```

