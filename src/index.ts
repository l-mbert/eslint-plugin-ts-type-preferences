import preferInterfaceExtends from "./rules/prefer-interface-extends-over-type-intersection";
import preferMergedTypeLiteral from "./rules/prefer-merged-type-literal-over-intersection";

export const rules = {
  "prefer-interface-extends-over-type-intersection": preferInterfaceExtends,
  "prefer-merged-type-literal-over-intersection": preferMergedTypeLiteral,
};

export const configs = {
  recommended: {
    plugins: ["ts-type-preferences"],
    rules: {
      "ts-type-preferences/prefer-interface-extends-over-type-intersection":
        "error",
      "ts-type-preferences/prefer-merged-type-literal-over-intersection":
        "error",
    },
  },
};
