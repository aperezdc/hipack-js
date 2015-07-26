
UGLIFY_FLAGS = -c -m

node_modules/uglify-hs/bin/uglifyjs node_modules/mocha/bin/mocha:
	@npm install

%.min.js: %.js | node_modules/uglify-js/bin/uglifyjs
	./node_modules/uglify-js/bin/uglifyjs $(UGLIFY_FLAGS) -o $@ $<

all: hipack.min.js

test: node_modules/mocha/bin/mocha
	@./node_modules/mocha/bin/mocha

.PHONY: test

# vim:ft=make
