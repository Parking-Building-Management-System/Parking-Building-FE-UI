# API layer và TanStack Query

Project tách API layer ra khỏi UI. UI/page không nên gọi raw axios trực tiếp nếu không có lý do đặc biệt.

## Service layer

Quy ước hiện tại:

```txt
src/service/<domain>/type.ts
src/service/<domain>/api.ts
src/service/<domain>/index.ts
```

Hiện project có domain `user`:

- `src/service/user/type.ts`: role, user profile, auth response, login schema/type.
- `src/service/user/api.ts`: login, refresh, `/auth/me`, logout.
- `src/service/user/index.ts`: export lại `type` và `api`.

Khi thêm domain mới như tenant/customer/parking-lot, nên tạo folder mới:

```txt
src/service/tenant/type.ts
src/service/tenant/api.ts
src/service/tenant/index.ts
```

## `apiClient`

File:

```txt
src/lib/api/axios-config.ts
```

`apiClient` là Axios instance dùng chung.

### Base URL

Base URL lấy từ:

```txt
src/lib/api/api-url.ts
```

Code hiện tại:

```ts
export const getApiUrl = (): string => {
    return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
};
```

### `withCredentials`

`apiClient` bật:

```ts
withCredentials: true
```

Điều này cần cho refresh token HttpOnly cookie.

### Request interceptor

Trước mỗi request, `apiClient` đọc `jwtToken` từ Zustand:

```ts
const token = useAuthStore.getState().jwtToken;
```

Nếu có token, gắn:

```ts
Authorization: Bearer <token>
```

### Response interceptor

Backend response có shape `ApiResponse`. Interceptor hiện tại:

- Nếu `data.code` tồn tại và khác `1000`, throw `ApiError`.
- Nếu success, return `data` thay vì Axios response gốc.
- Nếu HTTP 401, tự gọi `/auth/refresh`, set token mới, retry request ban đầu.
- Nếu refresh fail, `clearAuth()`.

Vì interceptor return `response.data`, generic Axios trong service phải viết theo pattern hiện tại.

## `ApiResponse`

Định nghĩa trong `src/lib/api/axios-config.ts`:

```ts
export interface ApiResponse<T = unknown> {
    code: number;
    message: string;
    result?: T;
    errors?: Record<string, string>;
    timestamp?: string;
    path?: string;
}
```

Backend convention: success code hiện được code check là `1000`.

## `ApiError`

`ApiError` là Error custom:

```ts
export class ApiError extends Error {
    status?: number;
    code?: number;
    details?: Record<string, string>;
}
```

UI có thể đọc:

- `error.message`
- `error.status`
- `error.code`
- `error.details`

Ví dụ login page hiện dùng:

```ts
onError: (error: ApiError | Error) => {
    toast.error(error.message || 'Login failed');
}
```

## Unwrap result

Trong `src/service/user/api.ts` có helper local:

```ts
const getApiResult = <T>(response: ApiResponse<T>): T => {
    if (!response.result) {
        throw new Error(response.message || 'Empty response result');
    }

    return response.result;
};
```

`loginApi` trả thẳng `AuthenticationResponse`, không trả nguyên `ApiResponse`.

```ts
export const loginApi = async (data: LoginRequest) => {
    const response = await apiClient.post<
        ApiResponse<AuthenticationResponse>,
        ApiResponse<AuthenticationResponse>,
        LoginRequest
    >(`${AUTH_ENDPOINT}/login`, data);

    return getApiResult(response);
};
```

Lưu ý: `getApiResult` hiện nằm trong `src/service/user/api.ts`, chưa export dùng chung. Nếu domain khác cần unwrap result, có thể copy tạm theo pattern hoặc hỏi leader trước khi refactor helper dùng chung.

## TanStack Query dùng để làm gì

TanStack Query quản lý server state:

- Data lấy từ API.
- Cache.
- Loading/error state.
- Refetch/invalidate.

Project đã bọc app bằng `QueryProvider` tại:

```txt
src/providers/query-provider.tsx
```

Default options hiện tại:

```ts
queries: {
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
}
```

React Query Devtools đang bật:

```tsx
<ReactQueryDevtools initialIsOpen={false} />
```

## Khi nào dùng `useQuery`

Dùng `useQuery` cho:

- GET list.
- GET detail.
- Current user profile nếu muốn cache.
- Data server có thể cache/refetch.

Ví dụ template:

```tsx
const query = useQuery({
    queryKey: ['something'],
    queryFn: getSomethingApi,
});
```

## Khi nào dùng `useMutation`

Dùng `useMutation` cho:

- Login.
- Logout.
- Create.
- Update.
- Delete.
- Toggle status.

Login page hiện đang dùng `useMutation`.

Template:

```tsx
const mutation = useMutation({
    mutationFn: createSomethingApi,
    onSuccess: () => {
        toast.success('Created successfully');
    },
    onError: (error: ApiError | Error) => {
        toast.error(error.message || 'Something went wrong');
    },
});
```

## Template tạo API mới

Ví dụ nếu backend có `GET /something` và response result là `Something`.

```ts
import apiClient, { ApiResponse } from '@/lib/api/axios-config';

export interface Something {
    id: string;
    name: string;
}

const getApiResult = <T>(response: ApiResponse<T>): T => {
    if (!response.result) {
        throw new Error(response.message || 'Empty response result');
    }

    return response.result;
};

export const getSomethingApi = async () => {
    const response = await apiClient.get<
        ApiResponse<Something>,
        ApiResponse<Something>
    >('/something');

    return getApiResult(response);
};
```

Không bịa field `Something`. Phải đọc backend DTO/spec trước.

## Quy trình khi làm task gọi API

1. Đọc backend DTO/spec trước.
2. Tạo request/response type trong `src/service/<domain>/type.ts`.
3. Nếu có form, tạo Zod schema trong `type.ts` hoặc file schema riêng trong module.
4. Tạo API function trong `src/service/<domain>/api.ts`.
5. Trong page/component, gọi bằng `useQuery` hoặc `useMutation`.
6. Xử lý loading/error/empty state.
7. Với mutation thay đổi list, invalidate query liên quan.
8. Không gọi raw axios trực tiếp trong UI nếu không cần.

## File nên mở khi tích hợp API

- `src/lib/api/axios-config.ts`: hiểu `apiClient`, `ApiResponse`, `ApiError`.
- `src/service/user/api.ts`: pattern service hiện tại.
- `src/service/user/type.ts`: pattern type/schema hiện tại.
- Page/component cần tích hợp API.

## Common errors

### Type Axios bị sai vì interceptor return `response.data`

Interceptor đang return `data as unknown as AxiosResponse`, nên service hiện viết generic kiểu:

```ts
apiClient.get<ApiResponse<UserProfile>, ApiResponse<UserProfile>>(...)
```

Không viết theo thói quen Axios mặc định nếu chưa kiểm tra pattern hiện tại.

### Quên unwrap `result`

UI thường cần `result`, không cần nguyên `ApiResponse`.

Nên return:

```ts
return getApiResult(response);
```

### Dùng `useQuery` cho POST

POST/create/update/delete/login nên dùng `useMutation`.

### Dùng `useMutation` cho data cần cache lâu

GET list/detail nên dùng `useQuery` để có cache và refetch.

### Quên `queryKey`

Mỗi `useQuery` cần `queryKey` ổn định:

```tsx
queryKey: ['tenants']
queryKey: ['tenant', tenantId]
```

### Bịa API response

Không tự đoán DTO. Nếu backend chưa có spec, ghi rõ cần confirm endpoint, method, request body, response body, error code.
