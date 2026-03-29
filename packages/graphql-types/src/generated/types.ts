export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: string; output: string; }
  /** Base schema: custom scalars, error interface, and root type extensions. */
  JSON: { input: Record<string, unknown>; output: Record<string, unknown>; }
  UUID: { input: string; output: string; }
};

export type AddObservationInput = {
  inspectionId: Scalars['UUID']['input'];
  observationType: ObservationType;
  rawVoiceUrl?: InputMaybe<Scalars['String']['input']>;
  structuredData?: InputMaybe<Scalars['JSON']['input']>;
  transcription?: InputMaybe<Scalars['String']['input']>;
  transcriptionConfidence?: InputMaybe<Scalars['Float']['input']>;
};

/** A beeyard location containing one or more hives. */
export type Apiary = {
  __typename?: 'Apiary';
  bloomOffset: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  elevationOffset: Scalars['Float']['output'];
  hives: Array<Hive>;
  id: Scalars['UUID']['output'];
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  name: Scalars['String']['output'];
  region: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

/** Immutable audit event for compliance and traceability. */
export type AuditEvent = {
  __typename?: 'AuditEvent';
  actorId: Scalars['UUID']['output'];
  eventType: Scalars['String']['output'];
  id: Scalars['UUID']['output'];
  occurredAt: Scalars['DateTime']['output'];
  payload: Scalars['JSON']['output'];
  payloadVersion: Scalars['Int']['output'];
  tenantId: Scalars['UUID']['output'];
};

/** Confidence classification for AI-generated recommendations. */
export enum ConfidenceType {
  ConflictingEvidence = 'CONFLICTING_EVIDENCE',
  High = 'HIGH',
  InsufficientData = 'INSUFFICIENT_DATA',
  LimitedExperience = 'LIMITED_EXPERIENCE',
  Low = 'LOW',
  Moderate = 'MODERATE'
}

export type CreateApiaryInput = {
  bloomOffset?: InputMaybe<Scalars['Int']['input']>;
  elevationOffset?: InputMaybe<Scalars['Float']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
  region: Scalars['String']['input'];
};

export type CreateHiveInput = {
  apiaryId: Scalars['UUID']['input'];
  name: Scalars['String']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  type: HiveType;
};

export type DeferTaskInput = {
  reason?: InputMaybe<Scalars['String']['input']>;
};

/**
 * Standard error extensions returned in GraphQL error responses.
 * Every domain error includes a machine-readable code, a human message, and retryability.
 */
export type ErrorExtensions = {
  __typename?: 'ErrorExtensions';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  retryable: Scalars['Boolean']['output'];
};

/** Structured reference to an evidence source supporting a recommendation. */
export type EvidenceSource = {
  __typename?: 'EvidenceSource';
  relevanceScore: Scalars['Float']['output'];
  sourceId: Scalars['UUID']['output'];
  sourceType: Scalars['String']['output'];
  summary: Scalars['String']['output'];
};

/** Experience level of the beekeeper. */
export enum ExperienceLevel {
  Amateur = 'AMATEUR',
  Newbie = 'NEWBIE',
  Sideliner = 'SIDELINER'
}

export type ExportDataInput = {
  format: ExportFormat;
};

/** Export file format. */
export enum ExportFormat {
  Csv = 'CSV',
  Json = 'JSON'
}

/** An export job that generates a downloadable file. */
export type ExportJob = {
  __typename?: 'ExportJob';
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  downloadUrl?: Maybe<Scalars['String']['output']>;
  format: ExportFormat;
  id: Scalars['UUID']['output'];
  status: ExportStatus;
};

/** Status of an export job. */
export enum ExportStatus {
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  Pending = 'PENDING',
  Processing = 'PROCESSING'
}

/** A single hive within an apiary. */
export type Hive = {
  __typename?: 'Hive';
  apiary: Apiary;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['UUID']['output'];
  name: Scalars['String']['output'];
  notes: Scalars['String']['output'];
  status: HiveStatus;
  type: HiveType;
  updatedAt: Scalars['DateTime']['output'];
};

/** Current operational status of a hive. */
export enum HiveStatus {
  Active = 'ACTIVE',
  Dead = 'DEAD',
  Inactive = 'INACTIVE',
  Sold = 'SOLD'
}

/** Hive type classification. */
export enum HiveType {
  Langstroth = 'LANGSTROTH',
  Other = 'OTHER',
  TopBar = 'TOP_BAR',
  Warre = 'WARRE'
}

/** A structured inspection session for a specific hive. */
export type Inspection = {
  __typename?: 'Inspection';
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  hive: Hive;
  id: Scalars['UUID']['output'];
  notes: Scalars['String']['output'];
  observations: Array<Observation>;
  startedAt: Scalars['DateTime']['output'];
  status: InspectionStatus;
  type: InspectionType;
};

/** Current status of an inspection session. */
export enum InspectionStatus {
  Completed = 'COMPLETED',
  InProgress = 'IN_PROGRESS',
  Paused = 'PAUSED'
}

/** Type of inspection performed. */
export enum InspectionType {
  Full = 'FULL',
  Quick = 'QUICK'
}

/** Media attachment (photo, audio) linked to an observation. */
export type Media = {
  __typename?: 'Media';
  analysisResult?: Maybe<Scalars['JSON']['output']>;
  analysisStatus: Scalars['String']['output'];
  contentType: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['UUID']['output'];
  storagePath: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addObservation: Observation;
  completeInspection: Inspection;
  completeTask: Task;
  createApiary: Apiary;
  createHive: Hive;
  deferTask: Task;
  deleteApiary: Scalars['Boolean']['output'];
  deleteHive: Scalars['Boolean']['output'];
  exportData: ExportJob;
  pauseInspection: Inspection;
  resumeInspection: Inspection;
  startInspection: Inspection;
  updateApiary: Apiary;
  updateHive: Hive;
};


export type MutationAddObservationArgs = {
  input: AddObservationInput;
};


export type MutationCompleteInspectionArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationCompleteTaskArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationCreateApiaryArgs = {
  input: CreateApiaryInput;
};


export type MutationCreateHiveArgs = {
  input: CreateHiveInput;
};


export type MutationDeferTaskArgs = {
  id: Scalars['UUID']['input'];
  input?: InputMaybe<DeferTaskInput>;
};


export type MutationDeleteApiaryArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationDeleteHiveArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationExportDataArgs = {
  input: ExportDataInput;
};


export type MutationPauseInspectionArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationResumeInspectionArgs = {
  id: Scalars['UUID']['input'];
};


export type MutationStartInspectionArgs = {
  input: StartInspectionInput;
};


export type MutationUpdateApiaryArgs = {
  id: Scalars['UUID']['input'];
  input: UpdateApiaryInput;
};


export type MutationUpdateHiveArgs = {
  id: Scalars['UUID']['input'];
  input: UpdateHiveInput;
};

/** A single observation recorded during an inspection. */
export type Observation = {
  __typename?: 'Observation';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['UUID']['output'];
  inspection: Inspection;
  media: Array<Media>;
  observationType: ObservationType;
  rawVoiceUrl?: Maybe<Scalars['String']['output']>;
  sequenceOrder: Scalars['Int']['output'];
  structuredData?: Maybe<Scalars['JSON']['output']>;
  transcription?: Maybe<Scalars['String']['output']>;
  transcriptionConfidence?: Maybe<Scalars['Float']['output']>;
};

/** Category of observation recorded during an inspection. */
export enum ObservationType {
  BroodPattern = 'BROOD_PATTERN',
  Equipment = 'EQUIPMENT',
  General = 'GENERAL',
  PestDisease = 'PEST_DISEASE',
  QueenStatus = 'QUEEN_STATUS',
  Stores = 'STORES',
  Temperament = 'TEMPERAMENT'
}

export type Query = {
  __typename?: 'Query';
  apiaries: Array<Apiary>;
  apiary: Apiary;
  exportJobStatus: ExportJob;
  hive: Hive;
  hives: Array<Hive>;
  inspection: Inspection;
  inspections: Array<Inspection>;
  me: User;
  recommendations: Array<Recommendation>;
  tasks: Array<Task>;
};


export type QueryApiaryArgs = {
  id: Scalars['UUID']['input'];
};


export type QueryExportJobStatusArgs = {
  id: Scalars['UUID']['input'];
};


export type QueryHiveArgs = {
  id: Scalars['UUID']['input'];
};


export type QueryHivesArgs = {
  apiaryId: Scalars['UUID']['input'];
};


export type QueryInspectionArgs = {
  id: Scalars['UUID']['input'];
};


export type QueryInspectionsArgs = {
  hiveId?: InputMaybe<Scalars['UUID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRecommendationsArgs = {
  hiveId?: InputMaybe<Scalars['UUID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTasksArgs = {
  apiaryId?: InputMaybe<Scalars['UUID']['input']>;
  hiveId?: InputMaybe<Scalars['UUID']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<TaskStatus>;
};

/**
 * AI-generated recommendation with mandatory contract fields.
 * Every recommendation surface must return action + rationale + confidence + fallback.
 */
export type Recommendation = {
  __typename?: 'Recommendation';
  action: Scalars['String']['output'];
  confidenceLevel: Scalars['Float']['output'];
  confidenceType: ConfidenceType;
  createdAt: Scalars['DateTime']['output'];
  evidenceContext?: Maybe<Scalars['JSON']['output']>;
  evidenceSources?: Maybe<Array<EvidenceSource>>;
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  fallbackAction: Scalars['String']['output'];
  hive: Hive;
  id: Scalars['UUID']['output'];
  rationale: Scalars['String']['output'];
  skillAdaptedExplanation: Scalars['String']['output'];
};

export type StartInspectionInput = {
  hiveId: Scalars['UUID']['input'];
  type: InspectionType;
};

/** An actionable task derived from a recommendation. */
export type Task = {
  __typename?: 'Task';
  catchUpGuidance?: Maybe<Scalars['String']['output']>;
  completedAt?: Maybe<Scalars['DateTime']['output']>;
  createdAt: Scalars['DateTime']['output'];
  deferredReason?: Maybe<Scalars['String']['output']>;
  dueDate?: Maybe<Scalars['DateTime']['output']>;
  hive: Hive;
  id: Scalars['UUID']['output'];
  isOverdue: Scalars['Boolean']['output'];
  priority: TaskPriority;
  recommendation?: Maybe<Recommendation>;
  status: TaskStatus;
  title: Scalars['String']['output'];
};

/** Task priority level. */
export enum TaskPriority {
  Critical = 'CRITICAL',
  High = 'HIGH',
  Low = 'LOW',
  Medium = 'MEDIUM'
}

/** Task lifecycle status. */
export enum TaskStatus {
  Completed = 'COMPLETED',
  Deferred = 'DEFERRED',
  Dismissed = 'DISMISSED',
  InProgress = 'IN_PROGRESS',
  Pending = 'PENDING'
}

export type UpdateApiaryInput = {
  bloomOffset?: InputMaybe<Scalars['Int']['input']>;
  elevationOffset?: InputMaybe<Scalars['Float']['input']>;
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  region?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateHiveInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<HiveStatus>;
  type?: InputMaybe<HiveType>;
};

/** Authenticated user profile. */
export type User = {
  __typename?: 'User';
  createdAt: Scalars['DateTime']['output'];
  displayName: Scalars['String']['output'];
  email: Scalars['String']['output'];
  experienceLevel: ExperienceLevel;
  id: Scalars['UUID']['output'];
  region: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};
