# Tổng quan dự án SmartPark Frontend

Tài liệu này dành cho thành viên frontend mới vào dự án SmartPark / Parking Building Management. Mục tiêu là giúp bạn biết nên mở file nào trước, file nào chịu trách nhiệm gì, và luồng dữ liệu đi qua app như thế nào.

## Dự án này là gì

Đây là frontend cho hệ thống quản lý bãi/nhà xe SmartPark. Frontend giao tiếp với backend Spring Boot API để xử lý đăng nhập, lấy thông tin người dùng, phân quyền theo role và hiển thị các màn hình theo vai trò.

Hiện tại project đang ở giai đoạn nền tảng/MVP:

- Có trang login tại `src/app/auth/login/page.tsx`.
- Có nhóm route protected tại `src/app/(protected)`.
- Có page demo cho các role `/admin`, `/manager`, `/staff`, `/driver`.
- Có service auth/user trong `src/service/user`.
- Có Axios client dùng chung tại `src/lib/api/axios-config.ts`.
- Có auth store bằng Zustand tại `src/stores/use-auth-store.ts`.

## Stack công nghệ

- **Next.js App Router**: quản lý route, page, layout theo cấu trúc thư mục trong `src/app`.
- **React**: build UI component như form login, layout, card dashboard.
- **TypeScript strict mode**: kiểm tra type chặt hơn, giảm lỗi khi tích hợp API.
- **Bun**: package manager và runtime command chính của project. Không dùng npm/yarn/pnpm cho project này.
- **Tailwind CSS**: style nhanh bằng className, ví dụ `bg-muted`, `text-muted-foreground`, `rounded-xl`.
- **shadcn/ui**: bộ component UI được copy vào source code tại `src/components/ui`, không phải package đóng kín.
- **TanStack Query**: quản lý server state, mutation login, sau này dùng cho list/detail/create/update/delete.
- **Zustand**: lưu client state nhẹ như user hiện tại, token, trạng thái auth.
- **Axios**: gọi backend API qua client dùng chung `apiClient`.
- **Zod + React Hook Form**: tạo schema và validate form, hiện đang dùng ở login.
- **Sonner**: toast notification, ví dụ báo login thành công/thất bại.

## Cấu trúc thư mục tổng quan

```txt
src/
  app/
    layout.tsx
    providers.tsx
    globals.css
    page.tsx
    auth/login/page.tsx
    (protected)/
      layout.tsx
      admin/page.tsx
      manager/page.tsx
      staff/page.tsx
      driver/page.tsx
  components/
    ui/
    role-welcome-card.tsx
  hooks/
  lib/
    api/
    auth/
    utils.ts
  providers/
  service/
    user/
  stores/
docs/
public/
```

### `src/app`

Chứa route của Next.js App Router. Mỗi folder có `page.tsx` sẽ tạo thành một route.

Ví dụ hiện tại:

- `src/app/page.tsx` là route `/`.
- `src/app/auth/login/page.tsx` là route `/auth/login`.
- `src/app/(protected)/admin/page.tsx` là route `/admin`.

Khi làm task liên quan đến URL/page/layout, hãy mở `src/app` trước.

### `src/components`

Chứa component dùng lại nhiều nơi.

- `src/components/role-welcome-card.tsx`: card demo dùng cho các page role.
- `src/components/ui/*`: component shadcn/ui như Button, Card, Input, Field.

Khi làm UI dùng lại nhiều page, nên thêm component ở `src/components` hoặc module folder riêng nếu module lớn.

### `src/components/ui`

Đây là code component shadcn/ui đã được copy vào project. Có thể import trực tiếp:

```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
```

Không sửa component trong folder này nếu chỉ cần chỉnh UI của một page. Chỉ sửa khi thật sự muốn thay đổi design system toàn app.

### `src/lib`

Chứa helper dùng chung:

- `src/lib/api/api-url.ts`: lấy base URL backend từ `NEXT_PUBLIC_API_URL`, fallback `http://localhost:8080`.
- `src/lib/api/axios-config.ts`: Axios client dùng chung, interceptor, ApiResponse, ApiError, refresh token.
- `src/lib/auth/device-fingerprint.ts`: tạo/map device fingerprint khi login.
- `src/lib/utils.ts`: helper `cn()` để merge class Tailwind.

### `src/providers`

Chứa provider cấp app:

- `src/providers/query-provider.tsx`: bọc app bằng `QueryClientProvider`.
- `src/providers/theme-provider.tsx`: wrapper cho `next-themes`, hiện có file nhưng chưa được dùng trong `src/app/providers.tsx`.

### `src/service`

Chứa layer gọi API theo domain. Hiện tại có:

- `src/service/user/type.ts`: type, role, schema login.
- `src/service/user/api.ts`: login, refresh, `/auth/me`, logout.
- `src/service/user/index.ts`: re-export type và API.

Khi tích hợp API mới, ưu tiên tạo domain tương tự:

```txt
src/service/tenant/api.ts
src/service/tenant/type.ts
```

### `src/stores`

Chứa Zustand store. Hiện tại:

- `src/stores/use-auth-store.ts`: user, token, trạng thái auth, các action `setJwtToken`, `setSession`, `clearAuth`.

Không lưu refresh token vào store. Refresh token phải nằm trong HttpOnly cookie do backend quản lý.

### `docs`

Chứa tài liệu onboarding cho team. Folder này không ảnh hưởng runtime app.

### `public`

Chứa static asset public. File trong đây được serve trực tiếp từ root URL.

## Khái niệm quan trọng trong Next.js App Router

### App Router

App Router là router dựa trên file-system. Folder trong `src/app` tạo ra route. Next.js 16 trong project này dùng App Router, vì vậy không dùng kiểu cũ `pages/`.

### `page.tsx`

`page.tsx` là file bắt buộc để một route có UI.

Ví dụ:

```txt
src/app/auth/login/page.tsx -> /auth/login
src/app/(protected)/manager/page.tsx -> /manager
```

Không tạo `Page.tsx` hoặc `index.tsx` trong App Router.

### `layout.tsx`

`layout.tsx` là layout bọc các page bên dưới cùng folder.

Hiện tại:

- `src/app/layout.tsx` là root layout toàn app, import `globals.css`, font, `Providers`, `Toaster`.
- `src/app/(protected)/layout.tsx` bọc các route role bằng header/nav tạm.

### Route group như `(protected)`

Folder có ngoặc tròn không xuất hiện trên URL. Ví dụ:

```txt
src/app/(protected)/admin/page.tsx
```

Route thật vẫn là:

```txt
/admin
```

Route group dùng để gom layout/auth/sidebar chung mà không làm URL dài ra.

### Client component và `'use client'`

Mặc định file trong App Router là Server Component. Nếu component dùng hook React, Zustand, TanStack Query, event handler, browser API, `localStorage`, `useRouter`, `useState`, thì file phải có dòng đầu:

```tsx
'use client';
```

Ví dụ `src/app/auth/login/page.tsx` cần `'use client'` vì dùng `useState`, `useRouter`, `useMutation`, React Hook Form và Zustand.

### Server Component mặc định

Nếu file không có `'use client'`, hãy xem nó là Server Component mặc định. Server Component không được dùng `useState`, `useEffect`, Zustand hook, event handler như `onClick`.

Các page role hiện tại như `src/app/(protected)/admin/page.tsx` không có `'use client'`, nhưng import `RoleWelcomeCard`, component đó là client component. Đây là pattern hợp lệ: Server Component render Client Component.

## Khi bắt đầu làm task, nên mở file nào trước

- Task login: mở `src/app/auth/login/page.tsx`, `src/service/user/type.ts`, `src/service/user/api.ts`, `src/stores/use-auth-store.ts`.
- Task API: mở `src/lib/api/axios-config.ts`, domain trong `src/service/**`.
- Task route/layout: mở `src/app`, đặc biệt `src/app/(protected)/layout.tsx`.
- Task UI component: mở `src/components/ui`, `src/components/role-welcome-card.tsx`, `src/app/globals.css`.
- Task auth/session: mở `src/lib/auth/device-fingerprint.ts`, `src/stores/use-auth-store.ts`, `src/service/user/api.ts`.

## Không nên sửa nếu chưa hiểu rõ

- Không move/xóa file trong `src/app` nếu chưa hiểu route, vì có thể làm 404.
- Không sửa `src/lib/api/axios-config.ts` nếu chưa hiểu interceptor và refresh token.
- Không sửa `src/stores/use-auth-store.ts` nếu chưa hiểu flow login và reload.
- Không sửa component trong `src/components/ui` nếu chỉ cần chỉnh một màn hình cụ thể.
- Không đổi `package.json` package manager hoặc tạo lockfile npm/yarn/pnpm.

## Flow tổng quát UI -> API -> Store -> Route

Ví dụ login hiện tại:

```txt
src/app/auth/login/page.tsx
  -> React Hook Form + Zod validate username/password
  -> tạo LoginRequest kèm deviceFingerprint/deviceLabel
  -> loginApi trong src/service/user/api.ts
  -> apiClient trong src/lib/api/axios-config.ts gọi backend
  -> setJwtToken trong src/stores/use-auth-store.ts
  -> getMyProfileApi gọi /auth/me
  -> setSession lưu user + access token
  -> router.replace theo role
```

Nguyên tắc khi thêm feature mới: UI không nên gọi raw axios trực tiếp. Hãy tạo type/API trong `src/service/<domain>`, rồi dùng `useQuery` hoặc `useMutation` trong page/component.
