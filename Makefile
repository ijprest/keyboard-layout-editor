all: js/jsonl.min.js

%.min.js : %.js
	uglifyjs "$^" > "$@"
js/%.js : %.grammar.js
	node "$^" > "$@"

.PRECIOUS : js/%.js