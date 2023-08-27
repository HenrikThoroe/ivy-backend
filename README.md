# Ivy - Backend

This monorepo contains the codebase for the microservices that form
the backend of the chess engine Ivy.

## Motivation

Writing a chess engine, or any other piece of software with highly messurable performance metrics, requires a strong regression testing framework.
In case of open source game playing software a distributed testing environment is also an important factor.
`Ivy Backend` can be compared to Fishtest used and maintained by the Stockfish team. This solution is focused on providing
a centralized testing and management environment for the Ivy chess engine. It includes different services required for a sound testing
solution in the context of chess engines. Different services provide capabilities to manage engine versions and their different flavours (e.g. OS, ISA, extensions),
distribute tests on many different physical client devices, record replays, analyze replays and more too come.

## Project Overview

The project is based on [Turbo Repo](https://turbo.build).

- `apps/*`: Code base for the deployed microservices
- `packages/*`: Internal and public packages used by different services

## Getting Started

Make sure to have NodeJS, Yarn and Docker installed on your development system.

```sh
# Start required external services (Redis, Minio S3)
docker compose up

# Start services in watch mode
yarn dev
```
