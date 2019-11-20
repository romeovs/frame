NAME = frame
BIN = ./node_modules/.bin

ROLLUP = $(BIN)/rollup
ESLINT = $(BIN)/eslint
BABEL = $(BIN)/babel
JEST = $(BIN)/jest

# Logging helpers
log_color = \033[34m
log_name = $(NAME)
log_no_color = \033[0m
m = printf "$(log_color)$(log_name)$(log_no_color) %s$(log_no_color)\n"

SRC_FILES = $(shell find src -name "*.js")
EXM_FILES = $(shell find example -type f  | grep -v example/dist | grep -v example/.frame_cache)
ES_DIST = $(patsubst src/%.js,dist/es/%.js,$(SRC_FILES))

.PHONY: list
list:
	@$m "Listing deps..."
	@echo "cli src:"
	@echo $(SRC_FILES) | xargs -n1 -- echo "  "
	@echo "example src:"
	@echo $(EXM_FILES) | xargs -n1 -- echo "  "

cli: dist/cli.js
es: $(ES_DIST)

dist/cli.js: $(ES_DIST) $(SRC_FILES) rollup.config.js
	@$m "Building cli..."
	@$(ROLLUP) -c

dist/es/%.js: src/%.js
	@$m "Building $<..."
	@$(BABEL) $< -o $@

.PHONY: lint
lint:
	@$m "Linting..."
	@$(ESLINT) --ext .js --ext .jsx --ext .ts --ext .tsx src

.PHONY: test
test:
	@$m "Testing..."
	@$(JEST)

.PHONY: example
example: $(EXM_FILES) cli
	@./dist/cli.js build -r example -v debug

.PHONY: example.dev
example.dev: $(EXM_FILES) cli
	@./dist/cli.js build -r example -v debug --dev

.PHONY: example.serve
example.serve:
	@./dist/cli.js serve -r example -v debug

.PHONY: example.watch
example.watch:
	@./dist/cli.js watch -r example -v debug

.PHONY: example.clean
example.clean:
	@rm -r example/dist/js
