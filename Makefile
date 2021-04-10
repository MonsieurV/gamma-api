start:
	docker-compose up --build

dev-mongo:
	docker-compose -f docker-compose.local.yml up

dev-mongo-rebuild:
	docker-compose -f docker-compose.local.yml up --build

dev-reload:
	npm run run-reload
