# Stats

## The App

The stats app is a microservice for the `Ivy - Backend` project.
It is responsible for crunching the replay data and allowing access to
statistics derived from it.

The app allows for managing of so called verification groups.
Verification groups allow to compare a bunch of engines
against a base engine. A possible use case scenario would
be regression testing for new versions of an engine, to plot the
performance gains over time and prevent shipping an engine that performs worse
than older versions.

The app uses a Redis message queue to fetch replays from the replay service.
Statistics can be accessed and created using the external REST-like API.

## Dependencies

The stats app relies on the replay app to fetch data required for creating statistics.
When the replay service is not running, the stats app will still work and provide
existing data but cannot extends it's dataset and extends it's value.

## API

For a definition of the exposed API take a look
at [the schema](https://github.com/HenrikThoroe/ivy-backend/tree/main/packages/api-schema/src/schema/stats).
