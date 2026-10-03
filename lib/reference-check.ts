import type { ProductType } from "./prompt-engine";

export type ReferenceStatus = "READY" | "LIMITED" | "REQUIRED";

export type ReferenceCheck = {
  shot: number;
  status: ReferenceStatus;
  reason: string;
};

export function checkShotReference(params: {
  shot: number;
  productType: ProductType;
  hasPrimaryReference: boolean;
  hasWornOrScaleReference: boolean;
  notes: string;
}): ReferenceCheck {
  const { shot, hasPrimaryReference, hasWornOrScaleReference, notes } = params;

  if (!hasPrimaryReference) {
    return { shot, status: "REQUIRED", reason: "Exact product reference is missing." };
  }

  if (shot <= 6) {
    if (shot === 2) {
      return { shot, status: "LIMITED", reason: "A nearby/side reference can be added when hidden geometry is important." };
    }
    if (shot === 4) {
      return { shot, status: "LIMITED", reason: "Profile construction is verified only where the supplied reference supports it." };
    }
    return { shot, status: "READY", reason: "Primary product reference supports this product-only setup." };
  }

  if (!hasWornOrScaleReference && !notes.trim()) {
    return {
      shot,
      status: "REQUIRED",
      reason: "Worn/lifestyle shots require real size information or a trustworthy worn/placement reference. Do not invent missing construction or scale."
    };
  }

  return { shot, status: "READY", reason: "A worn/scale reference or documented notes are available." };
}
