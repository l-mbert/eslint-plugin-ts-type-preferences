# eslint-plugin-ts-type-preferences

An ESLint plugin for TypeScript with two rules:

- Prefer `interface extends` when object inheritance is expressed via intersections.
- Prefer merging object-only intersections into a single type literal.

## Why

This plugin is based on Matt Pocock's article "Type vs Interface: Which Should You Use?" The article recommends using `interface` specifically for object inheritance because `extends` lets TypeScript reuse cached interface information and is slightly more optimal than `&` intersections.

It also recommends defaulting to `type` for everything else due to interface declaration merging pitfalls. These rules follow that guidance by only targeting object inheritance and object-only intersections expressed via `&`.

Reference: https://www.totaltypescript.com/type-vs-interface-which-should-you-use

## Rules

### prefer-interface-extends-over-type-intersection

Reports `type` aliases that intersect at least one type reference with object literals and suggests an equivalent `interface` declaration.

It will:

- Convert `type A = B & { ... }` to `interface A extends B { ... }`.
- Only emit an `interface` when the intersection includes at least one type reference.
- Leave intersections that include unsupported types (like unions, primitives, or indexed access types) unchanged.

The rule is fixable and will automatically rewrite the type alias to an interface.

### prefer-merged-type-literal-over-intersection

Reports object-only intersections and suggests merging them into a single type literal.

It will:

- Convert `type A = { ... } & { ... }` to `type A = { ... }`.
- Keep the declaration as a `type` instead of converting to an `interface`.

## Examples

### prefer-interface-extends-over-type-intersection

**Invalid**

```ts
type WithId = {
  id: string;
};

type User = WithId & {
  name: string;
};
```

**Valid (after fix)**

```ts
interface WithId {
  id: string;
}

interface User extends WithId {
  name: string;
}
```

### prefer-merged-type-literal-over-intersection

**Invalid (multiple object intersections)**

```ts
type A = {
  fieldA: string;
} & {
  fieldB: number;
};
```

**Valid (after fix)**

```ts
type A = {
  fieldA: string;
  fieldB: number;
};
```

## Options

### prefer-interface-extends-over-type-intersection

`mergeObjects` (boolean, default: `true`)

When `true`, object literal types in the intersection are merged into the interface body.

When `false`, the rule only converts intersections that contain at most one object literal type and at least one type reference. Intersections with multiple object literals are left unchanged.

### prefer-merged-type-literal-over-intersection

No options.

## Installation

```bash
pnpm add -D eslint-plugin-ts-type-preferences
```

## Usage

### Flat config (ESLint v9+)

```js
import tsTypePreferences from "eslint-plugin-ts-type-preferences";

export default [
  {
    plugins: {
      "eslint-plugin-ts-type-preferences": tsTypePreferences,
    },
    rules: {
      "eslint-plugin-ts-type-preferences/prefer-interface-extends-over-type-intersection":
        "error",
      "eslint-plugin-ts-type-preferences/prefer-merged-type-literal-over-intersection":
        "error",
    },
  },
];
```

### Legacy config (.eslintrc)

```json
{
  "plugins": ["eslint-plugin-ts-type-preferences"],
  "rules": {
    "eslint-plugin-ts-type-preferences/prefer-interface-extends-over-type-intersection": "error",
    "eslint-plugin-ts-type-preferences/prefer-merged-type-literal-over-intersection": "error"
  }
}
```

### Recommended config (legacy .eslintrc)

```json
{
  "extends": ["plugin:eslint-plugin-ts-type-preferencesn/recommended"]
}
```

## Limitations

When merging object literals, the fixer preserves all member kinds and order, but it does not attempt to resolve duplicate or conflicting members. If you rely on advanced merging semantics, review the fix output before applying.

## Development

```bash
pnpm install
pnpm test
```
