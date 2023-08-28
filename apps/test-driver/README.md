# Test Driver

## The App

The test-driver app is a microservice for the `Ivy - Backend` project.
The app allows to distribute test games on multiple physically independent systems.
Once a client system is connected the test driver can start test sessions on them
and define which engines play with which configuration against each other.

The client will automatically download the repective binary from the EVC service.

Should a client disconnect the test driver will try to maintain the requested amount of clients per session
and request games on any other connected client with available resources.

A user can create test suites and test sessions using an external REST API.
Test suites define the engines, used configurations and the number of games used by test sessions.
Sessions are created for test suites and will request games on a selecetd amount of clients.

When clients have completed their games, the test driver will create replays and send them to the replay
service using a Redis message queue. From there other apps can process the collected data.

## Dependencies

When the replay service is not running, the app will still be able to complete it's main task, distributing
games across devices, but any collected replays will be sent into the ether.

## API

For a definition of the exposed API take a look
at [the schema](https://github.com/HenrikThoroe/ivy-backend/tree/main/packages/api-schema/src/schema/testing).
