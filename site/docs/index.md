---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  # name: idb-migrate
  text: Type-safe IndexedDB migrations
  # tagline: My great project tagline
  image:
    src: /assets/logo.png
    alt: idb-migrate logo
    width: 300
    height: 300
  actions:
    - theme: brand
      text: Getting started
      link: /getting-started
    # - theme: alt
    #   text: API Examples
    #   link: /api-examples

features:
  - title: Declarative migrations
    icon: 📋
    details:
      Use a fluent builder interface to set up your database, capturing granular
      information about the schema and database architecture as you do so.
  - title: Compile-time guarantees
    icon: 🛡️
    details: Catch potential runtime errors at compile-time before they happen.
  - title: Single source of truth
    icon: ☝️
    details: Since your database schema is inferred from the migrations themselves, they will never be out of sync.
---
