import { RuleTester } from "@typescript-eslint/rule-tester";
import parser from "@typescript-eslint/parser";
import rule from "./prefer-interface-extends-over-type-intersection";

const ruleTester = new RuleTester({
  languageOptions: {
    parser,
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
    },
  },
});

ruleTester.run("prefer-interface-extends-over-type-intersection", rule, {
  valid: [
    {
      name: "Interface extends interface",
      code: `
        interface A {}
        interface B extends A {}
      `,
    },
    {
      name: "Interface extends type",
      code: `
        type A = {};
        interface B extends A {}
      `,
    },
    {
      name: "Multiple object types with mergeObjects: false",
      code: `
        type Base = {};
        type A = Base & {
          fieldA: string;
        } & {
          fieldB: number;
        };
      `,
      options: [{ mergeObjects: false }],
    },
    {
      name: "Intersection with unsupported type",
      code: `
        type Base = {};
        type A = Base & string;
      `,
    },
  ],
  invalid: [
    {
      name: "Type intersection (type & {})",
      code: `
        type A = {};
        type B = A & {};
      `,
      output: `
        type A = {};
        interface B extends A {}
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "B",
            extendsName: "A",
            extendsNameIntersection: "A & {}",
          },
        },
      ],
    },
    {
      name: "Type intersection (type & { ... fields ... })",
      code: `
        type A = {};
        type B = A & {
          fieldA: string;
          fieldB: number;
          fieldC: () => void;
        };
      `,
      output: `
        type A = {};
        interface B extends A {
          fieldA: string;
          fieldB: number;
          fieldC: () => void;
        }
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "B",
            extendsName: "A",
            extendsNameIntersection: "A & { ... }",
          },
        },
      ],
    },
    {
      name: "Type intersection with methods and signatures",
      code: `
        type Base = {};
        type A = Base & {
          fieldA: string;
          methodA(value: string): void;
          [key: string]: number;
          (): void;
        };
      `,
      output: `
        type Base = {};
        interface A extends Base {
          fieldA: string;
          methodA(value: string): void;
          [key: string]: number;
          (): void;
        }
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "A",
            extendsName: "Base",
            extendsNameIntersection: "Base & { ... }",
          },
        },
      ],
    },
    {
      name: "Type intersection with construct signatures and modifiers",
      code: `
        type Base = {};
        type A = Base & {
          readonly fieldA?: string;
          new (value: string): Date;
        };
      `,
      output: `
        type Base = {};
        interface A extends Base {
          readonly fieldA?: string;
          new (value: string): Date;
        }
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "A",
            extendsName: "Base",
            extendsNameIntersection: "Base & { ... }",
          },
        },
      ],
    },
    {
      name: "Type intersection with type arguments (type & { ... fields ... })",
      code: `
        type Base<T> = { value: T };
        type A = Base<string> & {
          fieldA: number;
        };
      `,
      output: `
        type Base<T> = { value: T };
        interface A extends Base<string> {
          fieldA: number;
        }
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "A",
            extendsName: "Base<string>",
            extendsNameIntersection: "Base<string> & { ... }",
          },
        },
      ],
    },
    {
      name: "Exported generic type alias",
      code: `
        type Base = {};
        export type Box<T extends Base = Base> = Base & {
          value: T;
        };
      `,
      output: `
        type Base = {};
        export interface Box<T extends Base = Base> extends Base {
          value: T;
        }
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "Box",
            extendsName: "Base",
            extendsNameIntersection: "Base & { ... }",
          },
        },
      ],
    },
    {
      name: "Type intersection with qualified name (type & { ... fields ... })",
      code: `
        type A = Namespace.Base & {
          fieldA: number;
        };
      `,
      output: `
        interface A extends Namespace.Base {
          fieldA: number;
        }
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "A",
            extendsName: "Namespace.Base",
            extendsNameIntersection: "Namespace.Base & { ... }",
          },
        },
      ],
    },

    {
      name: "Type intersection ({} & type)",
      code: `
        type A = {};
        type B = {} & A;
      `,
      output: `
        type A = {};
        interface B extends A {}
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "B",
            extendsName: "A",
            extendsNameIntersection: "{} & A",
          },
        },
      ],
    },
    {
      name: "Type intersection ({ ... fields ... } & type)",
      code: `
        type A = {};
        type B = {
          fieldA: string;
          fieldB: number;
        } & A;
      `,
      output: `
        type A = {};
        interface B extends A {
          fieldA: string;
          fieldB: number;
        }
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "B",
            extendsName: "A",
            extendsNameIntersection: "{ ... } & A",
          },
        },
      ],
    },

    {
      name: "Type intersection (type & type)",
      code: `
        type A = {};
        type B = {};
        type C = A & B;
      `,
      output: `
        type A = {};
        type B = {};
        interface C extends A, B {}
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "C",
            extendsName: "A, B",
            extendsNameIntersection: "A & B",
          },
        },
      ],
    },
    {
      name: "Type intersection (type & type & type)",
      code: `
        type A = {};
        type B = {};
        type C = {};
        type D = A & B & C;
      `,
      output: `
        type A = {};
        type B = {};
        type C = {};
        interface D extends A, B, C {}
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "D",
            extendsName: "A, B, C",
            extendsNameIntersection: "A & B & C",
          },
        },
      ],
    },
    {
      name: "Type intersection with mergeObjects: true (type & { ... fields ... } & { ... fields ... })",
      code: `
        type A = {};
        type B = A & {
          fieldA: string;
          fieldB: number;
        } & {
          fieldC: boolean;
        };
      `,
      output: `
        type A = {};
        interface B extends A {
          fieldA: string;
          fieldB: number;
          fieldC: boolean;
        };
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "B",
            extendsName: "A",
            extendsNameIntersection: "A & { ... } & { ... }",
          },
        },
      ],
    },
    {
      name: "Type intersection ({ ... fields ... } & type & { ... fields ... })",
      code: `
        type A = {};
        type B = {
          fieldA: string;
          fieldB: number;
        } & A & {
          fieldC: boolean;
        };
      `,
      output: `
        type A = {};
        interface B extends A {
          fieldA: string;
          fieldB: number;
          fieldC: boolean;
        };
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "B",
            extendsName: "A",
            extendsNameIntersection: "{ ... } & A & { ... }",
          },
        },
      ],
    },
    {
      name: "Type intersection (type & { ... fields ... } & type) with mergeObjects: false",
      code: `
        type A = {};
        type B = {};
        type C = A & {
          fieldA: string;
        } & B;
      `,
      output: `
        type A = {};
        type B = {};
        interface C extends A, B {
          fieldA: string;
        }
      `,
      options: [{ mergeObjects: false }],
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "C",
            extendsName: "A, B",
            extendsNameIntersection: "A & { ... } & B",
          },
        },
      ],
    },

    {
      name: "Type intersection (type & {} & type)",
      code: `
        type A = {};
        type B = {};
        type D = A & {} & B;
      `,
      output: `
        type A = {};
        type B = {};
        interface D extends A, B {}
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "D",
            extendsName: "A, B",
            extendsNameIntersection: "A & {} & B",
          },
        },
      ],
    },
    {
      name: "Type intersection multiline (type & type & {})",
      code: `
        type A = {};
        type B = {};
        type C = {};
        type D = A 
                 & B 
                 & {};
      `,
      output: `
        type A = {};
        type B = {};
        type C = {};
        interface D extends A, B {}
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "D",
            extendsName: "A, B",
            extendsNameIntersection: "A & B & {}",
          },
        },
      ],
    },
    {
      name: "Type intersection multiline (type & {} & type)",
      code: `
        type A = {};
        type B = {};
        type C = {};
        type D = A 
                 & {}
                 & B;
      `,
      output: `
        type A = {};
        type B = {};
        type C = {};
        interface D extends A, B {}
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "D",
            extendsName: "A, B",
            extendsNameIntersection: "A & {} & B",
          },
        },
      ],
    },
    {
      name: "Type intersection with fields (type & { ... fields ... })",
      code: `
        type A = {};
        type B = A & {
          fieldA: string;
          fieldB: number;
        }
      `,
      output: `
        type A = {};
        interface B extends A {
          fieldA: string;
          fieldB: number;
        }
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "B",
            extendsName: "A",
            extendsNameIntersection: "A & { ... }",
          },
        },
      ],
    },
    {
      name: "Type intersection with fields (type & { ... fields ... } & type)",
      code: `
        type A = {};
        type B = {};
        type C = A & {
          fieldA: string;
          fieldB: number;
        } & B;
      `,
      output: `
        type A = {};
        type B = {};
        interface C extends A, B {
          fieldA: string;
          fieldB: number;
        }
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "C",
            extendsName: "A, B",
            extendsNameIntersection: "A & { ... } & B",
          },
        },
      ],
    },
    {
      name: "Type intersection with interface (type & interface)",
      code: `
        type A = {};
        interface B {
          fieldA: string;
          fieldB: number;
        }
        type C = A & B;
      `,
      output: `
        type A = {};
        interface B {
          fieldA: string;
          fieldB: number;
        }
        interface C extends A, B {}
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "C",
            extendsName: "A, B",
            extendsNameIntersection: "A & B",
          },
        },
      ],
    },
    {
      name: "Type intersection with interface (interface & type)",
      code: `
        interface A {}
        type B = {
          fieldA: string;
          fieldB: number;
        };
        type C = A & B;
      `,
      output: `
        interface A {}
        type B = {
          fieldA: string;
          fieldB: number;
        };
        interface C extends A, B {}
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "C",
            extendsName: "A, B",
            extendsNameIntersection: "A & B",
          },
        },
      ],
    },
    {
      name: "Type intersection with interface (interface & interface)",
      code: `
        interface A {}
        interface B {
          fieldA: string;
          fieldB: number;
        }
        type C = A & B;
      `,
      output: `
        interface A {}
        interface B {
          fieldA: string;
          fieldB: number;
        }
        interface C extends A, B {}
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "C",
            extendsName: "A, B",
            extendsNameIntersection: "A & B",
          },
        },
      ],
    },
    {
      name: "Type intersection with interface (interface & interface & interface)",
      code: `
        interface A {}
        interface B {
          fieldA: string;
          fieldB: number;
        }
        interface C {}
        type D = A & B & C;
      `,
      output: `
        interface A {}
        interface B {
          fieldA: string;
          fieldB: number;
        }
        interface C {}
        interface D extends A, B, C {}
      `,
      errors: [
        {
          messageId: "preferInterfaceExtends",
          data: {
            name: "D",
            extendsName: "A, B, C",
            extendsNameIntersection: "A & B & C",
          },
        },
      ],
    },
  ],
});
