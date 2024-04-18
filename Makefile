cbx.min.js: cbx.js Makefile
	./node_modules/terser/bin/terser cbx.js  -c passes=5,defaults --mangle > $@
	@echo "Expected gzip'ed size:" `cat $@ | gzip | wc -c`
