# Replays

## The App

The Replays app is a microservice for the `Ivy - Backend` project.
The app provides a REST-like API to access saved replays of chess games between
engines.

The app allows inter-service communication via Redis message queues. New
replays can be added by sending them through this channel.

## Dependents

The replay app is the source of truth for all replays the
full project deals with. When a new replay is received by the
test driver app, it is send to the replay service, from which other
services can fetch the replays.

## API

For a definition of the exposed API take a look
at [the schema](https://github.com/HenrikThoroe/ivy-backend/tree/main/packages/api-schema/src/schema/replay).

A definition for messages sent and received through the Redis message queue can be
found [here](https://github.com/HenrikThoroe/ivy-backend/blob/dev/docs/packages/com/src/channels/index.ts).
