NAME = frame
PACKAGE = $(shell cat package.json | json name)
BIN = ./node_modules/.bin

ROLLUP = $(BIN)/rollup
ESLINT = $(BIN)/eslint
JEST = $(BIN)/jest
FLOW = $(BIN)/flow

# Logging helpers
log_color = \033[34m
log_name = $(NAME)
log_no_color = \033[0m
m = printf "$(log_color)$(log_name)$(log_no_color) %s$(log_no_color)\n"

SRC_FILES = $(shell find src -name "*.js")
EXM_FILES = $(shell find example -type f  | grep -v example/dist | grep -v example/.frame_cache)
TYP_FILES = $(shell find src/types -name "*.js.flow")

.PHONY: list
list:
	@$m "Listing deps..."
	@echo "cli src:"
	@echo $(SRC_FILES) | xargs -n1 -- echo "  "
	@echo "example src:"
	@echo $(EXM_FILES) | xargs -n1 -- echo "  "

cli: dist/cli.js types

dist/cli.js: $(SRC_FILES) rollup.config.js
	@$m "Building cli..."
	@$(ROLLUP) -c

dist/lib/client.js: $(SRC_FILES) rollup.config.js
	@$m "Building cli..."
	@$(ROLLUP) -c

dist/lib/server.js: $(SRC_FILES) rollup.config.js
	@$m "Building cli..."
	@$(ROLLUP) -c


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

.PHONY: check
check:
	@$m "Typechecking..."
	@$(FLOW) check

types: $(patsubst src/types/%.js.flow,dist/types/%.js.flow,$(TYP_FILES))

dist/types/%.js.flow: src/types/%.js.flow
	@mkdir -p dist/types
	@cat $< | sed 's|__PACKAGE_NAME__|$(PACKAGE)|g' > $@
