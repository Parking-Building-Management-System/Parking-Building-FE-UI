# Cách cài đặt và chạy project

Project này dùng Bun làm package manager và command runner chính. Không dùng npm, yarn hoặc pnpm để tránh lệch lockfile và lệch dependency.

## Cài dependencies

```bash
bun install
```

Lệnh này đọc `package.json` và `bun.lock`, sau đó cài dependency vào `node_modules`.

## Chạy dev server

```bash
bun run dev
```

Script hiện tại trong `package.json`:

```json
"dev": "bun --bun next dev"
```

Dev server thường chạy ở `http://localhost:3000`.

## Build production

```bash
bun run build
```

Script hiện tại:

```json
"build": "bun --bun next build"
```

`next.config.ts` đang có `output: 'standalone'`, phù hợp cho build/deploy dạng standalone.

## Start production build

```bash
bun run start
```

Chỉ chạy sau khi đã build.

## Check TypeScript

```bash
bun run check-types
```

Script hiện tại:

```json
"check-types": "tsc --noemit"
```

Nên chạy khi sửa TypeScript, API type, form schema, store hoặc route/component lớn.

## Lint

```bash
bun run lint
```

Script hiện tại dùng ESLint CLI:

```json
"lint": "eslint"
```

Không dùng `next lint`. Next.js 16 đã bỏ `next lint`, và rule dự án cũng yêu cầu dùng ESLint CLI.

Lưu ý: `package.json` vẫn có script `lint:fix` là `next lint --fix`. Không nên dùng script này cho đến khi team cập nhật lại, vì không phù hợp với Next.js 16.

## Format

```bash
bun run format
```

Script hiện tại:

```json
"format": "prettier --write ."
```

Prettier config đang dùng:

```json
{
    "singleQuote": true,
    "tabWidth": 4,
    "plugins": ["prettier-plugin-tailwindcss"]
}
```

Không cần format toàn project nếu task chỉ tạo/sửa Markdown nhỏ, trừ khi leader yêu cầu.

## Vì sao dùng Bun

Project đã có `bun.lock`. Lockfile này ghi lại phiên bản dependency chính xác mà Bun resolve được. Nếu một người dùng npm/yarn/pnpm, repo có thể sinh thêm `package-lock.json`, `yarn.lock` hoặc `pnpm-lock.yaml`, làm team bị lệch dependency.

Quy ước:

- Cài package: `bun install`.
- Chạy dev/build/check/lint: `bun run ...`.
- Không commit lockfile khác ngoài `bun.lock`.

## Environment variables

Frontend cần biết backend API base URL qua:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

File đọc env là `src/lib/api/api-url.ts`:

```ts
export const getApiUrl = (): string => {
    return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
};
```

Nếu không set env, app fallback về `http://localhost:8080`.

### Ví dụ `.env` local

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Nếu backend chạy port khác, sửa giá trị này rồi restart dev server.

### Vercel/demo/prod

Trên Vercel hoặc môi trường deploy, cần set:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

Không hardcode domain production vào source code.

## `NEXT_PUBLIC_*` là gì

Code client-side chạy trong browser chỉ đọc ổn định các env có prefix `NEXT_PUBLIC_`.

Vì login page, Axios client và React component chạy ở browser, base URL phải là:

```env
NEXT_PUBLIC_API_URL=...
```

Không dùng:

```env
API_URL=...
```

`API_URL` không public, thường chỉ phù hợp cho server-side code. Nếu dùng trong client component, có thể bị `undefined`.

## Common errors

### Đổi env nhưng app vẫn gọi URL cũ

Nguyên nhân thường gặp: chưa restart dev server.

Cách xử lý:

```bash
# dừng dev server hiện tại
bun run dev
```

### Backend chưa chạy

Triệu chứng:

- Login request fail.
- Browser Network tab báo connection refused.
- Console báo không kết nối được `localhost:8080`.

Kiểm tra backend Spring Boot đã chạy đúng port chưa.

### CORS/cookie issue

Auth refresh dùng HttpOnly cookie và Axios bật `withCredentials: true`. Backend cũng phải bật CORS credentials đúng origin frontend.

Nếu cookie không gửi:

- Kiểm tra `Access-Control-Allow-Credentials`.
- Kiểm tra origin frontend có được allow không.
- Kiểm tra SameSite/Secure cookie giữa local và production.

### Gọi nhầm port 3000 thay vì 8080

Frontend dev server là `localhost:3000`. Backend API mặc định là `localhost:8080`.

Nếu request API đang đi tới `localhost:3000/auth/login`, nghĩa là base URL chưa đúng hoặc code đang gọi relative URL sai.

### Dùng nhầm package manager

Không chạy:

```bash
npm install
yarn
pnpm install
```

Nếu lỡ sinh lockfile khác, hỏi leader trước khi xóa/commit.
