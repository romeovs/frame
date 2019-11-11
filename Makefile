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

list:
	@$m "Listing deps..."
	@echo "cli src:"
	@echo $(SRC_FILES) | xargs -n1 -- echo "  "

cli: dist/cli.js

dist/cli.js: $(SRC_FILES)
	@$m "Building cli..."
	@$(ROLLUP) -c

lint:
	@$m "Linting..."
	@$(ESLINT) --ext .js --ext .jsx --ext .ts --ext .tsx src
