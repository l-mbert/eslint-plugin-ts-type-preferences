import preferInterfaceExtends from "./rules/prefer-interface-extends-over-type-intersection";
import preferMergedTypeLiteral from "./rules/prefer-merged-type-literal-over-intersection";

const rules = {
  "prefer-interface-extends-over-type-intersection": preferInterfaceExtends,
  "prefer-merged-type-literal-over-intersection": preferMergedTypeLiteral,
};

const plugin = {
  rules,
};

// Create configs that reference the plugin object
const configs = {
  recommended: {
    plugins: {
      "ts-type-preferences": plugin,
    },
    rules: {
      "ts-type-preferences/prefer-interface-extends-over-type-intersection":
        "error",
      "ts-type-preferences/prefer-merged-type-literal-over-intersection":
        "error",
    },
  },
};

// Extend the type of plugin to include configs property for API compatibility
type PluginWithConfigs = typeof plugin & { configs: typeof configs };
const pluginWithConfigs: PluginWithConfigs = Object.assign({}, plugin, {
  configs,
});

export { rules, configs };
export default pluginWithConfigs;
