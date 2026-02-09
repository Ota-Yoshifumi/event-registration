import { isTenantKey } from "@/lib/tenant-config";
import type {
  ReservationConfirmationRenderer,
  CancellationRenderer,
} from "./types";

import * as defaultReservation from "./default/reservation-confirmation";
import * as defaultCancellation from "./default/cancellation";
import * as whgcReservation from "./whgc-seminars/reservation-confirmation";
import * as whgcCancellation from "./whgc-seminars/cancellation";
import * as kgriReservation from "./kgri-pic-center/reservation-confirmation";
import * as kgriCancellation from "./kgri-pic-center/cancellation";
import * as affReservation from "./aff-events/reservation-confirmation";
import * as affCancellation from "./aff-events/cancellation";
import * as picReservation from "./pic-courses/reservation-confirmation";
import * as picCancellation from "./pic-courses/cancellation";

const reservationTemplates: Record<string, ReservationConfirmationRenderer> = {
  "whgc-seminars": whgcReservation.render,
  "kgri-pic-center": kgriReservation.render,
  "aff-events": affReservation.render,
  "pic-courses": picReservation.render,
};

const cancellationTemplates: Record<string, CancellationRenderer> = {
  "whgc-seminars": whgcCancellation.render,
  "kgri-pic-center": kgriCancellation.render,
  "aff-events": affCancellation.render,
  "pic-courses": picCancellation.render,
};

export function getReservationConfirmationTemplate(
  tenant: string | undefined
): ReservationConfirmationRenderer {
  if (tenant && isTenantKey(tenant) && reservationTemplates[tenant]) {
    return reservationTemplates[tenant];
  }
  return defaultReservation.render;
}

export function getCancellationTemplate(
  tenant: string | undefined
): CancellationRenderer {
  if (tenant && isTenantKey(tenant) && cancellationTemplates[tenant]) {
    return cancellationTemplates[tenant];
  }
  return defaultCancellation.render;
}

export type { ReservationConfirmationTemplateData, CancellationTemplateData, EmailTemplateOptions } from "./types";
