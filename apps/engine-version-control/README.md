# Engine Version Control

## The App

Engine Version Control (short: EVC) is a microservice for the `Ivy - Backend` project.
EVC uses a S3 instance to manage different binaries for game engines. In the spirit of this
project those engines are chess engines.

EVC exposes a REST-like API which allows to upload, download, find and delete engines.

There are different engines, defined by their name.
Each engine can have multiple variations.
A variation has a unique version and multiple flavours.
A flavour is the same version of an engine but with different
requirements to the system it runs on. For example an engine
could have three flavours:

- One that runs on Linux
- Two that run on Windows
- One of those requires AMD64 with AVX2
- The other requires ARM64 with ASIMD

## API

For a definition of the exposed API take a look
at [the schema](https://github.com/HenrikThoroe/ivy-backend/tree/dev/docs/packages/api-schema/src/schema/evc).
