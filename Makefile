# development helpers only; the production site is deployed by deploy/update.sh,
# that is run by r2lab-embedded/services/run-updates.sh

##########
tags:
	$(MAKE) --no-print-directory files | xargs etags

.PHONY: tags

########## get rid of pdf's and the like
files:
	@git ls-files | egrep -v 'trash-|assets/(js|css)|\.(pdf|png|jpg|gif|svg|ttf|otf|JPG)'

.PHONY: files

##########
# the commands to run the development servers for Django and React,
# in case we want to test things locally before pushing to production
dev-django:
	cd django && python manage.py runserver 10001

dev-react:
	cd react && npm npx vite build --watch

dev-api:
	cd ../r2lab-api && fastapi dev --reload r2lab_api/app.py --port 9999

dev-sidecar:
	cd ../r2lab-sidecar && r2lab-sidecar -D
