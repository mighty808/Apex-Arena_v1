import { apiFetch } from "../utils/api.utils";
import { SUPPORT_ENDPOINTS, type ApiResponse } from "../config/api.config";

export interface SupportMessageInput {
  name: string;
  email: string;
  message: string;
  tournament_id?: string;
}

export const submitSupportMessage = async (
  payload: SupportMessageInput
): Promise<ApiResponse<{ ticket_id?: string }>> => {
  return apiFetch<{ ticket_id?: string }>(SUPPORT_ENDPOINTS.CONTACT, {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
};
