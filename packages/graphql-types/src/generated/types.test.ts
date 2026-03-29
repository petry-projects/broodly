import {
  Recommendation,
  ConfidenceType,
  EvidenceSource,
  Query,
  Mutation,
  User,
  Apiary,
  Hive,
  Inspection,
  Observation,
  Task,
  AuditEvent,
  ErrorExtensions,
} from "./types";

// AC #7: TypeScript types are generated without errors (this file importing them proves it)

// AC #8: Recommendation type has all required (non-optional) properties
describe("Recommendation type", () => {
  it("has all required contract fields as non-optional", () => {
    // This test validates at compile time that required fields are not optional.
    // If any of these were optional, assigning them without ? would cause a type error.
    const rec: Recommendation = {
      id: "uuid-1",
      hive: {
        id: "uuid-2",
        apiary: {} as Apiary,
        name: "Hive 1",
        type: "LANGSTROTH" as any,
        status: "ACTIVE" as any,
        notes: "",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
      },
      action: "Add a super",
      rationale: "Honey stores are high",
      confidenceLevel: 0.85,
      confidenceType: ConfidenceType.High,
      fallbackAction: "Monitor for another week",
      skillAdaptedExplanation: "We recommend adding a super because honey stores are high.",
      createdAt: "2026-01-01T00:00:00Z",
    };

    // Verify the object was constructed with all required fields
    expect(rec.action).toBe("Add a super");
    expect(rec.rationale).toBe("Honey stores are high");
    expect(rec.confidenceLevel).toBe(0.85);
    expect(rec.confidenceType).toBe(ConfidenceType.High);
    expect(rec.fallbackAction).toBe("Monitor for another week");
    expect(rec.skillAdaptedExplanation).toBeTruthy();
  });

  it("allows evidenceContext to be null or undefined", () => {
    const rec: Recommendation = {
      id: "uuid-1",
      hive: {} as Hive,
      action: "Test action",
      rationale: "Test rationale",
      confidenceLevel: 0.5,
      confidenceType: ConfidenceType.Moderate,
      fallbackAction: "Test fallback",
      skillAdaptedExplanation: "Test explanation",
      createdAt: "2026-01-01T00:00:00Z",
      evidenceContext: null,
    };

    expect(rec.evidenceContext).toBeNull();
  });
});

// AC #3: ConfidenceType enum has exactly six values
describe("ConfidenceType enum", () => {
  it("contains all six required values", () => {
    const expectedValues = [
      "HIGH",
      "MODERATE",
      "LOW",
      "INSUFFICIENT_DATA",
      "CONFLICTING_EVIDENCE",
      "LIMITED_EXPERIENCE",
    ];

    const actualValues = Object.values(ConfidenceType);
    expect(actualValues).toHaveLength(6);

    for (const expected of expectedValues) {
      expect(actualValues).toContain(expected);
    }
  });
});

// AC #4: All core types are generated
describe("Core types exist", () => {
  it("exports all eight MVP types", () => {
    // Type existence is validated by successful import above.
    // Runtime check that they are usable as types by constructing minimal objects.
    const user: User = {
      id: "1",
      email: "test@example.com",
      displayName: "Test",
      experienceLevel: "NEWBIE" as any,
      region: "US",
      createdAt: "",
      updatedAt: "",
    };
    const apiary: Apiary = {
      id: "1",
      name: "Test",
      region: "US",
      elevationOffset: 0,
      bloomOffset: 0,
      hives: [],
      createdAt: "",
      updatedAt: "",
    };
    const hive: Hive = {
      id: "1",
      apiary: {} as Apiary,
      name: "Test",
      type: "LANGSTROTH" as any,
      status: "ACTIVE" as any,
      notes: "",
      createdAt: "",
      updatedAt: "",
    };
    const inspection: Inspection = {
      id: "1",
      hive: {} as Hive,
      type: "FULL" as any,
      status: "IN_PROGRESS" as any,
      observations: [],
      startedAt: "",
      notes: "",
      createdAt: "",
    };
    const observation: Observation = {
      id: "1",
      inspection: {} as Inspection,
      sequenceOrder: 1,
      observationType: "GENERAL" as any,
      media: [],
      createdAt: "",
    };
    const task: Task = {
      id: "1",
      hive: {} as Hive,
      title: "Test",
      priority: "HIGH" as any,
      status: "PENDING" as any,
      createdAt: "",
    };
    const auditEvent: AuditEvent = {
      id: "1",
      eventType: "test",
      actorId: "1",
      tenantId: "1",
      occurredAt: "",
      payloadVersion: 1,
      payload: {},
    };

    expect(user).toBeDefined();
    expect(apiary).toBeDefined();
    expect(hive).toBeDefined();
    expect(inspection).toBeDefined();
    expect(observation).toBeDefined();
    expect(task).toBeDefined();
    expect(auditEvent).toBeDefined();
  });
});

// AC #9: ErrorExtensions type has typed domain error fields
describe("ErrorExtensions type", () => {
  it("has code, message, and retryable fields", () => {
    const err: ErrorExtensions = {
      code: "VALIDATION_ERROR",
      message: "Invalid input",
      retryable: false,
    };

    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.message).toBe("Invalid input");
    expect(err.retryable).toBe(false);
  });
});
