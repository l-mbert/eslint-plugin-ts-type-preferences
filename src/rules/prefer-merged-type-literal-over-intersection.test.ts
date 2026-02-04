import { RuleTester } from "@typescript-eslint/rule-tester";
import parser from "@typescript-eslint/parser";
import rule from "./prefer-merged-type-literal-over-intersection";

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
  },
});

ruleTester.run("prefer-merged-type-literal-over-intersection", rule, {
  valid: [
    {
      name: "Intersection includes a type reference",
      code: `
        type Base = {};
        type A = Base & {
          fieldA: string;
        };
      `,
    },
    {
      name: "Single object type",
      code: `
        type A = {
          fieldA: string;
        };
      `,
    },
    {
      name: "Intersection with unsupported type",
      code: `
        type A = { fieldA: string } & (string | number);
      `,
    },
  ],
  invalid: [
    {
      name: "Type intersection ({ ... fields ... } & { ... fields ... })",
      code: `
        type A = {
          fieldA: string;
          fieldB: number;
        } & {
          fieldC: boolean;
        };
      `,
      output: `
        type A = {
          fieldA: string;
          fieldB: number;
          fieldC: boolean;
        };
      `,
      errors: [
        {
          messageId: "preferMergedTypeLiteral",
        },
      ],
    },
    {
      name: "Declared generic type alias preserves modifiers",
      code: `
        declare type Flags<T> = { a: T } & { b: T };
      `,
      output: `
        declare type Flags<T> = {
          a: T
          b: T
        };
      `,
      errors: [
        {
          messageId: "preferMergedTypeLiteral",
        },
      ],
    },
    {
      name: "Type intersection ({} & { ... fields ... })",
      code: `
        type A = {} & {
          fieldA: string;
        };
      `,
      output: `
        type A = {
          fieldA: string;
        };
      `,
      errors: [
        {
          messageId: "preferMergedTypeLiteral",
        },
      ],
    },
    {
      name: "Type intersection ({} & {})",
      code: `
        type A = {} & {};
      `,
      output: `
        type A = {};
      `,
      errors: [
        {
          messageId: "preferMergedTypeLiteral",
        },
      ],
    },
    {
      name: "Type intersection ({ ... nested fields ... } & { ... fields ... })",
      code: `
        type A = {
          fieldA: string;
          fieldB: number;
          nestedA: {
            fieldC: string;
            fieldD: number;
          };
        } & {
          fieldE: boolean;
          fieldF: () => void;
        };
      `,
      output: `
        type A = {
          fieldA: string;
          fieldB: number;
          nestedA: {
            fieldC: string;
            fieldD: number;
          };
          fieldE: boolean;
          fieldF: () => void;
        };
      `,
      errors: [
        {
          messageId: "preferMergedTypeLiteral",
        },
      ],
    },
    {
      name: "Nested intersection (object & object) & object",
      code: `
        type A = ({
          fieldA: string;
        } & {
          fieldB: number;
        }) & {
          fieldC: boolean;
        };
      `,
      output: `
        type A = {
          fieldA: string;
          fieldB: number;
          fieldC: boolean;
        };
      `,
      errors: [
        {
          messageId: "preferMergedTypeLiteral",
        },
      ],
    },
    {
      name: "Type intersection with methods and signatures",
      code: `
        type A = {
          fieldA: string;
          methodA(value: string): void;
          [key: string]: number;
          (): void;
        } & {
          fieldB: number;
          methodB(): string;
        };
      `,
      output: `
        type A = {
          fieldA: string;
          methodA(value: string): void;
          [key: string]: number;
          (): void;
          fieldB: number;
          methodB(): string;
        };
      `,
      errors: [
        {
          messageId: "preferMergedTypeLiteral",
        },
      ],
    },
    {
      name: "Type intersection with construct signatures and modifiers",
      code: `
        type A = {
          readonly fieldA?: string;
          new (value: string): Date;
        } & {
          fieldB: number;
          readonly fieldC?: boolean;
          new (value: number): Error;
        };
      `,
      output: `
        type A = {
          readonly fieldA?: string;
          new (value: string): Date;
          fieldB: number;
          readonly fieldC?: boolean;
          new (value: number): Error;
        };
      `,
      errors: [
        {
          messageId: "preferMergedTypeLiteral",
        },
      ],
    },
    {
      name: "Type intersection ({ ... fields ... } & { ... fields ... } & { ... fields ... })",
      code: `
        type A = {
          fieldA: string;
          fieldB: number;
          fieldC: boolean;
        } & {
          fieldD: string;
        } & {
          fieldE: number;
          fieldF: () => void;
        };
      `,
      output: `
        type A = {
          fieldA: string;
          fieldB: number;
          fieldC: boolean;
          fieldD: string;
          fieldE: number;
          fieldF: () => void;
        };
      `,
      errors: [
        {
          messageId: "preferMergedTypeLiteral",
        },
      ],
    },
  ],
});
