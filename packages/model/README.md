# Ivy-Backend - Model

Shared data model for the backend and frontend of the Ivy chess engine project.
This package contains basic types and function that can be used in all environments
for a streamlined integration process between server and client side code.

## List of Content

**Game**

Types and functions to validate and play chess games.
Provides all the logic to handle chess games.
This includes move validation, FEN en/decoding and types for boards, game rules etc.
Fully tested!

**Configs**

Basic configuration types for internal representation of chess engines, etc.

**Replay**

Types and functions to work with game replays. Replays can be analyzed with
functions that are included as well!

**Stats**

Stats contains types to analyze statistics over a bunch of replays most commonly.
These statistics are extracted from replays to analyze the overall performance of
specific engines.

**Test**

Types to handle test cases on which to validate engines.

## Installation

```sh
yarn add @ivy-chess/api-schema
```

## Building

```sh
yarn build

# Or for automatic rebuilds on file change
yarn dev
```

## License

The package is part of the [Ivy Backend Project](https://github.com/HenrikThoroe/ivy-backend)
and therefore licensed under GPLv3. Please see the linked repository for more information.
