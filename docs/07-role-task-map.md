# Mapping task Sprint 1 cho người mới

Tài liệu này mapping các task Sprint 1 dựa trên danh sách task được cung cấp trong yêu cầu. Không có ảnh task list kèm theo trong workspace hiện tại, nên các task bên dưới bám theo text đã được gửi. Task nào phụ thuộc nghiệp vụ/API backend sẽ ghi rõ cần confirm.

## 1. Thiết kế HTML, CSS in ENG

### Mục tiêu task

Dựng hoặc chỉnh UI bằng tiếng Anh, dùng Tailwind CSS và shadcn/ui theo style hiện tại.

### Người mới cần đọc file nào trước

- `src/app/globals.css`
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/field.tsx`
- Page đang được giao, ví dụ `src/app/auth/login/page.tsx`

### File/folder nên code

- Page cụ thể trong `src/app/**/page.tsx`.
- Component dùng lại trong `src/components`.
- Component module-specific có thể đặt gần route nếu team thống nhất, ví dụ `src/app/(protected)/manager/_components`.

### Những file không nên động vào

- Không sửa `src/components/ui/*` nếu chỉ đổi UI một page.
- Không sửa `src/app/layout.tsx` nếu task không liên quan layout toàn app.
- Không sửa `src/lib/api/axios-config.ts`.

### Checklist hoàn thành

- Text UI bằng tiếng Anh.
- Dùng Tailwind token hiện có.
- Responsive tối thiểu mobile/desktop.
- Không tràn text trong button/card.
- Không hardcode màu nếu có token phù hợp.
- Không thêm UI library mới.

### Prompt mẫu cho Codex

```txt
Bạn đang làm trong dự án SmartPark Next.js App Router + TypeScript + Tailwind + shadcn/ui.

Trước khi code hãy đọc:
- src/app/globals.css
- src/components/ui/button.tsx
- src/components/ui/card.tsx
- [page/component được giao]

Nhiệm vụ:
- Chỉnh UI bằng tiếng Anh cho [màn hình].
- Giữ style theo shadcn/ui và Tailwind token hiện có.

Ràng buộc:
- Chỉ sửa file liên quan UI task.
- Không sửa logic auth/API/store.
- Không thêm UI library mới.

Sau khi code:
- Chạy bun run check-types nếu có sửa TS/TSX.
- Tóm tắt file đã sửa.
```

### Lỗi dễ gặp

- Quên `'use client'` khi thêm state/event handler.
- Dùng màu hardcode quá nhiều.
- Sửa nhầm component trong `src/components/ui` làm ảnh hưởng toàn app.

## 2. Dựng UI trang Login và validation username/password

### Mục tiêu task

Dựng form login và validate `username`, `password`.

### Người mới cần đọc file nào trước

- `src/app/auth/login/page.tsx`
- `src/service/user/type.ts`
- `src/components/ui/field.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/button.tsx`

### File/folder nên code

- `src/app/auth/login/page.tsx`
- `src/service/user/type.ts` nếu cần chỉnh schema/type

### Những file không nên động vào

- Không để form quản lý `deviceFingerprint` hoặc `deviceLabel`.
- Không sửa `src/lib/auth/device-fingerprint.ts` nếu task chỉ là UI/validation.
- Không sửa `src/lib/api/axios-config.ts`.

### Checklist hoàn thành

- Form chỉ có `username` và `password`.
- Validate required bằng Zod.
- Hiển thị `FieldError`.
- Button disabled khi pending.
- Password toggle hoạt động.
- Không enforce password complexity ở login nếu backend không yêu cầu.

### Prompt mẫu cho Codex

```txt
Bạn đang làm trong dự án SmartPark Next.js App Router + React Hook Form + Zod + shadcn/ui.

Trước khi code hãy đọc:
- src/app/auth/login/page.tsx
- src/service/user/type.ts
- src/components/ui/field.tsx

Nhiệm vụ:
- Dựng/chỉnh UI login form.
- Validate username/password required.
- Hiển thị lỗi bằng FieldError.
- Giữ deviceFingerprint/deviceLabel ngoài form fields.

Ràng buộc:
- Không sửa API login nếu không cần.
- Không bịa field mới.
- Không sửa route khác.

Sau khi code:
- Chạy bun run check-types.
```

### Lỗi dễ gặp

- Thêm hidden input device fingerprint.
- Quên `zodResolver`.
- Quên disable button khi mutation pending.

## 3. Tích hợp API Login

### Mục tiêu task

Kết nối form login với backend `/auth/login`, lưu token/user và redirect theo role.

### Người mới cần đọc file nào trước

- `src/app/auth/login/page.tsx`
- `src/service/user/api.ts`
- `src/service/user/type.ts`
- `src/lib/auth/device-fingerprint.ts`
- `src/stores/use-auth-store.ts`
- `src/lib/api/axios-config.ts`

### File/folder nên code

- `src/app/auth/login/page.tsx`
- `src/service/user/api.ts`
- `src/service/user/type.ts`

### Những file không nên động vào

- Không lưu refresh token vào Zustand/localStorage.
- Không tạo Axios instance mới nếu không cần.
- Không hardcode role từ username.

### Checklist hoàn thành

- Payload có username/password/deviceFingerprint/deviceLabel.
- Gọi `loginApi`.
- `setJwtToken` trước khi gọi `/auth/me`.
- Gọi `getMyProfileApi`.
- `setSession`.
- Redirect theo role từ user profile.
- Toast success/error.

### Prompt mẫu cho Codex

```txt
Bạn đang làm trong dự án SmartPark với Axios apiClient, TanStack Query và Zustand.

Trước khi code hãy đọc:
- src/app/auth/login/page.tsx
- src/service/user/api.ts
- src/service/user/type.ts
- src/lib/auth/device-fingerprint.ts
- src/stores/use-auth-store.ts

Nhiệm vụ:
- Tích hợp login flow theo backend hiện tại.
- Sau login, set access token, gọi /auth/me, setSession và redirect theo role.

Ràng buộc:
- Không lưu refresh token vào localStorage/Zustand.
- Không gọi axios trực tiếp trong UI.
- Không bịa response API.
- Nếu thiếu backend DTO/spec, hãy dừng và liệt kê cần hỏi.

Sau khi code:
- Chạy bun run check-types.
- Chạy bun run lint nếu phù hợp.
```

### Lỗi dễ gặp

- `/me` 401 vì chưa set token.
- Demo username không match fingerprint.
- Redirect sai role.

## 4. Dựng bố khung Layout chung

### Mục tiêu task

Dựng protected shell gồm sidebar/header/navigation/children.

### Người mới cần đọc file nào trước

- `src/app/(protected)/layout.tsx`
- `src/stores/use-auth-store.ts`
- `src/app/(protected)/admin/page.tsx`
- `src/components/role-welcome-card.tsx`

### File/folder nên code

- `src/app/(protected)/layout.tsx`
- `src/components` cho sidebar/header nếu tách component

### Những file không nên động vào

- Không move role routes nếu chưa kiểm tra URL.
- Không sửa login flow nếu task chỉ là layout.
- Không hardcode quyền security ở frontend và coi là đủ.

### Checklist hoàn thành

- Layout render `{children}`.
- Header/sidebar dùng route hiện tại.
- Menu filter theo `user.roles` nếu yêu cầu.
- Có mobile responsive tối thiểu.
- Không làm `/admin`, `/manager`, `/staff`, `/driver` bị 404.

### Prompt mẫu cho Codex

```txt
Bạn đang làm protected layout cho SmartPark.

Trước khi code hãy đọc:
- src/app/(protected)/layout.tsx
- src/stores/use-auth-store.ts
- docs/02-routing-and-layout.md

Nhiệm vụ:
- Dựng layout chung gồm header, sidebar, navigation và children.
- Sidebar hiển thị item theo user.roles.

Ràng buộc:
- Không đổi URL hiện tại.
- Không move route nếu không cần.
- Frontend role guard chỉ là UI, backend vẫn phải check quyền.

Sau khi code:
- Chạy bun run check-types.
```

### Lỗi dễ gặp

- Tạo layout sai folder.
- Quên render `{children}`.
- Dùng `useAuthStore` nhưng thiếu `'use client'`.

## 5. Dựng UI thống kê tổng bãi xe, tổng khách hàng

### Mục tiêu task

Tạo dashboard stats cards cho tổng bãi xe, tổng khách hàng hoặc metrics tương tự.

### Người mới cần đọc file nào trước

- `src/app/(protected)/manager/page.tsx`
- `src/app/(protected)/admin/page.tsx`
- `src/components/ui/card.tsx`
- `src/components/role-welcome-card.tsx`

### File/folder nên code

- Route đề xuất: `src/app/(protected)/manager/dashboard/page.tsx` hoặc `src/app/(protected)/admin/dashboard/page.tsx`, cần confirm role owner.
- Component đề xuất: `src/components/stats-card.tsx` hoặc module component trong route.
- API domain nếu có spec: `src/service/<domain>/api.ts`, `src/service/<domain>/type.ts`.

### Những file không nên động vào

- Không hardcode data vào business page nếu backend API đã có.
- Không sửa `RoleWelcomeCard` nếu task là dashboard thật riêng.

### Checklist hoàn thành

- Có stats cards rõ label/value.
- Có loading/empty/error nếu data từ API.
- Nếu mock tạm, type rõ và comment/tài liệu ghi là mock.
- Responsive grid.

### Prompt mẫu cho Codex

```txt
Bạn đang làm dashboard stats cho SmartPark.

Trước khi code hãy đọc:
- src/app/(protected)/manager/page.tsx
- src/components/ui/card.tsx
- src/lib/api/axios-config.ts

Nhiệm vụ:
- Dựng UI stats tổng bãi xe và tổng khách hàng.
- Nếu chưa có backend API spec, chỉ mock data typed rõ và ghi TODO cần thay bằng API.

Ràng buộc:
- Không bịa endpoint backend.
- Không sửa auth/login.
- Hỏi lại nếu chưa rõ route thuộc admin hay manager.

Sau khi code:
- Chạy bun run check-types.
```

### Lỗi dễ gặp

- Không confirm route owner.
- Hardcode mock như data thật.
- Thiếu loading/error state khi đã dùng API.

## 6. Tìm hiểu UI dạng biểu đồ Chart

### Mục tiêu task

Đánh giá và dựng biểu đồ cho dashboard/report.

### Người mới cần đọc file nào trước

- `package.json` để xem đã có chart library chưa.
- `src/app/globals.css` để dùng chart tokens `--chart-1` đến `--chart-5`.
- Page dashboard/report liên quan.

### File/folder nên code

- Nếu có library chart: component ở `src/components/charts` hoặc module folder.
- Nếu chưa có library: đề xuất dùng `recharts`, nhưng cần hỏi leader trước khi cài dependency.

Hiện `package.json` chưa có `recharts`.

### Những file không nên động vào

- Không tự ý cài library mới nếu chưa confirm.
- Không hardcode business data trong chart component nếu có API.

### Checklist hoàn thành

- Confirm chart library.
- Chart responsive.
- Data shape typed rõ.
- Loading/empty state.
- Không làm page layout shift mạnh.

### Prompt mẫu cho Codex

```txt
Bạn đang nghiên cứu chart UI cho SmartPark.

Trước khi code hãy đọc:
- package.json
- src/app/globals.css
- page dashboard/report liên quan

Nhiệm vụ:
- Kiểm tra project đã có chart library chưa.
- Nếu chưa có, đề xuất phương án và dừng để hỏi leader trước khi cài.
- Nếu được phép code, tạo component chart typed rõ.

Ràng buộc:
- Không tự ý thêm dependency.
- Không bịa API/data.

Sau khi code:
- Chạy bun run check-types.
```

### Lỗi dễ gặp

- Tự cài package không hỏi.
- Chart không responsive.
- Business page chứa quá nhiều transform logic.

## 7. Dựng UI Table danh sách Tenant/Khách hàng

### Mục tiêu task

Hiển thị list tenant/customer bằng table có loading/empty/error.

### Người mới cần đọc file nào trước

- `src/lib/api/axios-config.ts`
- `src/service/user/api.ts` để học pattern API.
- `src/components/ui/card.tsx`
- Route owner cần confirm: admin tenant hay manager customer.

### File/folder nên code

- Route đề xuất: `src/app/(protected)/admin/tenants/page.tsx` hoặc `src/app/(protected)/manager/customers/page.tsx`.
- Service: `src/service/tenant/type.ts`, `src/service/tenant/api.ts` hoặc `src/service/customer/*`.
- Table component: `src/components` hoặc module folder.

### Những file không nên động vào

- Không đổi `apiClient`.
- Không bịa DTO tenant/customer.
- Không đặt table logic vào `src/components/ui` nếu là business table.

### Checklist hoàn thành

- Đọc backend DTO.
- Type list item rõ.
- `useQuery` có `queryKey`.
- Loading/empty/error state.
- Table responsive hoặc có overflow hợp lý.

### Prompt mẫu cho Codex

```txt
Bạn đang làm table danh sách Tenant/Khách hàng trong SmartPark.

Trước khi code hãy đọc:
- src/lib/api/axios-config.ts
- src/service/user/api.ts
- route/page liên quan

Nhiệm vụ:
- Tạo service type/api cho list theo backend spec.
- Tạo table UI hiển thị list.
- Xử lý loading/error/empty.

Ràng buộc:
- Không bịa endpoint hoặc field DTO.
- Không gọi axios trực tiếp trong UI.
- Nếu thiếu backend spec, dừng và liệt kê cần hỏi.

Sau khi code:
- Chạy bun run check-types.
- Chạy bun run lint nếu phù hợp.
```

### Lỗi dễ gặp

- Quên `queryKey`.
- Không có empty state.
- Field table không khớp backend.

## 8. Dựng UI Form tạo mới khách hàng/tenant

### Mục tiêu task

Tạo form create tenant/customer bằng React Hook Form, Zod và mutation.

### Người mới cần đọc file nào trước

- `src/app/auth/login/page.tsx` để học pattern form hiện tại.
- `src/service/user/type.ts` để học Zod schema.
- `src/service/user/api.ts` để học mutation API function.
- Table/list page liên quan.

### File/folder nên code

- Form component trong route/module.
- Service `type.ts` chứa create request schema/type.
- Service `api.ts` chứa create API.

### Những file không nên động vào

- Không thêm field không có trong backend DTO.
- Không sửa login schema.
- Không dùng raw axios trong form.

### Checklist hoàn thành

- Zod schema khớp backend DTO.
- FieldError cho validation.
- `useMutation` create.
- Toast success/error.
- Invalidate query list sau create.
- Button disabled khi pending.

### Prompt mẫu cho Codex

```txt
Bạn đang tạo form create tenant/customer trong SmartPark.

Trước khi code hãy đọc:
- src/app/auth/login/page.tsx
- src/service/user/type.ts
- src/service/user/api.ts
- list page liên quan

Nhiệm vụ:
- Tạo form bằng React Hook Form + Zod + shadcn Field/Input/Button.
- Tạo mutation create theo backend spec.
- Sau success toast và invalidate query list.

Ràng buộc:
- Không bịa request body.
- Không gọi axios trực tiếp trong UI.
- Nếu thiếu backend DTO/spec, dừng và hỏi.

Sau khi code:
- Chạy bun run check-types.
```

### Lỗi dễ gặp

- Schema không khớp DTO.
- Quên invalidate query.
- Không disable form khi pending.

## 9. Logic Toggle Bật/Tắt trạng thái khách hàng

### Mục tiêu task

Cho phép bật/tắt trạng thái customer/tenant.

### Người mới cần đọc file nào trước

- List page customer/tenant.
- Service API của customer/tenant.
- Component UI hiện có trong `src/components/ui`.

### File/folder nên code

- Table row action hoặc status cell.
- Service mutation update status.
- Có thể cần thêm shadcn Switch nếu project chưa có. Hiện `src/components/ui` chưa có `switch.tsx`, cần hỏi leader trước khi add.

### Những file không nên động vào

- Không tự ý thay đổi toàn bộ table state.
- Không bịa status enum.
- Không optimistic update nếu chưa hiểu cache.

### Checklist hoàn thành

- Confirm endpoint update status.
- Mutation dùng `useMutation`.
- Toast success/error.
- Invalidate query sau success.
- Confirm dialog nếu action nguy hiểm.
- UI disabled khi mutation pending.

### Prompt mẫu cho Codex

```txt
Bạn đang thêm toggle trạng thái khách hàng/tenant.

Trước khi code hãy đọc:
- table/list page liên quan
- src/service/<domain>/api.ts
- src/service/<domain>/type.ts
- src/lib/api/axios-config.ts

Nhiệm vụ:
- Thêm UI toggle status.
- Gọi mutation update status.
- Sau success invalidate query list.

Ràng buộc:
- Không bịa endpoint/status enum.
- Nếu chưa có Switch component, hỏi leader trước khi add shadcn component mới.
- Nếu action nguy hiểm, thêm confirm flow.

Sau khi code:
- Chạy bun run check-types.
```

### Lỗi dễ gặp

- Toggle UI đổi nhưng API fail không rollback/refetch.
- Không disable khi pending.
- Status enum sai backend.

## 10. Dựng UI Tabs Vehicle Categories/Roles

### Mục tiêu task

Dựng UI dạng tab cho Vehicle Categories hoặc Roles.

### Người mới cần đọc file nào trước

- `package.json`
- `components.json`
- `src/components/ui`
- Route/module liên quan.

### File/folder nên code

- Route đề xuất cần confirm theo nghiệp vụ.
- Component tab module.
- Nếu dùng shadcn Tabs, hiện project chưa có `src/components/ui/tabs.tsx`, cần add component hoặc hỏi leader trước.

### Những file không nên động vào

- Không tự tạo tab API nếu chưa có component/requirement rõ.
- Không đặt business tabs trong `src/components/ui`.

### Checklist hoàn thành

- Confirm tab thuộc module nào.
- Mỗi tab tách component nhỏ nếu nội dung nhiều.
- State tab rõ ràng.
- Không hardcode data nếu có API.

### Prompt mẫu cho Codex

```txt
Bạn đang dựng UI tabs Vehicle Categories/Roles.

Trước khi code hãy đọc:
- src/components/ui
- components.json
- route/module liên quan

Nhiệm vụ:
- Dựng tabs UI theo shadcn style.
- Mỗi tab tách component nếu nội dung dài.

Ràng buộc:
- Nếu project chưa có Tabs component, hỏi leader trước khi add.
- Không bịa API/data.

Sau khi code:
- Chạy bun run check-types.
```

### Lỗi dễ gặp

- Tự thêm dependency/UI lib khác.
- Tab content quá lớn trong một file.
- Thiếu empty/loading state.

## 11. Tích hợp API cho Quản lý của Sprint

### Mục tiêu task

Kết nối UI sprint với API backend theo module quản lý.

### Người mới cần đọc file nào trước

- Backend spec/DTO của module.
- `src/lib/api/axios-config.ts`
- `src/service/user/api.ts`
- `src/service/user/type.ts`
- Page/module đang tích hợp.

### File/folder nên code

- `src/service/<domain>/type.ts`
- `src/service/<domain>/api.ts`
- Page/component dùng `useQuery`/`useMutation`.

### Những file không nên động vào

- Không sửa interceptor nếu chỉ thêm endpoint.
- Không bịa response.
- Không gọi raw axios trong UI.

### Checklist hoàn thành

- Type request/response khớp DTO.
- API function đúng method/path.
- Query/mutation đúng mục đích.
- Loading/error/empty.
- Toast cho mutation.
- Invalidate query khi data thay đổi.

### Prompt mẫu cho Codex

```txt
Bạn đang tích hợp API quản lý cho Sprint trong SmartPark.

Trước khi code hãy đọc:
- backend DTO/spec được cung cấp
- src/lib/api/axios-config.ts
- src/service/user/api.ts
- src/service/user/type.ts
- UI page/module liên quan

Nhiệm vụ:
- Tạo type/api cho endpoint.
- Connect vào UI bằng TanStack Query.
- Xử lý loading/error/empty.

Ràng buộc:
- Không bịa API.
- Không sửa axios interceptor nếu không cần.
- Nếu spec thiếu method/path/body/response, dừng và hỏi lại.

Sau khi code:
- Chạy bun run check-types.
- Chạy bun run lint nếu phù hợp.
```

### Lỗi dễ gặp

- Dùng sai method.
- Quên unwrap `result`.
- Không invalidate sau mutation.

## 12. Khởi tạo Project Base, Rule

### Mục tiêu task

Thiết lập nền tảng project: rule, docs, providers, axios, query provider, auth store, route structure.

### Người mới cần đọc file nào trước

- `AGENTS.md`
- `package.json`
- `tsconfig.json`
- `components.json`
- `src/app/layout.tsx`
- `src/app/providers.tsx`
- `src/providers/query-provider.tsx`
- `src/lib/api/axios-config.ts`
- `src/stores/use-auth-store.ts`
- `docs/*`

### File/folder nên code

- `docs/` cho tài liệu.
- `src/providers` cho provider.
- `src/lib/api` cho API config.
- `src/stores` cho store.
- `src/app` cho route/layout.

### Những file không nên động vào

- Không đổi package manager.
- Không tạo lockfile khác.
- Không sửa `AGENTS.md` nếu chưa có thống nhất team.
- Không thêm env cũ bị cấm trong `AGENTS.md`.

### Checklist hoàn thành

- Bun commands hoạt động.
- `QueryProvider` được bọc ở root.
- `apiClient` dùng `NEXT_PUBLIC_API_URL`.
- Auth store có action cần thiết.
- Route role tồn tại.
- Docs onboarding có đủ.

### Prompt mẫu cho Codex

```txt
Bạn đang làm project base/rule cho SmartPark frontend.

Trước khi code hãy đọc:
- AGENTS.md
- package.json
- tsconfig.json
- components.json
- src/app/layout.tsx
- src/app/providers.tsx
- src/lib/api/axios-config.ts
- src/stores/use-auth-store.ts

Nhiệm vụ:
- Kiểm tra hoặc bổ sung nền tảng project theo rule.

Ràng buộc:
- Chỉ sửa file trong phạm vi task.
- Không đổi package manager.
- Không tạo npm/yarn/pnpm lockfile.
- Không bịa API/env.

Sau khi code:
- Chạy bun run check-types nếu có sửa code.
- Tóm tắt file đã sửa và rủi ro còn lại.
```

### Lỗi dễ gặp

- Dùng `next lint`.
- Tạo route sai App Router.
- Thêm env không public cho client-side.
- Quên đọc `AGENTS.md`.
