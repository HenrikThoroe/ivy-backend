# Authentication

## The App

The Authentication app, handles all requests that are related to
user management. This includes sign-in, -out and -up as well
as updating data, deleting users and refreshing bearer tokens.

The microservice allows API users to obtain access tokens, that
the `auth` package can validate to grant or deny access to specific
endpoints.

## API

For a definition of the exposed API take a look
at [the schema](https://github.com/HenrikThoroe/ivy-backend/tree/main/packages/api-schema/src/schema/authentication).
