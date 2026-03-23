/** テナント whgc-seminars 用。事前アンケートセクションを非表示。 */
import type {
  ReservationConfirmationTemplateData,
  EmailTemplateOptions,
} from "../types";
import { render as defaultRender } from "../default/reservation-confirmation";

export function render(
  data: ReservationConfirmationTemplateData,
  options: EmailTemplateOptions
): string {
  return defaultRender({ ...data, hasPreSurvey: false }, options);
}
