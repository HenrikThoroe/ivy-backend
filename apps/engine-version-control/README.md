# Engine Version Control

The EVC service handles available chess engines and versioning.
Engines can be up- and downloaded from the service. The EVC service is
responsible for distributing engines and identifying them.

## Development

Ensure that an AWS S3 compatible object storage is running locally and the environment is configured with the
required data to access the service. NodeJS and yarn are required to run this service.

```sh
# Start the dev server with automatic reloads on file change
yarn dev
```

## API

EVC provides a REST API which allows:

**`GET /engines`**

Collects all available engines and responds with a list of their metadata which includes

- name
- versions
  - version number
  - download path

**`GET /engines/:name`**

Returns a list of versions available for the given engine.
Each version contains the same data as given by `GET /engines`.

**`GET /engines/:name/:version`**

Downloads the binary associated with the given engine and it's specific version.
Use `latest` for the version to download the newest engine version.

**`POST /engines`**

```ts
{
  name: string
  increment: 'major' | 'minor' | 'patch'
}
```

Allows to upload a file as a new version of the specified engine. If the engine is not yet present it will
be added to the engine storage. `increment` defines the version associated with the uploaded file.
It specifies how the version should be increased regarding the latest available version. If the engine
is created with the command, increment will set the initial version. For example when setting `increment=minor`, the
initial engine version will be `0.1.0`.
