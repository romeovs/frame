NAME = frame
BIN = ./node_modules/.bin

ROLLUP = $(BIN)/rollup
ESLINT = $(BIN)/eslint

# Logging helpers
log_color = \033[34m
log_name = $(NAME)
log_no_color = \033[0m
m = printf "$(log_color)$(log_name)$(log_no_color) %s$(log_no_color)\n"

SRC_FILES = $(shell find src -name "*.js")
EXM_FILES = $(shell find example -type "f")

list:
	@$m "Listing deps..."
	@echo "cli src:"
	@echo $(SRC_FILES) | xargs -n1 -- echo "  "
	@echo "example src:"
	@echo $(EXM_FILES) | xargs -n1 -- echo "  "

cli: lib dist/cli.js

dist/cli.js: $(SRC_FILES) rollup.config.js lib
	@$m "Building cli..."
	@$(ROLLUP) -c

lib: $(SRC_FILES)
	@rm -rf dist/lib
	@cp -r src dist/lib

lint:
	@$m "Linting..."
	@$(ESLINT) --ext .js --ext .jsx --ext .ts --ext .tsx src

example: ./dist/cli.js $(EXM_FILES)
	@./dist/cli.js

serve:
	@cd example/dist && http-server
