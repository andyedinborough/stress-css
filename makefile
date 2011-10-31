files = reader.js parseCSS.js

all: bin/parseCSS.js

bin/parseCSS.js: ${files}
	cat > $@ $^