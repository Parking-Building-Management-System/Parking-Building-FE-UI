# Lỗi phổ biến khi làm SmartPark frontend

Tài liệu này liệt kê các lỗi team mới dễ gặp trong Next.js App Router, auth, API, UI và tooling.

## 404 route trong App Router

### Nguyên nhân thường gặp

- Tạo `Page.tsx` thay vì `page.tsx`.
- Tạo `index.tsx` theo thói quen React Router/Next Pages Router cũ.
- Đặt route sai folder.
- Hiểu nhầm route group `(protected)` là một phần URL.
- Dev server chưa nhận route mới.

### Cách kiểm tra

Route hiện tại:

```txt
src/app/auth/login/page.tsx              -> /auth/login
src/app/(protected)/admin/page.tsx       -> /admin
src/app/(protected)/manager/page.tsx     -> /manager
src/app/(protected)/staff/page.tsx       -> /staff
src/app/(protected)/driver/page.tsx      -> /driver
```

Nếu muốn `/manager/reports`, tạo:

```txt
src/app/(protected)/manager/reports/page.tsx
```

Không tạo:

```txt
src/app/(protected)/manager/reports/index.tsx
```

### Cách sửa

- Đảm bảo file tên chính xác là `page.tsx`.
- Đảm bảo route nằm dưới đúng folder.
- Restart dev server nếu cần:

```bash
bun run dev
```

## Component cần state nhưng thiếu `'use client'`

### Triệu chứng

Lỗi khi dùng:

- `useState`
- `useEffect`
- `useRouter`
- `useMutation`
- `useQuery`
- `useForm`
- Zustand hook
- event handler như `onClick`

### Cách sửa

Thêm dòng đầu file:

```tsx
'use client';
```

Ví dụ login page cần `'use client'` vì dùng `useState`, `useRouter`, `useMutation`, React Hook Form và Zustand.

## `Cannot create components during render`

### Nguyên nhân

React Compiler dễ báo lỗi nếu tạo component/dynamic component không ổn định trong render.

Với icon dynamic, không tạo map trong component render mỗi lần.

### Pattern đúng hiện tại

`src/components/role-welcome-card.tsx` đặt map ngoài component:

```tsx
const ROLE_ICONS: Record<Role, IconComponent> = {
    SYSTEM_ADMIN: ShieldCheck,
    PARKING_MANAGER: Building2,
    STAFF: UserRound,
    PARKING_USER: CarFront,
};
```

Trong component:

```tsx
const Icon = ROLE_ICONS[role];
```

Render bằng:

```tsx
{createElement(Icon, { className: 'size-7' })}
```

## API gọi sai domain

### Nguyên nhân

- Thiếu `NEXT_PUBLIC_API_URL`.
- Dùng `API_URL` trong client-side.
- Chưa restart dev server sau khi đổi env.
- Gọi relative URL nên request đi vào frontend port 3000.

### Cách kiểm tra

File đọc env:

```txt
src/lib/api/api-url.ts
```

Env local nên là:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Nếu Network tab thấy request tới `localhost:3000/auth/login`, base URL đang sai hoặc code gọi relative URL trực tiếp.

## Login gửi sai fingerprint

### Nguyên nhân

- Username demo không match mapping.
- Username có typo.
- localStorage đang lưu UUID thật cho account không phải demo.

### Mapping demo hiện tại

```txt
system.admin@smartpark.local -> seed-system-admin-device
manager@demo-parking.local   -> seed-manager-device
staff@demo-parking.local     -> seed-staff-device
driver@demo-parking.local    -> seed-driver-device
```

### Cách kiểm tra

Mở:

```txt
src/lib/auth/device-fingerprint.ts
```

Kiểm tra payload request `/auth/login` trong Network tab có:

```json
{
    "deviceFingerprint": "...",
    "deviceLabel": "..."
}
```

## `/me` bị 401 sau login

### Nguyên nhân thường gặp

- Chưa `setJwtToken(auth.accessToken)` trước khi gọi `getMyProfileApi()`.
- Interceptor chưa attach token.
- Backend token invalid.
- Login response không có access token.

### Pattern đúng hiện tại

Trong `src/app/auth/login/page.tsx`:

```tsx
const auth = await loginApi(payload);
setJwtToken(auth.accessToken);
const user = await getMyProfileApi();
```

Kiểm tra request `/auth/me` có header:

```txt
Authorization: Bearer ...
```

## F5 mất user

### Nguyên nhân

Zustand store hiện là memory store, không persist. Khi reload:

- `user` reset.
- `jwtToken` reset.
- `isAuthenticated` reset.

### Cách xử lý đúng

Cần implement AuthBootstrap:

```txt
app reload
  -> refreshApi()
  -> setJwtToken(new token)
  -> getMyProfileApi()
  -> setSession(...)
```

Hiện project chưa có AuthBootstrap.

## Toast màu không ăn

### Nguyên nhân

- Root layout đang import `Toaster` trực tiếp từ `sonner`, không dùng `src/components/ui/sonner.tsx`.
- CSS selector trong `globals.css` không match option Sonner mới.
- Bật option như `richColors` có thể override style.

### Cách kiểm tra

Mở:

```txt
src/app/layout.tsx
src/app/globals.css
src/components/ui/sonner.tsx
```

Nếu muốn dùng wrapper shadcn Sonner, cần chỉnh root layout có chủ đích và test lại theme.

## TypeScript Axios response type rối

### Nguyên nhân

`apiClient` response interceptor return `response.data`, không return Axios response gốc.

Service hiện viết:

```ts
const response = await apiClient.get<
    ApiResponse<UserProfile>,
    ApiResponse<UserProfile>
>('/auth/me');
```

Sau đó unwrap:

```ts
return getApiResult(response);
```

### Cách sửa

- Xem pattern trong `src/service/user/api.ts`.
- Không viết type theo thói quen Axios mặc định nếu chưa kiểm tra interceptor.
- Không quên unwrap `result`.

## Tailwind class không ăn

### Nguyên nhân

- Class dynamic quá mức khiến Tailwind không detect.
- Component không nhận hoặc không forward `className`.
- Dùng sai token.
- Sửa CSS selector sai.

### Cách kiểm tra

- Component shadcn thường dùng `cn(..., className)`.
- Token theme nằm trong `src/app/globals.css`.
- Ưu tiên class cụ thể thay vì build string động khó detect.

## ESLint/Prettier fail

### Nguyên nhân

- Import unused.
- Dùng `any`.
- Tailwind class order chưa đúng.
- Format không theo single quote/tab width 4.

### Cách xử lý

Check type:

```bash
bun run check-types
```

Lint:

```bash
bun run lint
```

Format:

```bash
bun run format
```

Không dùng `next lint` cho Next.js 16. Script `lint:fix` hiện vẫn là `next lint --fix`, nên tránh dùng cho đến khi được cập nhật.

## Cookie refresh không gửi

### Nguyên nhân

- Frontend thiếu `withCredentials: true`.
- Backend CORS không allow credentials.
- Cookie SameSite/Secure không phù hợp local/prod.
- Domain/port mismatch.

### Frontend hiện tại

`apiClient` trong `src/lib/api/axios-config.ts` đã có:

```ts
withCredentials: true
```

`refreshApi()` cũng gọi raw axios với:

```ts
withCredentials: true
```

Nếu cookie vẫn không gửi, cần kiểm tra backend CORS/cookie config.

## Dùng nhầm package manager

### Lỗi

Chạy:

```bash
npm install
yarn
pnpm install
```

và tạo lockfile mới.

### Cách đúng

```bash
bun install
bun run dev
bun run check-types
```

Project dùng `bun.lock`.
