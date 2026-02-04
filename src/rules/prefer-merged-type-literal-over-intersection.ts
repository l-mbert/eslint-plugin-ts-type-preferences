import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import {
  analyzeIntersectionTypes,
  buildMergedObjectTypeLiteralText,
} from "./utils/intersection-utils";

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/l-mbert/eslint-plugin-ts-type-preferences/blob/main/docs/rules/${name}.md`
);

type MessageIds = "preferMergedTypeLiteral";

type Options = [];

export default createRule<Options, MessageIds>({
  name: "prefer-merged-type-literal-over-intersection",
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer merging object intersections into a single type literal",
    },
    messages: {
      preferMergedTypeLiteral:
        "Prefer merging object intersections into a single type literal instead of using '&'.",
    },
    fixable: "code",
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const { sourceCode } = context;

    return {
      TSTypeAliasDeclaration(node: TSESTree.TSTypeAliasDeclaration) {
        if (node.typeAnnotation === null || node.typeAnnotation === undefined) {
          return;
        }

        const result = analyzeIntersectionTypes(node.typeAnnotation);
        if (!result) {
          return;
        }

        if (result.extendsTypes.length > 0) {
          return;
        }

        if (result.objectTypes.length < 2) {
          return;
        }

        const typeName = node.id.name;
        const typeParamsText = node.typeParameters
          ? sourceCode.getText(node.typeParameters)
          : "";
        const declarePrefix = node.declare ? "declare " : "";
        const mergedBodyText = buildMergedObjectTypeLiteralText(
          node,
          result.objectTypes,
          sourceCode
        );

        context.report({
          node,
          messageId: "preferMergedTypeLiteral",
          fix(fixer) {
            const textAfterNode = sourceCode.getText().slice(node.range[1]);
            const firstChars = textAfterNode.replace(/^\s+/, "").slice(0, 1);
            const hasSemicolon =
              result.objectTypes.length > 1 || firstChars === ";";
            const semicolon = hasSemicolon ? ";" : "";
            const replacementText = `${declarePrefix}type ${typeName}${typeParamsText} = ${mergedBodyText}${semicolon}`;

            return fixer.replaceText(node, replacementText);
          },
        });
      },
    };
  },
});
