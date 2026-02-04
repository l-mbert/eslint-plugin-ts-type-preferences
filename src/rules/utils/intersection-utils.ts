import { AST_NODE_TYPES, TSESLint, TSESTree } from "@typescript-eslint/utils";

type SourceCode = TSESLint.SourceCode;

/**
 * Utility helpers for analyzing and formatting TypeScript intersection types.
 *
 * This module is intentionally conservative: it only understands intersections
 * composed of object literals (`{ ... }`) and type references (`Foo`, `A.B`).
 * Any other kind of type node causes analysis to bail out with `null`.
 */
export type IntersectionAnalysis = {
  /**
   * All object literal types encountered in the intersection, in order.
   */
  objectTypes: TSESTree.TSTypeLiteral[];
  /**
   * All type references encountered in the intersection, in order.
   */
  extendsTypes: TSESTree.TSTypeReference[];
  /**
   * The first object literal type in the intersection, if present.
   */
  objectType: TSESTree.TSTypeLiteral | null;
};

/**
 * True when a node is a simple type reference like `A` or `A.B`.
 */
function isTypeReference(
  node: TSESTree.Node | null | undefined
): node is TSESTree.TSTypeReference {
  return (
    node !== null &&
    node !== undefined &&
    node.type === AST_NODE_TYPES.TSTypeReference
  );
}

/**
 * True when a node is an object literal type like `{ foo: string }`.
 */
function isObjectType(
  node: TSESTree.Node | null | undefined
): node is TSESTree.TSTypeLiteral {
  return (
    node !== null &&
    node !== undefined &&
    node.type === AST_NODE_TYPES.TSTypeLiteral
  );
}

/**
 * Returns the exact text for a node from the original source.
 */
function getTypeText(node: TSESTree.Node, sourceCode: SourceCode): string {
  return sourceCode.getText(node);
}

/**
 * Computes the indentation (leading whitespace) on the line where the node starts.
 */
function getBaseIndent(node: TSESTree.Node, sourceCode: SourceCode): string {
  const fullText = sourceCode.getText();
  const textBeforeNode = fullText.slice(0, node.range[0]);
  const lastNewlineIndex = textBeforeNode.lastIndexOf("\n");
  const lineStart = lastNewlineIndex + 1;
  const textFromLineStart = textBeforeNode.slice(lineStart);
  return textFromLineStart.match(/^\s*/)?.[0] || "";
}

/**
 * Flattens nested intersections like `(A & B) & C` into `[A, B, C]`.
 */
function flattenIntersectionTypes(node: TSESTree.Node): TSESTree.Node[] {
  if (node.type === AST_NODE_TYPES.TSIntersectionType) {
    const types = node.types ?? [];
    const flattened: TSESTree.Node[] = [];
    for (const type of types) {
      flattened.push(...flattenIntersectionTypes(type));
    }
    return flattened;
  }
  return [node];
}

/**
 * Extracts object literals and type references from an intersection.
 *
 * Returns `null` when:
 * - the node is not an intersection,
 * - the intersection has fewer than 2 parts,
 * - or any part is neither an object literal nor a type reference.
 *
 * @example
 * // Given `type A = Base & { foo: string };`
 * // result.extendsTypes -> [Base], result.objectTypes -> [{ foo: string }]
 */
export function analyzeIntersectionTypes(
  intersectionNode: TSESTree.Node
): IntersectionAnalysis | null {
  if (intersectionNode.type !== AST_NODE_TYPES.TSIntersectionType) {
    return null;
  }

  const flattenedTypes = flattenIntersectionTypes(intersectionNode);
  if (flattenedTypes.length < 2) {
    return null;
  }

  let objectType: TSESTree.TSTypeLiteral | null = null;
  const objectTypes: TSESTree.TSTypeLiteral[] = [];
  const extendsTypes: TSESTree.TSTypeReference[] = [];

  for (const type of flattenedTypes) {
    if (isObjectType(type)) {
      objectTypes.push(type);
      if (objectType === null) objectType = type;
    } else if (isTypeReference(type)) {
      extendsTypes.push(type);
    } else {
      return null;
    }
  }

  if (objectTypes.length === 0 && extendsTypes.length === 0) {
    return null;
  }

  return {
    objectTypes,
    extendsTypes,
    objectType,
  };
}

/**
 * Gets the full text for a type reference node, including type arguments.
 *
 * @example
 * // `Foo` -> "Foo"
 * // `Foo.Bar` -> "Foo.Bar"
 * // `Foo<string>` -> "Foo<string>"
 */
export function getTypeName(
  node: TSESTree.TSTypeReference,
  sourceCode: SourceCode
): string | null {
  return sourceCode.getText(node);
}

/**
 * Creates a lightweight string representation of an intersection.
 * Object literals are rendered as `{ ... }` or `{}`.
 *
 * @example
 * // `A & { foo: string } & {}`
 * // -> ["A", "{ ... }", "{}"]
 */
export function collectIntersectionParts(
  node: TSESTree.Node,
  sourceCode: SourceCode
): string[] {
  const parts: string[] = [];

  function visit(current: TSESTree.Node): void {
    if (current.type === AST_NODE_TYPES.TSIntersectionType) {
      for (const type of current.types) {
        visit(type);
      }
      return;
    }

    if (isTypeReference(current)) {
      const name = getTypeName(current, sourceCode);
      if (name !== null) parts.push(name);
      return;
    }

    if (isObjectType(current)) {
      const hasMembers = current.members && current.members.length > 0;
      parts.push(hasMembers ? "{ ... }" : "{}");
    }
  }

  visit(node);
  return parts;
}

/**
 * Returns the original source text for an object literal type, or `{}` if none.
 */
export function getObjectTypeLiteralText(
  objectType: TSESTree.TSTypeLiteral | null,
  sourceCode: SourceCode
): string {
  return objectType ? getTypeText(objectType, sourceCode) : "{}";
}

/**
 * Re-indents and concatenates type literal members into a consistent block.
 *
 * This preserves all member kinds (properties, methods, call/construct
 * signatures, index signatures) and keeps the original order.
 */
function formatMergedMembers(
  members: TSESTree.TypeElement[],
  baseIndent: string,
  sourceCode: SourceCode
): string {
  const formattedMembers: string[] = [];

  for (const member of members) {
    const memberText = getTypeText(member, sourceCode);
    const memberLines = memberText.split("\n");
    const memberIndentLength = getBaseIndent(member, sourceCode).length;

    const nonEmptyLines = memberLines.filter((line) => line.trim());
    if (nonEmptyLines.length === 0) continue;

    const reindentedLines = memberLines.map((line, index) => {
      if (!line.trim()) return "";
      const lineIndentInText = line.match(/^\s*/)?.[0] || "";
      const content = line.slice(lineIndentInText.length);
      const lineIndentLength =
        index === 0 ? memberIndentLength : lineIndentInText.length;
      const relativeIndent = Math.max(0, lineIndentLength - memberIndentLength);
      const newIndent = baseIndent.length + 2 + relativeIndent;
      return " ".repeat(Math.max(0, newIndent)) + content;
    });

    formattedMembers.push(reindentedLines.join("\n"));
  }

  return formattedMembers.join("\n");
}

/**
 * Builds a merged object literal string from multiple object types.
 *
 * The resulting text is formatted to match the indentation of the parent node and
 * includes all member kinds (properties, methods, call/construct signatures,
 * index signatures).
 *
 * @example
 * // `{ a: string } & { b: number }` -> `{\n  a: string;\n  b: number;\n}`
 */
export function buildMergedObjectTypeLiteralText(
  node: TSESTree.Node,
  objectTypes: TSESTree.TSTypeLiteral[],
  sourceCode: SourceCode
): string {
  if (objectTypes.length === 0) {
    return "{}";
  }

  const mergedMembers: TSESTree.TypeElement[] = [];
  for (const type of objectTypes) {
    if (!type.members) continue;
    for (const member of type.members) {
      mergedMembers.push(member);
    }
  }

  if (mergedMembers.length === 0) {
    return "{}";
  }

  const baseIndent = getBaseIndent(node, sourceCode);
  const membersContent = formatMergedMembers(
    mergedMembers,
    baseIndent,
    sourceCode
  );
  return `{\n${membersContent}\n${baseIndent}}`;
}
