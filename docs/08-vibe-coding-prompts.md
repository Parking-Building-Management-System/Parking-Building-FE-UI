# Prompt template dùng với Codex

Các prompt dưới đây dành cho team mới khi làm việc với Codex. Hãy thay phần trong dấu `[...]` bằng thông tin task thật.

Nguyên tắc chung:

- Luôn yêu cầu Codex đọc file liên quan trước khi code.
- Luôn ràng buộc không phá code cũ.
- Không bịa API, DTO, field hoặc endpoint.
- Nếu thiếu backend spec, yêu cầu Codex dừng và liệt kê thông tin cần hỏi.
- Sau khi code, yêu cầu chạy `bun run check-types`; chạy `bun run lint` nếu phù hợp.

## 1. Đọc hiểu module trước khi code

```txt
Bạn đang làm trong dự án SmartPark frontend dùng Next.js App Router + React + TypeScript strict + Bun + Tailwind + shadcn/ui + TanStack Query + Zustand + Axios.

Trước khi code hãy đọc:
- AGENTS.md
- docs/00-project-overview.md
- docs/02-routing-and-layout.md
- [các file module cần tìm hiểu]

Nhiệm vụ:
- Chưa code ngay.
- Hãy giải thích module [tên module] hiện đang hoạt động thế nào.
- Chỉ rõ file nào chịu trách nhiệm gì.
- Chỉ rõ flow UI -> API -> store/route nếu có.
- Liệt kê rủi ro trước khi sửa.

Ràng buộc:
- Không sửa file nào trong bước này.
- Không đoán API nếu chưa thấy trong code.
- Nếu thiếu backend spec, hãy ghi rõ cần hỏi gì.

Sau khi phân tích:
- Đề xuất kế hoạch code ngắn gọn theo từng file.
```

## 2. Tạo UI page mới

```txt
Bạn đang làm trong dự án SmartPark Next.js App Router + TypeScript + Tailwind + shadcn/ui.

Trước khi code hãy đọc:
- AGENTS.md
- docs/02-routing-and-layout.md
- docs/06-ui-shadcn-tailwind.md
- src/app/(protected)/layout.tsx
- src/components/ui/button.tsx
- src/components/ui/card.tsx

Nhiệm vụ:
- Tạo page mới tại route [URL mong muốn].
- File route nên nằm ở [đường dẫn page.tsx dự kiến].
- Dựng UI bằng tiếng Anh.
- Dùng shadcn/ui component hiện có và Tailwind token.

Ràng buộc:
- Không sửa logic auth/API/store.
- Không đổi URL route hiện tại.
- Không thêm UI library mới.
- Không sửa src/components/ui nếu không thật sự cần.

Sau khi code:
- Chạy bun run check-types.
- Chạy bun run lint nếu phù hợp.
- Tóm tắt file đã tạo/sửa.
```

## 3. Tạo form với React Hook Form + Zod + shadcn

```txt
Bạn đang làm trong dự án SmartPark dùng React Hook Form + Zod + shadcn/ui.

Trước khi code hãy đọc:
- AGENTS.md
- docs/06-ui-shadcn-tailwind.md
- src/app/auth/login/page.tsx
- src/service/user/type.ts
- src/components/ui/field.tsx
- src/components/ui/input.tsx
- src/components/ui/button.tsx

Nhiệm vụ:
- Tạo form [tên form].
- Field gồm: [liệt kê field].
- Validate bằng Zod theo backend DTO/spec.
- Hiển thị lỗi bằng FieldError.
- Disable input/button khi mutation pending nếu có submit API.

Ràng buộc:
- Không bịa field không có trong backend DTO.
- Không gọi axios trực tiếp trong UI.
- Không sửa form login nếu task không liên quan.
- Nếu thiếu backend DTO/spec, hãy dừng lại và liệt kê thông tin cần hỏi.

Sau khi code:
- Chạy bun run check-types.
- Chạy bun run lint nếu phù hợp.
- Tóm tắt file đã sửa.
```

## 4. Tích hợp GET API bằng TanStack Query

```txt
Bạn đang làm trong dự án SmartPark dùng Axios apiClient và TanStack Query.

Trước khi code hãy đọc:
- AGENTS.md
- docs/04-api-and-react-query.md
- src/lib/api/axios-config.ts
- src/service/user/api.ts
- src/service/user/type.ts
- [backend DTO/spec được cung cấp]
- [page/component cần tích hợp]

Nhiệm vụ:
- Tích hợp GET API [method/path].
- Tạo type response trong src/service/[domain]/type.ts.
- Tạo function API trong src/service/[domain]/api.ts.
- Gọi API bằng useQuery trong page/component.
- Thêm loading, error, empty state.

Ràng buộc:
- Không gọi axios trực tiếp trong UI.
- Không bịa response API.
- Không sửa interceptor nếu không cần.
- Nếu thiếu method/path/response shape, hãy dừng và liệt kê cần hỏi.

Sau khi code:
- Chạy bun run check-types.
- Chạy bun run lint nếu phù hợp.
- Tóm tắt file đã sửa.
```

## 5. Tích hợp POST/PUT/DELETE API bằng useMutation

```txt
Bạn đang làm trong dự án SmartPark dùng TanStack Query useMutation + Axios apiClient + Sonner.

Trước khi code hãy đọc:
- AGENTS.md
- docs/04-api-and-react-query.md
- src/lib/api/axios-config.ts
- src/service/user/api.ts
- src/service/user/type.ts
- [backend DTO/spec được cung cấp]
- [page/component cần tích hợp]

Nhiệm vụ:
- Tích hợp [POST/PUT/DELETE] API [path].
- Tạo request/response type trong src/service/[domain]/type.ts.
- Tạo API function trong src/service/[domain]/api.ts.
- Gọi bằng useMutation.
- Toast success/error.
- Invalidate query liên quan sau success.

Ràng buộc:
- Không gọi axios trực tiếp trong UI.
- Không bịa request/response.
- Không optimistic update nếu chưa cần hoặc chưa đủ chắc.
- Nếu thiếu backend DTO/spec, hãy dừng lại và liệt kê thông tin cần hỏi.

Sau khi code:
- Chạy bun run check-types.
- Chạy bun run lint nếu phù hợp.
- Tóm tắt file đã sửa.
```

## 6. Tạo table danh sách

```txt
Bạn đang làm table list trong SmartPark frontend.

Trước khi code hãy đọc:
- AGENTS.md
- docs/04-api-and-react-query.md
- docs/06-ui-shadcn-tailwind.md
- src/components/ui/card.tsx
- src/lib/api/axios-config.ts
- [service/page liên quan]

Nhiệm vụ:
- Tạo table danh sách [Tenant/Customer/...].
- Nếu có API, dùng useQuery và service layer.
- Hiển thị loading/error/empty.
- Cột gồm: [liệt kê cột].

Ràng buộc:
- Không bịa data/API.
- Không gọi axios trực tiếp trong UI.
- Không đặt business table vào src/components/ui.
- Nếu thiếu backend spec, hãy dừng và liệt kê cần hỏi.

Sau khi code:
- Chạy bun run check-types.
- Chạy bun run lint nếu phù hợp.
- Tóm tắt file đã sửa.
```

## 7. Tạo dialog create/edit

```txt
Bạn đang làm create/edit dialog trong SmartPark frontend với React Hook Form + Zod + shadcn/ui + TanStack Query.

Trước khi code hãy đọc:
- AGENTS.md
- docs/04-api-and-react-query.md
- docs/06-ui-shadcn-tailwind.md
- src/app/auth/login/page.tsx
- [list page liên quan]
- [service type/api liên quan]

Nhiệm vụ:
- Tạo dialog [create/edit] cho [entity].
- Form field gồm: [liệt kê field].
- Validate bằng Zod theo backend DTO.
- Submit bằng useMutation.
- Toast success/error và invalidate query list.

Ràng buộc:
- Nếu project chưa có Dialog component trong src/components/ui, hãy hỏi leader trước khi add shadcn component mới.
- Không bịa request body/response.
- Không gọi axios trực tiếp trong UI.
- Không sửa file ngoài phạm vi nếu không cần.

Sau khi code:
- Chạy bun run check-types.
- Chạy bun run lint nếu phù hợp.
- Tóm tắt file đã sửa.
```

## 8. Thêm sidebar item theo role

```txt
Bạn đang làm sidebar/navigation theo role trong SmartPark.

Trước khi code hãy đọc:
- AGENTS.md
- docs/02-routing-and-layout.md
- docs/05-zustand-store.md
- src/app/(protected)/layout.tsx
- src/stores/use-auth-store.ts
- src/service/user/type.ts

Nhiệm vụ:
- Thêm sidebar item [title/href].
- Chỉ hiển thị cho role [roles].
- Nếu cần route mới, tạo đúng page.tsx dưới src/app/(protected).

Ràng buộc:
- Không đổi URL hiện tại.
- Không coi frontend role filter là security boundary.
- Không sửa auth login flow.
- Không tạo Page.tsx/index.tsx trong App Router.

Sau khi code:
- Chạy bun run check-types.
- Chạy bun run lint nếu phù hợp.
- Tóm tắt file đã sửa.
```

## 9. Sửa bug TypeScript

```txt
Bạn đang sửa bug TypeScript trong SmartPark frontend strict mode.

Trước khi code hãy đọc:
- AGENTS.md
- file đang báo lỗi TypeScript
- type/service liên quan
- docs/04-api-and-react-query.md nếu lỗi liên quan API

Nhiệm vụ:
- Chạy bun run check-types để lấy lỗi.
- Sửa lỗi TypeScript tại [mô tả lỗi].
- Giữ behavior hiện tại nếu task chỉ là type fix.

Ràng buộc:
- Không dùng any để né lỗi trừ khi có lý do rõ và giải thích.
- Không bịa API type.
- Không refactor rộng ngoài phạm vi bug.
- Không sửa file unrelated.

Sau khi code:
- Chạy lại bun run check-types.
- Chạy bun run lint nếu phù hợp.
- Tóm tắt lỗi đã sửa.
```

## 10. Sửa bug route 404 trong Next App Router

```txt
Bạn đang sửa bug 404 route trong SmartPark Next.js App Router.

Trước khi code hãy đọc:
- AGENTS.md
- docs/02-routing-and-layout.md
- src/app directory tree
- src/app/layout.tsx
- src/app/(protected)/layout.tsx nếu route thuộc protected

Nhiệm vụ:
- Route [URL bị 404] đang không hoạt động.
- Kiểm tra folder/file page.tsx đúng chưa.
- Kiểm tra route group có bị hiểu nhầm thành URL không.
- Sửa đúng cấu trúc App Router.

Ràng buộc:
- Không tạo index.tsx.
- Không tạo Page.tsx.
- Không move route khác nếu không cần.
- Không sửa logic auth/API.

Sau khi code:
- Chạy bun run check-types nếu có sửa TS/TSX.
- Tóm tắt nguyên nhân 404 và file đã sửa.
```

## 11. Thêm loading/error/empty state

```txt
Bạn đang bổ sung loading/error/empty state cho SmartPark frontend.

Trước khi code hãy đọc:
- AGENTS.md
- docs/04-api-and-react-query.md
- page/component đang fetch data
- service api/type liên quan

Nhiệm vụ:
- Thêm loading state khi query đang tải.
- Thêm error state khi query lỗi.
- Thêm empty state khi data rỗng.
- Giữ UI style theo shadcn/Tailwind token.

Ràng buộc:
- Không đổi API behavior.
- Không bịa data.
- Không gọi API thêm nếu không cần.
- Không sửa file ngoài phạm vi.

Sau khi code:
- Chạy bun run check-types.
- Chạy bun run lint nếu phù hợp.
- Tóm tắt file đã sửa.
```

## 12. Refactor component lớn thành component nhỏ

```txt
Bạn đang refactor component lớn trong SmartPark frontend.

Trước khi code hãy đọc:
- AGENTS.md
- component cần refactor
- các file import component đó
- docs/06-ui-shadcn-tailwind.md

Nhiệm vụ:
- Tách component [tên component] thành component nhỏ hơn.
- Giữ behavior và UI hiện tại.
- Tên component rõ theo trách nhiệm.
- Không đổi public props nếu không cần.

Ràng buộc:
- Không refactor logic auth/API ngoài phạm vi.
- Không sửa business behavior.
- Không tạo abstraction quá sớm nếu chỉ dùng một lần.
- Không đổi route.

Sau khi code:
- Chạy bun run check-types.
- Chạy bun run lint nếu phù hợp.
- Tóm tắt component đã tách và lý do.
```
