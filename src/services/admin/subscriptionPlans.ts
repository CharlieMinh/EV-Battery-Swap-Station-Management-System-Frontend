import axios from "axios";

export interface SubscriptionPlanRequest {
  name: string;
  description: string;
  monthlyPrice: number;
  maxSwapsPerMonth: number;
  benefits: string;
  refundPolicy: string;
  batteryModelId: string;
}

export interface SubscriptionPlanUpdateRequest extends SubscriptionPlanRequest {
  isActive: boolean;
}

export interface SubscriptionPlanResponse {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  maxSwapsPerMonth: number;
  benefits: string;
  refundPolicy: string;
  batteryModelId: string;
  isActive: boolean;
}

const API_URL = "http://localhost:5194/api/v1/subscription-plans";

// --- CREATE ---
export const createSubscriptionPlan = async (data: SubscriptionPlanRequest) => {
  const res = await axios.post(API_URL, data, { withCredentials: true });
  return res.data;
};

// --- UPDATE ---
export const updateSubscriptionPlan = async (id: string, data: SubscriptionPlanUpdateRequest) => {
  const res = await axios.put(`${API_URL}/${id}`, data, { withCredentials: true });
  return res.data;
};

// --- DELETE ---
export const deleteSubscriptionPlan = async (id: string) => {
  const res = await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
  return res.data;
};
