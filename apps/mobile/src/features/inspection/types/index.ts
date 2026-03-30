export type InspectionType = 'full' | 'quick';
export type InspectionStatus = 'in_progress' | 'paused' | 'completed';
export type ObservationClassification = 'normal' | 'cautionary' | 'urgent';
export type VoiceCaptureState = 'idle' | 'listening' | 'processing' | 'confirm';

export interface InspectionPrompt {
  id: string;
  title: string;
  description: string;
  compactLabel: string;
  observationType: string;
  options?: PromptOption[];
  isRequired: boolean;
  quickMode: boolean;
}

export interface PromptOption {
  id: string;
  label: string;
  classification: ObservationClassification;
  nextPromptOverride?: string;
}

export interface Observation {
  id: string;
  promptId: string;
  observationType: string;
  value: string;
  classification: ObservationClassification;
  voiceTranscription?: string;
  voiceConfidence?: number;
  audioUri?: string;
  imageUris?: string[];
  analysisResults?: ImageAnalysisResult[];
  acousticResults?: AcousticAnalysisResult;
  createdAt: string;
}

export interface ImageAnalysisResult {
  category: string;
  interpretation: string;
  confidence: number;
}

export interface AcousticAnalysisResult {
  queenrightConfidence: number;
  agitationLevel: 'low' | 'normal' | 'elevated';
  swarmReadiness: 'low' | 'medium' | 'high';
}

export interface InspectionState {
  inspectionId: string | null;
  hiveId: string | null;
  hiveName: string | null;
  type: InspectionType | null;
  status: InspectionStatus;
  currentPromptIndex: number;
  observations: Observation[];
  startedAt: string | null;
  safetyAcknowledged: boolean;
}
