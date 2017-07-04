PID=$(shell cat run.pid)

run:
	npm run run

start:
	nohup npm run run > log.txt 2>&1 & echo $$! > run.pid

stop:
	kill ${PID}
