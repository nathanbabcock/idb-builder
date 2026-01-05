---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: Typedex
  text: Extreme typesafety for Indexed DB
  # tagline: My great project tagline
  actions:
    - theme: brand
      text: Getting started
      link: /getting-started
    # - theme: alt
    #   text: API Examples
    #   link: /api-examples

features:
  - title: Typesafety
    details:
      The idiosyncracies of the Indexed DB API are enforced through the type system, catching a
      wide range of potential errors at compile-time before they happen.
  - title: Schema validation
    details:
      Define and validate the shape of your data with best-in-class schema
      libraries like Zod. Later, support for any Standard Schema will be added.
  - title: Declarative migrations
    details:
      Use a fluent builder interface to set up your database, capturing granular
      information about the schema and database architecture as you do so.
---


<!-- Old homepage content: -->

<!-- ## Features

<CardGrid stagger>
  <Card title="Typesafety" icon="approve-check-circle">
    The idiosyncracies of the [Indexed DB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)  are enforced through the type system, catching a
    wide range of potential errors at compile-time before they happen.
  </Card>
  <Card title="Schema validation*" icon="seti:json">
    Define and validate the shape of your data with best-in-class schema
    libraries like [`zod`](http://zod.dev/).
    <small>
      *only Zod for now, with full [Standard
      Schema](https://standardschema.dev/) support coming soon ;)
    </small>
  </Card>
  <Card title="Declarative migrations" icon="list-format">
    Use a fluent builder interface to set up your database, capturing granular
    information about the schema and database architecture as you do so.

    Using migrations as the single source of truth guarantees that the final
    state of your database matches what you expect it to be (and flags errors when it doesn't).

  </Card>
  <Card title="Thin abstraction" icon="puzzle">
    For the most part, Typedex just adds additional compile-time checks to calls
    that you would be making to Indexed DB anyways. Under the hood, the
    battle-tested [`idb`](https://github.com/jakearchibald/idb) library is used
    as a minimal, ergonomic, and modern interface for Indexed DB.

    Since most of
    the functionality is compile-time, there is little to no additional runtime overhead
    and minimal impact on bundle size.

  </Card>
</CardGrid>

## Benefits

<CardGrid stagger>
  <Card title="Reduce cognitive load">
    Indexed DB can be tricky to reason about — it's essentially solving a
    distributed systems problem. It's widely supported but comes from an era
    before Typescript and before Promises. Some of its API design decisions have
    some rough edges. By inferring as much knowledge about the system as
    possible through the Typescript compiler, there's less mental overhead to
    manage.
  </Card>
  <Card title="Provide peace of mind">
    Database migrations in particular can be stressful. If something goes wrong,
    users' local data is at risk in a way which may be difficult to recover
    from. Layering additional strictness on top of the native APIs helps harden
    your implementation against potential problems in production.
  </Card>
  <Card title="Learn the quirks of the native API">
    If you or a member of your team are learning Indexed DB for the first time,
    many of the errors surfaced by this library can help teach the requirements
    and constraints imposed by the native Indexed DB API in a learn-by-doing
    style.
  </Card>
  <Card title="Set guardrails for AI">
    If you rely on LLM codegen or agents, Indexed DB can be a risky API surface
    for them to interact with. Without a typesafe wrapper, there's a lot of
    things that can go wrong silently and slip through CI unnoticed. If your
    agent goes rogue, Typedex will set off alarm bells before changes make it to
    prod.
  </Card>
  <Card title="Communicate about database design">
    On larger teams, it may not be immediately obvious how the database is set
    up, especially when it comes to some of the "fancier" features like
    [compound](#), [nested](#), or [multi-entry indexes](#) (🚧 TODO: link these
    🚧). By capturing precise information about these data structures in the
    type system, the interface becomes self-documenting and discoverable across
    teams without extra communication overhead.
  </Card>
</CardGrid> -->
