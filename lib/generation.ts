export type GenerationRequest = {
  prompt: string;
  referenceDataUrl: string;
};

export type GenerationResult = {
  imageUrl?: string;
  provider: string;
  status: "NOT_CONFIGURED"|"GENERATED";
};

export interface ImageGenerationProvider {
  generate(request: GenerationRequest): Promise<GenerationResult>;
}

// Provider-agnostic seam. Add an OpenAI/other image provider here without changing UI or prompt rules.
export const generationProvider: ImageGenerationProvider = {
  async generate() {
    return { provider: "unconfigured", status: "NOT_CONFIGURED" };
  }
};
