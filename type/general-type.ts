export type Subdomain = "superadmin" | "user";

export type Response<T> = {
    success: boolean;
    message?: string;
    data?: T;
    code?: number;
  };
  