import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import {
  analyzeIntersectionTypes,
  buildMergedObjectTypeLiteralText,
  collectIntersectionParts,
  getObjectTypeLiteralText,
  getTypeName,
} from "./utils/intersection-utils";

const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/l-mbert/eslint-plugin-ts-type-preferences/blob/main/docs/rules/${name}.md`
);

type MessageIds = "preferInterfaceExtends";

type Options = [
  {
    mergeObjects?: boolean;
  }
];

export default createRule<Options, MessageIds>({
  name: "prefer-interface-extends-over-type-intersection",
  meta: {
    type: "suggestion",
    docs: {
      description: "Prefer interface extends over type intersection",
    },
    messages: {
      preferInterfaceExtends:
        "Prefer using 'interface {{name}} extends {{extendsName}}' instead of 'type {{name}} = {{extendsNameIntersection}}'",
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          mergeObjects: {
            type: "boolean",
            description:
              "Whether to merge multiple object types into a single interface. Defaults to true.",
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ mergeObjects: true }],
  create(context) {
    const { sourceCode } = context;
    const options = context.options[0] ?? {};
    const mergeObjects = options.mergeObjects ?? true;

    return {
      TSTypeAliasDeclaration(node: TSESTree.TSTypeAliasDeclaration) {
        if (node.typeAnnotation === null || node.typeAnnotation === undefined) {
          return;
        }

        // Use different logic based on mergeObjects option
        const result = analyzeIntersectionTypes(node.typeAnnotation);

        if (!result) {
          return;
        }

        if (!mergeObjects && result.objectTypes.length > 1) {
          return;
        }

        if (result.extendsTypes.length === 0) {
          return;
        }

        const typeName = node.id.name;

        const extendsNames = result.extendsTypes
          .map((type) => getTypeName(type, sourceCode))
          .filter((name): name is string => name !== null);

        const extendsClause = extendsNames.join(", ");

        const intersectionNode =
          node.typeAnnotation as TSESTree.TSIntersectionType;
        const extendsClauseIntersection = collectIntersectionParts(
          intersectionNode,
          sourceCode
        ).join(" & ");

        const interfaceBodyText = mergeObjects
          ? buildMergedObjectTypeLiteralText(
              node,
              result.objectTypes,
              sourceCode
            )
          : getObjectTypeLiteralText(result.objectType, sourceCode);

        context.report({
          node,
          messageId: "preferInterfaceExtends",
          data: {
            name: typeName,
            extendsName: extendsClause,
            extendsNameIntersection: extendsClauseIntersection,
          },
          fix(fixer) {
            const extendsPart = extendsClause
              ? ` extends ${extendsClause}`
              : "";
            // Check if the original declaration ends with a semicolon
            const textAfterNode = sourceCode.getText().slice(node.range[1]);
            const firstChars = textAfterNode.replace(/^\s+/, "").slice(0, 1);
            // Check if text after node starts with semicolon
            // If merging objects and we have multiple object types, likely had a semicolon
            const hasSemicolon =
              (mergeObjects && result.objectTypes.length > 1) ||
              firstChars === ";";
            const semicolon = hasSemicolon ? ";" : "";
            const replacementText = `interface ${typeName}${extendsPart} ${interfaceBodyText}${semicolon}`;

            return fixer.replaceText(node, replacementText);
          },
        });
      },
    };
  },
});
