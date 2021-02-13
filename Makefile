start:
	docker-compose up --build

dev-mongo:
	docker-compose -f docker-compose.local.yml up

dev-reload:
	npm run run-reload
