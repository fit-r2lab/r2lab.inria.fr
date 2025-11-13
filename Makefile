# the script to apply git changes in production site r2lab.inria.fr
# invoked every 10 minutes from cron through pull-and-restart.sh
# which does make install

PUBLISH-PATH = /var/www/r2lab.inria.fr
EXCLUDES = .git
RSYNC-EXCLUDES = $(foreach exc,$(EXCLUDES), --exclude $(exc))

publish: publish-r2lab publish-nepi-ng

########## mirror this contents
publish-r2lab:
	# no longer delete files that are not in the source
	# as this actually removes the contents of raw/
	rsync -ai $(RSYNC-EXCLUDES) ./ $(PUBLISH-PATH)/

########## restart nginx on r2lab.inria.fr
# maybe not strictly necessary when the python code is stable
# but that won't hurt us while developing as frequent changes
# are to be expected
nginx:
	systemctl restart nginx r2lab-django.service

#
install: publish nginx

.PHONY: publish nginx install

########## force both infra boxes to use latest commit
infra:
	echo since fedora29, remote ssh run under hard-wired umask - run pull-and-restart.sh locally
	#apssh -l root -t faraday.inria.fr -t r2lab.inria.fr /root/r2lab-embedded/services/pull-and-restart.sh

.PHONY: infra

##########
tags:
	$(MAKE) --no-print-directory files | xargs etags

.PHONY: tags

########## get rid of pdf's and the like
files:
	@git ls-files | egrep -v 'trash-|assets/(js|css)|\.(pdf|png|jpg|gif|svg|ttf|otf|JPG)'

.PHONY: files

##########
publish-nepi-ng:
	rsync -ai nepi-ng-index.html /var/www/nepi-ng/index.html
