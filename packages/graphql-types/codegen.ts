import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "../../apps/api/graph/schema/*.graphql",
  generates: {
    "src/generated/types.ts": {
      plugins: ["typescript"],
      config: {
        scalars: {
          JSON: "Record<string, unknown>",
          DateTime: "string",
          UUID: "string",
        },
        enumsAsTypes: false,
        avoidOptionals: {
          field: false,
          inputValue: false,
          object: false,
          defaultValue: false,
        },
        strictScalars: true,
      },
    },
  },
};

export default config;
