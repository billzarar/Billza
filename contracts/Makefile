.PHONY: all build test clean deploy-testnet

all: build

build:
	cargo build --target wasm32-unknown-unknown --release

test:
	cargo test

clean:
	cargo clean

deploy-testnet:
	@echo "Deploying Billza Soroban contract to Stellar Testnet..."
	python3 deploy.py
