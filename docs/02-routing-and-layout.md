# Routing và layout trong App Router

Project dùng Next.js App Router, nghĩa là route được tạo từ thư mục trong `src/app`.

## Route base hiện tại

```txt
src/app/page.tsx                         -> /
src/app/auth/login/page.tsx              -> /auth/login
src/app/(protected)/admin/page.tsx       -> /admin
src/app/(protected)/manager/page.tsx     -> /manager
src/app/(protected)/staff/page.tsx       -> /staff
src/app/(protected)/driver/page.tsx      -> /driver
```

Hiện project không có `src/app/login/page.tsx`, nên route `/login` chưa tồn tại. Login hiện nằm ở `/auth/login`.

## `page.tsx`

Muốn một URL có UI, folder đó phải có file `page.tsx`.

Đúng:

```txt
src/app/(protected)/manager/reports/page.tsx
```

Sai trong App Router:

```txt
src/app/(protected)/manager/reports/Page.tsx
src/app/(protected)/manager/reports/index.tsx
```

## `layout.tsx`

`layout.tsx` bọc toàn bộ page bên dưới cùng segment.

Hiện tại có:

- `src/app/layout.tsx`: root layout toàn app.
- `src/app/(protected)/layout.tsx`: layout cho `/admin`, `/manager`, `/staff`, `/driver`.

### Root layout

`src/app/layout.tsx` đang làm các việc:

- Import `src/app/globals.css`.
- Load font Geist và Geist Mono.
- Set metadata title/description.
- Bọc app bằng `<Providers>{children}</Providers>`.
- Render `<Toaster position="bottom-right" />` từ package `sonner`.

Lưu ý: project có `src/components/ui/sonner.tsx`, nhưng root layout hiện đang import trực tiếp từ `sonner`, không dùng wrapper shadcn này.

### App providers

`src/app/providers.tsx` là Client Component:

```tsx
'use client';

import { QueryProvider } from '@/providers/query-provider';

export function Providers({ children }: { children: ReactNode }) {
    return <QueryProvider>{children}</QueryProvider>;
}
```

Hiện chỉ bọc `QueryProvider`. `ThemeProvider` có file riêng ở `src/providers/theme-provider.tsx` nhưng chưa được dùng trong provider chain.

## Route group `(protected)`

Folder có ngoặc tròn không xuất hiện trên URL.

Ví dụ:

```txt
src/app/(protected)/admin/page.tsx
```

URL thật:

```txt
/admin
```

Route group giúp gom layout chung, auth guard, sidebar, header mà không đổi URL.

## Protected layout hiện tại

File:

```txt
src/app/(protected)/layout.tsx
```

Hiện layout này:

- Là Client Component vì dùng Zustand hook `useAuthStore`.
- Render header sticky.
- Có link nav tạm đến `/admin`, `/manager`, `/staff`, `/driver`.
- Hiển thị `user.fullName`, `user.username`, hoặc `Guest`.
- Render `{children}` trong `<main>`.

Điểm cần biết: layout hiện tại chưa phải auth guard đầy đủ. Nó chưa redirect user chưa login và chưa filter menu theo role.

## Role routes hiện tại

Mapping role theo convention:

```txt
SYSTEM_ADMIN    -> /admin
PARKING_MANAGER -> /manager
STAFF           -> /staff
PARKING_USER    -> /driver
```

Các page hiện tại chỉ render `RoleWelcomeCard`:

- `src/app/(protected)/admin/page.tsx`
- `src/app/(protected)/manager/page.tsx`
- `src/app/(protected)/staff/page.tsx`
- `src/app/(protected)/driver/page.tsx`

`RoleWelcomeCard` nằm ở `src/components/role-welcome-card.tsx`. Component này đọc user từ Zustand và hiển thị thông tin user/role.

## Cấu trúc protected layout nên hướng tới

Project đã có route group `(protected)`, đây là hướng đúng. Khi module thật nhiều hơn, nên phát triển tiếp theo cấu trúc:

```txt
src/app/(protected)/
  layout.tsx
  admin/
    page.tsx
    users/page.tsx
    tenants/page.tsx
  manager/
    page.tsx
    reports/page.tsx
    customers/page.tsx
  staff/
    page.tsx
  driver/
    page.tsx
```

Layout chung nên chứa:

- Auth guard.
- Header.
- Sidebar.
- Role/permission based menu.
- Container layout.
- Logout action.

## Khi thêm page mới

Muốn URL `/manager/reports`:

```txt
src/app/(protected)/manager/reports/page.tsx
```

Muốn URL `/admin/users`:

```txt
src/app/(protected)/admin/users/page.tsx
```

Muốn URL `/auth/forgot-password`:

```txt
src/app/auth/forgot-password/page.tsx
```

Sau khi tạo route mới, nếu dev server không nhận, restart `bun run dev`.

## Khi làm task routing/layout nên mở file nào trước

- `src/app/layout.tsx`: root layout toàn app.
- `src/app/providers.tsx`: provider chain.
- `src/app/(protected)/layout.tsx`: protected shell hiện tại.
- `src/app/(protected)/*/page.tsx`: role page hiện tại.
- `src/components/role-welcome-card.tsx`: card demo được dùng bởi role pages.

## Không nên sửa file nào nếu chưa hiểu rõ

- Không move folder trong `src/app` nếu chưa hiểu URL tương ứng.
- Không đổi tên `(protected)` nếu chưa kiểm tra toàn bộ route.
- Không đổi `src/app/layout.tsx` nếu chưa hiểu provider/toaster/global CSS.
- Không thêm `index.tsx` vào App Router.

## Common errors

### 404 do tạo sai tên file

Sai:

```txt
Page.tsx
index.tsx
```

Đúng:

```txt
page.tsx
```

### Nhầm route group thành URL

`(protected)` không xuất hiện trên URL. Không truy cập:

```txt
/protected/admin
```

Đúng là:

```txt
/admin
```

### Tạo route sai folder

Nếu muốn `/manager/reports` nhưng tạo:

```txt
src/app/manager/reports/page.tsx
```

Route vẫn có thể chạy, nhưng sẽ không nằm trong protected layout hiện tại. Nên tạo trong:

```txt
src/app/(protected)/manager/reports/page.tsx
```

### Quên restart dev server

Đôi khi route mới không nhận ngay. Restart:

```bash
bun run dev
```
