# Documentation as tests

Since so much of the library's functionality is experience at compile-time and
through an IDE/code editing environment, the clearest way to communicate _what
the library does_ is to show its behavior in that context.

## How it works

This is done using the [twoslash](https://twoslash.netlify.app/) plugin for
Vitepress, which compiles example code snippets and surfaces their type hints,
autocomplete options, and error messages directly in the documentation.

This is able to effectively double as a second layer of tests for the library,
since if a given snippet does not throw the error that it's annotated with, the
documentation build will fail, signalling a problem somewhere.

## Beyond compile-time

While this is an especially good fit for compile-time beavhior tests, I believe
this technique is more broadly applicable to runtime behavior tests as well.
Perhaps even (non-technical) user-facing docs with
extremely clear examples could
be used by an agent to run through the same scenarios in a composable way.

Such a system could work in either direction -- either from hardcoded tests e.g.
playwright, translated via LLM into user-facing documentation along with
up-to-date screenshots; or the reverse, where LLMs read the docs the same was as
a human would and use it to interact with the app in a fluid way instead of
flaky and hardcoded scripts. In either case you get twice the bang for your buck.
