# Game Manager

## The App

The game manager app is a microservice of the `Ivy - Backend` project.
The game manager exposes a REST API for creating new games, which
then client can join using a WebSocket connection.

The game manager is designed to work with [the adapter](https://github.com/HenrikThoroe/ivy-adapter),
which connects against the service and uses any engine provided by the Engine Version Control app.

## API

For a definition of the exposed API take a look
at [the schema](https://github.com/HenrikThoroe/ivy-backend/tree/main/packages/api-schema/src/schema/games).
