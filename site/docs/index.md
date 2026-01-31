---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: Typedex
  text: Type-safe IndexedDB
  # tagline: My great project tagline
  actions:
    - theme: brand
      text: Getting started
      link: /getting-started
    # - theme: alt
    #   text: API Examples
    #   link: /api-examples

features:
  - title: Type safety
    icon: 🛡️
    details:
      The idiosyncracies of the Indexed DB API are enforced through the type system, catching a
      wide range of potential errors at compile-time before they happen.
  - title: Declarative migrations
    icon: 📋
    details:
      Use a fluent builder interface to set up your database, capturing granular
      information about the schema and database architecture as you do so.
  - title: Schema evolution
    icon: 🔄
    details: Define and evolve the shape of your data with native Typescript types and zero runtime dependencies.
---
