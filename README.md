Gitribution 2
=============

The goal of Gitribution 2 is to extract data from our repo commit history in a format that can be used by Mozilla's Project Baloo. We currently have over 1,000 repos on Github.

We are using this custom tool to query the API, rather than githubarchive.org because we want to capture commit history for repos that start elsewhere, but then get moved into the various Mozilla organization accounts - this is a common workflow for repos, and valuable contribution activity would be missed if we only tracked the push and pull events.

Looks at the people (github logins) involved in:
* commits

# Contributing

## Prerequisites:

* node
* heroku toolbelt
* mysql db

## Setup an activities and summary table in mysql
See script in sql/create_table.sql

## Environment Config

For local dev, copy sample.env to .env and add credentials
Set equivilent environment variables on Heroku

## Tracking Config
```
to_track.js
```

## Running the app:

```
foreman start fetch
```
or
```
heroku start fetch
```
