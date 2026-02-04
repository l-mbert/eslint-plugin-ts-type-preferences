import preferInterfaceExtends from "./rules/prefer-interface-extends-over-type-intersection";
import preferMergedTypeLiteral from "./rules/prefer-merged-type-literal-over-intersection";

export const rules = {
  "prefer-interface-extends-over-type-intersection": preferInterfaceExtends,
  "prefer-merged-type-literal-over-intersection": preferMergedTypeLiteral,
};

export const configs = {
  recommended: {
    plugins: ["prefer-interface-extends-over-type-intersection"],
    rules: {
      "prefer-interface-extends-over-type-intersection/prefer-interface-extends-over-type-intersection":
        "error",
      "prefer-interface-extends-over-type-intersection/prefer-merged-type-literal-over-intersection":
        "error",
    },
  },
};
