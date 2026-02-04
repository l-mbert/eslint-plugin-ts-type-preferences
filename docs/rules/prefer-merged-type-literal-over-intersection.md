# prefer-merged-type-literal-over-intersection

Prefer merging object-only intersections into a single type literal.

## Rationale

Object literal intersections like `{ a: string } & { b: number }` are typically clearer and more maintainable as a single type literal. This rule merges those intersections without converting them to interfaces.

## Rule Details

This rule reports `type` aliases whose annotation is an intersection composed only of object literals. It rewrites the alias to a single merged object literal type.

### Incorrect

```ts
type A = {
  fieldA: string;
} & {
  fieldB: number;
};
```

### Correct

```ts
type A = {
  fieldA: string;
  fieldB: number;
};
```

## Options

None.

## Notes

- The rule ignores intersections that include any type references or unsupported types.
- The fixer preserves all member kinds (properties, methods, call/construct signatures, index signatures) but does not attempt to resolve duplicates or conflicts.
