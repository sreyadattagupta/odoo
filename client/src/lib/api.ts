const TOKEN_KEY = 'hrms_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string | null) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export type Role = 'employee' | 'hr';
export interface User {
  id: number;
  employee_id: string;
  full_name: string;
  email: string;
  role: Role;
  phone?: string;
  address?: string;
  photo_url?: string;
  job_title?: string;
  department?: string;
  date_joined?: string;
}
export interface Risk {
  score: number;
  level: 'low' | 'medium' | 'high';
  recommendation: 'approve' | 'review';
  factors: string[];
}
export interface LeaveRequest {
  id: number;
  user_id: number;
  full_name?: string;
  employee_id?: string;
  type: 'paid' | 'sick' | 'unpaid';
  start_date: string;
  end_date: string;
  remarks?: string;
  status: 'pending' | 'approved' | 'rejected';
  hr_comment?: string;
  risk?: Risk;
}
export interface Attendance {
  id: number;
  user_id: number;
  date: string;
  check_in?: string;
  check_out?: string;
  status: 'present' | 'absent' | 'half_day' | 'leave';
}
