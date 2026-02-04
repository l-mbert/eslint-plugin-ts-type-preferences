# prefer-interface-extends-over-type-intersection

Prefer `interface extends` over object-type intersections when a type reference is involved.

## Rationale

When a type alias uses an intersection to model object inheritance (for example, `A & { ... }`), it can often be expressed more clearly as an `interface` that `extends` the referenced types. This rule enforces that preference and provides an auto-fix.

## Rule Details

This rule reports `type` aliases whose annotation is an intersection that contains at least one type reference and only object literal types otherwise. It rewrites the alias as an `interface` with an `extends` clause and merges object literal members into the interface body.

### Incorrect

```ts
type Base = {};
type A = Base & {
  fieldA: string;
};
```

### Correct

```ts
interface Base {}

interface A extends Base {
  fieldA: string;
}
```

## Options

### `mergeObjects`

- Type: `boolean`
- Default: `true`

When `true`, object literal types within the intersection are merged into the interface body. When `false`, the rule only applies if there is at most one object literal type.

## Notes

- The rule intentionally ignores intersections that include unsupported types (e.g. unions or primitives).
- The fixer preserves all member kinds (properties, methods, call/construct signatures, index signatures) but does not attempt to resolve duplicates or conflicts.
