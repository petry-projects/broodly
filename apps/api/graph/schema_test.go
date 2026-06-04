package graph_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/vektah/gqlparser/v2"
	"github.com/vektah/gqlparser/v2/ast"
)

func loadSchema(t *testing.T) *ast.Schema {
	t.Helper()

	schemaDir := filepath.Join("schema")
	entries, err := os.ReadDir(schemaDir)
	if err != nil {
		t.Fatalf("failed to read schema directory: %v", err)
	}

	var sources []*ast.Source
	for _, entry := range entries {
		if filepath.Ext(entry.Name()) != ".graphql" {
			continue
		}
		path := filepath.Join(schemaDir, entry.Name())
		data, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("failed to read %s: %v", path, err)
		}
		sources = append(sources, &ast.Source{
			Name:  entry.Name(),
			Input: string(data),
		})
	}

	if len(sources) == 0 {
		t.Fatal("no .graphql schema files found")
	}

	schema, gqlErr := gqlparser.LoadSchema(sources...)
	if gqlErr != nil {
		t.Fatalf("schema parse error: %v", gqlErr)
	}
	return schema
}

// AC #1: Schema parses without errors
func TestSchemaParses(t *testing.T) {
	schema := loadSchema(t)
	if schema == nil {
		t.Fatal("schema is nil after successful parse")
	}
}

// AC #2: Recommendation type has all non-nullable contract fields
func TestRecommendationContractFields(t *testing.T) {
	schema := loadSchema(t)

	rec := schema.Types["Recommendation"]
	if rec == nil {
		t.Fatal("Recommendation type not found in schema")
	}

	requiredFields := map[string]string{
		"action":          "String",
		"rationale":       "String",
		"confidenceLevel": "Float",
		"confidenceType":  "ConfidenceType",
		"fallbackAction":  "String",
	}

	for fieldName, expectedType := range requiredFields {
		field := rec.Fields.ForName(fieldName)
		if field == nil {
			t.Errorf("Recommendation missing required field: %s", fieldName)
			continue
		}
		if field.Type.NonNull == false {
			t.Errorf("Recommendation.%s must be non-nullable", fieldName)
		}
		if field.Type.Elem != nil {
			if field.Type.Elem.NamedType != expectedType {
				t.Errorf("Recommendation.%s expected type %s, got %s", fieldName, expectedType, field.Type.Elem.NamedType)
			}
		} else {
			if field.Type.NamedType != expectedType {
				t.Errorf("Recommendation.%s expected type %s, got %s", fieldName, expectedType, field.Type.NamedType)
			}
		}
	}

	// evidenceContext should exist (nullable JSON is acceptable per AC)
	ecField := rec.Fields.ForName("evidenceContext")
	if ecField == nil {
		t.Error("Recommendation missing evidenceContext field")
	}
}

// AC #3: ConfidenceType enum has exactly six values
func TestConfidenceTypeEnum(t *testing.T) {
	schema := loadSchema(t)

	ct := schema.Types["ConfidenceType"]
	if ct == nil {
		t.Fatal("ConfidenceType enum not found in schema")
	}
	if ct.Kind != ast.Enum {
		t.Fatalf("ConfidenceType should be an enum, got %s", ct.Kind)
	}

	expectedValues := []string{
		"HIGH",
		"MODERATE",
		"LOW",
		"INSUFFICIENT_DATA",
		"CONFLICTING_EVIDENCE",
		"LIMITED_EXPERIENCE",
	}

	if len(ct.EnumValues) != len(expectedValues) {
		t.Fatalf("ConfidenceType expected %d values, got %d", len(expectedValues), len(ct.EnumValues))
	}

	valueSet := make(map[string]bool)
	for _, v := range ct.EnumValues {
		valueSet[v.Name] = true
	}

	for _, expected := range expectedValues {
		if !valueSet[expected] {
			t.Errorf("ConfidenceType missing enum value: %s", expected)
		}
	}
}

// AC #4: All eight core MVP types exist
func TestCoreTypesExist(t *testing.T) {
	schema := loadSchema(t)

	coreTypes := []string{
		"User",
		"Apiary",
		"Hive",
		"Inspection",
		"Observation",
		"Recommendation",
		"Task",
		"AuditEvent",
	}

	for _, typeName := range coreTypes {
		if schema.Types[typeName] == nil {
			t.Errorf("core type %s not found in schema", typeName)
		}
	}
}

// AC #5: Query type exposes all required fields
func TestQueryFields(t *testing.T) {
	schema := loadSchema(t)

	query := schema.Types["Query"]
	if query == nil {
		t.Fatal("Query type not found in schema")
	}

	requiredQueries := []string{
		"me",
		"apiaries",
		"apiary",
		"hives",
		"hive",
		"inspections",
		"inspection",
		"tasks",
		"recommendations",
	}

	for _, q := range requiredQueries {
		if query.Fields.ForName(q) == nil {
			t.Errorf("Query missing required field: %s", q)
		}
	}
}

// AC #6: Mutation type exposes all required fields
func TestMutationFields(t *testing.T) {
	schema := loadSchema(t)

	mutation := schema.Types["Mutation"]
	if mutation == nil {
		t.Fatal("Mutation type not found in schema")
	}

	requiredMutations := []string{
		"createApiary",
		"updateApiary",
		"deleteApiary",
		"createHive",
		"updateHive",
		"deleteHive",
		"startInspection",
		"completeInspection",
		"addObservation",
		"deferTask",
		"completeTask",
	}

	for _, m := range requiredMutations {
		if mutation.Fields.ForName(m) == nil {
			t.Errorf("Mutation missing required field: %s", m)
		}
	}
}

// AC #9: ErrorExtensions type has correct fields
func TestErrorExtensionsType(t *testing.T) {
	schema := loadSchema(t)

	errType := schema.Types["ErrorExtensions"]
	if errType == nil {
		t.Fatal("ErrorExtensions type not found in schema")
	}

	requiredFields := map[string]string{
		"code":      "String",
		"message":   "String",
		"retryable": "Boolean",
	}

	for fieldName, expectedType := range requiredFields {
		field := errType.Fields.ForName(fieldName)
		if field == nil {
			t.Errorf("ErrorExtensions missing field: %s", fieldName)
			continue
		}
		if field.Type.NonNull == false {
			t.Errorf("ErrorExtensions.%s must be non-nullable", fieldName)
		}
		if field.Type.NamedType != expectedType {
			t.Errorf("ErrorExtensions.%s expected type %s, got %s", fieldName, expectedType, field.Type.NamedType)
		}
	}
}
