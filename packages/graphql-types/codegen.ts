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
    "src/generated/operations.ts": {
      documents: "src/operations/**/*.graphql",
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-urql",
      ],
      config: {
        scalars: {
          JSON: "Record<string, unknown>",
          DateTime: "string",
          UUID: "string",
        },
        strictScalars: true,
        withHooks: true,
        urqlImportFrom: "urql",
      },
    },
  },
};

export default config;
