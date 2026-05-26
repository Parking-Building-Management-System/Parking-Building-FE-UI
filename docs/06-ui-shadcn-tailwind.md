# UI, shadcn/ui và Tailwind

Project dùng Tailwind CSS và shadcn/ui để build UI. Người mới nên ưu tiên dùng component có sẵn trước khi tự viết component mới.

## shadcn/ui trong project này

shadcn/ui không phải package đóng kín. Component được copy vào source code tại:

```txt
src/components/ui
```

Các component hiện có:

- `button.tsx`
- `card.tsx`
- `field.tsx`
- `form.tsx`
- `input.tsx`
- `label.tsx`
- `separator.tsx`
- `sonner.tsx`

Import bằng alias:

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
```

Không import từ đường dẫn relative dài nếu có thể dùng `@/`.

## `components.json`

File `components.json` cấu hình shadcn:

- `tsx: true`
- `rsc: true`
- Tailwind CSS file: `src/app/globals.css`
- Alias UI: `@/components/ui`
- Icon library: `lucide`
- Style: `radix-nova`

Nếu add component shadcn mới, cần giữ đúng alias và style hiện tại.

## Tailwind CSS

Tailwind dùng className trực tiếp:

```tsx
<div className="bg-muted text-muted-foreground rounded-xl p-4">...</div>
```

Khi cần merge class conditionally, dùng `cn()`:

```tsx
import { cn } from '@/lib/utils';

<div className={cn('rounded-xl border', className)} />;
```

`cn()` nằm ở `src/lib/utils.ts`, dùng `clsx` và `tailwind-merge`.

## `globals.css`

File:

```txt
src/app/globals.css
```

Đang chứa:

- Import Tailwind CSS.
- Import `tw-animate-css`.
- Import `shadcn/tailwind.css`.
- Theme token qua CSS variables.
- Light/dark variables.
- Base styles cho body/html.
- Custom CSS cho Sonner toast.

Theme token quan trọng:

- `bg-background`
- `text-foreground`
- `bg-muted`
- `text-muted-foreground`
- `bg-card`
- `text-card-foreground`
- `border-border`
- `bg-primary`
- `text-primary`
- `text-destructive`

Ưu tiên dùng token thay vì hardcode màu.

## Sonner

Root layout hiện đang dùng:

```tsx
import { Toaster } from 'sonner';
```

và render:

```tsx
<Toaster position="bottom-right" />
```

Project cũng có `src/components/ui/sonner.tsx`, wrapper này dùng `next-themes` và icon lucide. Nhưng hiện wrapper chưa được dùng ở root layout.

Toast CSS custom nằm trong `src/app/globals.css`:

- success: xanh lá.
- error: đỏ.
- warning: amber.
- info: xanh dương.

Khi dùng toast:

```tsx
toast.success('Login successfully!');
toast.error(error.message || 'Login failed');
```

## Các component UI đang dùng

### Button

File:

```txt
src/components/ui/button.tsx
```

Đang dùng trong home, login, protected nav, role welcome card.

Ví dụ:

```tsx
<Button type="submit" disabled={isPending}>
    {isPending ? 'Logging in...' : 'Login'}
</Button>
```

### Card

File:

```txt
src/components/ui/card.tsx
```

Đang dùng để bọc login form và role welcome card.

### Input

File:

```txt
src/components/ui/input.tsx
```

Đang dùng trong login form.

### Field

File:

```txt
src/components/ui/field.tsx
```

Login page dùng:

- `Field`
- `FieldGroup`
- `FieldLabel`
- `FieldError`
- `FieldDescription`

Pattern hiện tại:

```tsx
<Field>
    <FieldLabel htmlFor="username">Email</FieldLabel>
    <Input id="username" {...form.register('username')} />
    <FieldError errors={[form.formState.errors.username]} />
</Field>
```

### Form

File `src/components/ui/form.tsx` có wrapper cho React Hook Form kiểu shadcn cũ (`Form`, `FormField`, `FormItem`, ...). Login page hiện chưa dùng file này, mà dùng trực tiếp `Field` + `form.register`.

Khi làm form mới, nên xem style của login page trước để giữ consistency.

## Hướng dẫn tạo UI form

1. Nếu form là một màn hình độc lập, dùng `Card` để bọc nội dung chính.
2. Dùng `FieldGroup` để gom field.
3. Dùng `Field`, `FieldLabel`, `Input`, `FieldError`.
4. Disable input/button khi mutation pending.
5. Error backend hiển thị bằng toast hoặc inline nếu có field errors.

Ví dụ ngắn:

```tsx
<Field>
    <FieldLabel htmlFor="name">Name</FieldLabel>
    <Input id="name" disabled={mutation.isPending} />
    <FieldError errors={[form.formState.errors.name]} />
</Field>
```

## Password eye toggle

Login page có password visibility toggle bằng `useState` và icon lucide:

```tsx
const [showPassword, setShowPassword] = useState(false);
```

Icon:

```tsx
import { Eye, EyeOff } from 'lucide-react';
```

Vì dùng `useState`, file login phải có `'use client'`.

## Style cơ bản nên theo

- Ưu tiên token: `bg-muted`, `bg-background`, `text-muted-foreground`, `text-primary`.
- Dùng `rounded-xl`, `rounded-2xl`, `shadow-sm` vừa phải.
- Không hardcode màu lung tung nếu token đã có.
- Không tạo component UI mới nếu component shadcn hiện có đủ dùng.
- Dùng lucide icon cho button/icon.
- Giữ text trong button ngắn, không để tràn trên mobile.

## Common errors

### Import sai component

Đúng:

```tsx
import { Button } from '@/components/ui/button';
```

Không import từ package shadcn không tồn tại.

### Quên `'use client'`

Nếu dùng `useState`, `useMutation`, `useForm`, `useRouter`, event handler hoặc Zustand hook, thêm dòng đầu file:

```tsx
'use client';
```

### CSS không ăn

Kiểm tra:

- ClassName có truyền xuống component không.
- Selector trong `globals.css` có đúng không.
- Tailwind class có bị viết dynamic quá mức không.

### Sonner richColors override màu custom

Project đang custom toast bằng CSS selector `[data-sonner-toast]`. Nếu bật option Sonner khác như `richColors`, màu có thể khác kỳ vọng. Cần test lại toast success/error/warning/info.

### Sửa `src/components/ui` quá rộng

Sửa component trong `src/components/ui` có thể ảnh hưởng toàn app. Nếu chỉ muốn thay đổi một màn hình, sửa page/component của màn hình đó trước.
