BIN = ./node_modules/.bin

ROLLUP = $(BIN)/rollup
ESLINT = $(BIN)/eslint

cli:
	@$(ROLLUP) -c

lint:
	@$(ESLINT) --ext .js --ext .jsx --ext .ts --ext .tsx src
