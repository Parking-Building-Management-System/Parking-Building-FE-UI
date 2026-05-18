.PHONY: setup pc fmt lint check

setup:
	bash scripts/setup-precommit.sh

pc:
	pre-commit run --all-files

fmt:
	bunx prettier --write .

lint:
	bunx eslint . --ext .js,.jsx,.ts,.tsx --fix

check:
	bunx tsc --noEmit
