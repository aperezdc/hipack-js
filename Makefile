
UGLIFY_FLAGS = -c -m

all:

node_modules/uglify-hs/bin/uglifyjs node_modules/mocha/bin/mocha:
	@npm install

%.min.js %.min.map: %.js | node_modules/uglify-js/bin/uglifyjs
	./node_modules/uglify-js/bin/uglifyjs $(UGLIFY_FLAGS) \
		--source-map $(patsubst %.js,%.map,$@) \
		-o $@ $<

all: hipack.min.js hipack.min.map

test: node_modules/mocha/bin/mocha
	@./node_modules/mocha/bin/mocha

.PHONY: test

# vim:ft=make
