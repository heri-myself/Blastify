# WA Broadcast Tools — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Setup monorepo pnpm, koneksi Supabase, skema database lengkap, dan auth (login/register) yang berfungsi di Next.js.

**Architecture:** Monorepo pnpm workspaces dengan dua app (web + worker) dan satu shared package (db). Supabase sebagai database + auth + storage. Next.js App Router untuk web.

**Tech Stack:** Node.js 20, pnpm workspaces, Next.js 16, TypeScript, Supabase JS v2, shadcn/ui, Tailwind CSS

---

## File Structure

```
wa-broadcast-tools/
├── package.json                          # pnpm workspace root
├── pnpm-workspace.yaml
├── turbo.json                            # (opsional, bisa skip dulu)
├── .env.example
├── packages/
│   └── db/
│       ├── package.json
│       ├── src/
│       │   ├── index.ts                  # export semua
│       │   ├── client.ts                 # Supabase client (server & browser)
│       │   └── types.ts                  # generated types dari Supabase
│       └── tsconfig.json
└── apps/
    ├── web/
    │   ├── package.json
    │   ├── next.config.ts
    │   ├── tsconfig.json
    │   ├── tailwind.config.ts
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx                  # redirect ke /dashboard atau /login
    │   │   ├── (auth)/
    │   │   │   ├── login/page.tsx
    │   │   │   └── register/page.tsx
    │   │   └── dashboard/
    │   │       ├── layout.tsx            # sidebar + auth guard
    │   │       └── page.tsx              # placeholder "Dashboard"
    │   ├── components/
    │   │   ├── ui/                       # shadcn components
    │   │   └── auth-form.tsx
    │   └── lib/
    │       ├── supabase/
    │       │   ├── client.ts             # browser client
    │       │   └── server.ts             # server client (cookies)
    │       └── utils.ts
    └── worker/
        ├── package.json
        ├── tsconfig.json
        └── src/
            └── index.ts                  # placeholder "Worker started"
```

---

### Task 1: Init Monorepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.env.example`
- Create: `.gitignore`

- [ ] **Step 1: Buat root package.json**

```json
{
  "name": "wa-broadcast-tools",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev:web": "pnpm --filter web dev",
    "dev:worker": "pnpm --filter worker dev",
    "build": "pnpm --filter web build"
  },
  "engines": {
    "node": ">=20",
    "pnpm": ">=9"
  }
}
```

- [ ] **Step 2: Buat pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Buat .env.example**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 4: Buat .gitignore**

```
node_modules/
.env
.env.local
.next/
dist/
.turbo/
*.session.json
auth_info_*/
```

- [ ] **Step 5: Init git dan commit**

```bash
cd "/Applications/Works/QuranBest/Vibe Code/WA Broadcast Tools"
git init
git add .
git commit -m "chore: init monorepo structure"
```

---

### Task 2: Setup Package DB (Shared Types)

**Files:**
- Create: `packages/db/package.json`
- Create: `packages/db/tsconfig.json`
- Create: `packages/db/src/types.ts`
- Create: `packages/db/src/client.ts`
- Create: `packages/db/src/index.ts`

- [ ] **Step 1: Buat packages/db/package.json**

```json
{
  "name": "@wa-broadcast/db",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.47.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Buat packages/db/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true
  }
}
```

- [ ] **Step 3: Buat packages/db/src/types.ts**

```typescript
export type SenderStatus = 'active' | 'soft_banned' | 'recovering' | 'warmup' | 'disabled'
export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'done' | 'failed'
export type ContactStatus = 'pending' | 'sending' | 'sent' | 'delivered' | 'failed' | 'skipped'
export type FileType = 'image' | 'document' | 'video'
export type MessageType = 'text' | 'image' | 'document' | 'button'
export type DeliveryEvent = 'sent' | 'delivered' | 'failed' | 'blocked' | 'retry'

export interface SenderPhone {
  id: string
  user_id: string
  phone_number: string
  display_name: string | null
  status: SenderStatus
  consecutive_failures: number
  banned_at: string | null
  recover_at: string | null
  warmup_day: number
  daily_sent: number
  last_sent_at: string | null
  session_data: Record<string, unknown> | null
  created_at: string
}

export interface Contact {
  id: string
  user_id: string
  phone: string
  name: string | null
  tags: string[]
  extra_data: Record<string, unknown> | null
  opt_in_at: string | null
  opt_out_at: string | null
  last_received_at: string | null
  is_blocked: boolean
  created_at: string
}

export interface MediaFile {
  id: string
  user_id: string
  filename: string
  storage_path: string
  public_url: string
  file_type: FileType
  file_size: number
  created_at: string
}

export interface Campaign {
  id: string
  user_id: string
  name: string
  status: CampaignStatus
  scheduled_at: string | null
  started_at: string | null
  finished_at: string | null
  target_filter: Record<string, unknown> | null
  sender_rotation: string[] | null
  created_at: string
}

export interface CampaignMessage {
  id: string
  campaign_id: string
  order_index: number
  type: MessageType
  content: string | null
  media_url: string | null
  buttons: Array<{ text: string; url: string }> | null
}

export interface CampaignContact {
  id: string
  campaign_id: string
  contact_id: string
  sender_phone_id: string | null
  status: ContactStatus
  scheduled_at: string | null
  sent_at: string | null
  delivered_at: string | null
  error_code: string | null
  retry_count: number
}

export interface DeliveryLog {
  id: string
  campaign_contact_id: string
  event: DeliveryEvent
  details: Record<string, unknown> | null
  created_at: string
}
```

- [ ] **Step 4: Buat packages/db/src/client.ts**

```typescript
import { createClient } from '@supabase/supabase-js'

export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function createServerClient(supabaseUrl: string, supabaseKey: string) {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false
    }
  })
}
```

- [ ] **Step 5: Buat packages/db/src/index.ts**

```typescript
export * from './types'
export * from './client'
```

- [ ] **Step 6: Install dependencies dan commit**

```bash
cd "/Applications/Works/QuranBest/Vibe Code/WA Broadcast Tools"
pnpm install
git add .
git commit -m "feat: add shared db package with types"
```

---

### Task 3: Setup Next.js Web App

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.js`

- [ ] **Step 1: Buat apps/web/package.json**

```json
{
  "name": "web",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/ssr": "^0.5.0",
    "@supabase/supabase-js": "^2.47.0",
    "@wa-broadcast/db": "workspace:*",
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Buat apps/web/next.config.ts**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@wa-broadcast/db'],
}

export default nextConfig
```

- [ ] **Step 3: Buat apps/web/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Buat apps/web/tailwind.config.ts**

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config
```

- [ ] **Step 5: Buat apps/web/postcss.config.js**

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: Install dan commit**

```bash
cd "/Applications/Works/QuranBest/Vibe Code/WA Broadcast Tools"
pnpm install
git add .
git commit -m "feat: scaffold Next.js web app"
```

---

### Task 4: Setup Supabase & Migrasi Database

**Files:**
- Create: `apps/web/lib/supabase/client.ts`
- Create: `apps/web/lib/supabase/server.ts`
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Install Supabase CLI (jika belum ada)**

```bash
brew install supabase/tap/supabase
supabase --version
# Expected: supabase version 1.x.x
```

- [ ] **Step 2: Init Supabase di root project**

```bash
cd "/Applications/Works/QuranBest/Vibe Code/WA Broadcast Tools"
supabase init
```

- [ ] **Step 3: Buat file migrasi**

Buat file `supabase/migrations/001_initial_schema.sql`:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- sender_phones
CREATE TABLE sender_phones (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  phone_number text NOT NULL,
  display_name text,
  status text NOT NULL DEFAULT 'warmup' CHECK (status IN ('active','soft_banned','recovering','warmup','disabled')),
  consecutive_failures int NOT NULL DEFAULT 0,
  banned_at timestamptz,
  recover_at timestamptz,
  warmup_day int NOT NULL DEFAULT 0,
  daily_sent int NOT NULL DEFAULT 0,
  last_sent_at timestamptz,
  session_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- contacts
CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  phone text NOT NULL,
  name text,
  tags text[] NOT NULL DEFAULT '{}',
  extra_data jsonb,
  opt_in_at timestamptz,
  opt_out_at timestamptz,
  last_received_at timestamptz,
  is_blocked bool NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, phone)
);

-- media_files
CREATE TABLE media_files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('image','document','video')),
  file_size int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- campaigns
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','running','paused','done','failed')),
  scheduled_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  target_filter jsonb,
  sender_rotation jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- campaign_messages
CREATE TABLE campaign_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid REFERENCES campaigns ON DELETE CASCADE NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  type text NOT NULL CHECK (type IN ('text','image','document','button')),
  content text,
  media_url text,
  buttons jsonb
);

-- campaign_contacts
CREATE TABLE campaign_contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid REFERENCES campaigns ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES contacts ON DELETE CASCADE NOT NULL,
  sender_phone_id uuid REFERENCES sender_phones,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','delivered','failed','skipped')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  error_code text,
  retry_count int NOT NULL DEFAULT 0 CHECK (retry_count <= 2)
);

-- delivery_logs
CREATE TABLE delivery_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_contact_id uuid REFERENCES campaign_contacts ON DELETE CASCADE NOT NULL,
  event text NOT NULL CHECK (event IN ('sent','delivered','failed','blocked','retry')),
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index untuk performa
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_campaigns_user_id_status ON campaigns(user_id, status);
CREATE INDEX idx_campaign_contacts_campaign_status ON campaign_contacts(campaign_id, status);
CREATE INDEX idx_delivery_logs_created_at ON delivery_logs(created_at);

-- Row Level Security
ALTER TABLE sender_phones ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (user hanya bisa akses data miliknya)
CREATE POLICY "users can manage own sender_phones"
  ON sender_phones FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users can manage own contacts"
  ON contacts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users can manage own media_files"
  ON media_files FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users can manage own campaigns"
  ON campaigns FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users can manage own campaign_messages"
  ON campaign_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND user_id = auth.uid()));

CREATE POLICY "users can manage own campaign_contacts"
  ON campaign_contacts FOR ALL
  USING (EXISTS (SELECT 1 FROM campaigns WHERE id = campaign_id AND user_id = auth.uid()));

CREATE POLICY "users can view own delivery_logs"
  ON delivery_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM campaign_contacts cc
    JOIN campaigns c ON c.id = cc.campaign_id
    WHERE cc.id = campaign_contact_id AND c.user_id = auth.uid()
  ));
```

- [ ] **Step 4: Buat Supabase project baru di dashboard**

Buka https://supabase.com/dashboard → New Project → catat URL dan anon key

- [ ] **Step 5: Push migrasi ke Supabase**

```bash
cd "/Applications/Works/QuranBest/Vibe Code/WA Broadcast Tools"
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
# Expected: Migration applied successfully
```

- [ ] **Step 6: Buat Supabase Storage bucket**

Di Supabase Dashboard → Storage → New Bucket:
- Name: `media`
- Public: ✓ (centang)

- [ ] **Step 7: Buat apps/web/lib/supabase/client.ts**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 8: Buat apps/web/lib/supabase/server.ts**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 9: Salin .env.example ke .env.local dan isi nilainya**

```bash
cp "/Applications/Works/QuranBest/Vibe Code/WA Broadcast Tools/.env.example" \
   "/Applications/Works/QuranBest/Vibe Code/WA Broadcast Tools/apps/web/.env.local"
# Lalu isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY
```

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "feat: add database migration and supabase client setup"
```

---

### Task 5: Halaman Auth (Login & Register)

**Files:**
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/(auth)/login/page.tsx`
- Create: `apps/web/app/(auth)/register/page.tsx`
- Create: `apps/web/app/(auth)/login/actions.ts`
- Create: `apps/web/app/(auth)/register/actions.ts`
- Create: `apps/web/components/auth-form.tsx`

- [ ] **Step 1: Install shadcn/ui**

```bash
cd "/Applications/Works/QuranBest/Vibe Code/WA Broadcast Tools/apps/web"
npx shadcn@latest init --defaults
npx shadcn@latest add button input label card form
# Pilih: New York style, zinc color, CSS variables: yes
```

- [ ] **Step 2: Buat apps/web/app/layout.tsx**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WA Broadcast Tools',
  description: 'WhatsApp broadcast management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 3: Buat apps/web/app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Buat apps/web/app/page.tsx**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')
  redirect('/login')
}
```

- [ ] **Step 5: Buat apps/web/app/(auth)/login/actions.ts**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
```

- [ ] **Step 6: Buat apps/web/app/(auth)/register/actions.ts**

```typescript
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function register(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/dashboard')
}
```

- [ ] **Step 7: Buat apps/web/components/auth-form.tsx**

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthFormProps {
  title: string
  action: (formData: FormData) => Promise<{ error: string } | undefined>
  submitLabel: string
  footerLink?: { href: string; label: string }
}

export function AuthForm({ title, action, submitLabel, footerLink }: AuthFormProps) {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    const result = await action(formData)
    if (result?.error) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Memproses...' : submitLabel}
            </Button>
          </form>
          {footerLink && (
            <p className="mt-4 text-center text-sm text-gray-500">
              <a href={footerLink.href} className="text-blue-600 hover:underline">
                {footerLink.label}
              </a>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 8: Buat apps/web/app/(auth)/login/page.tsx**

```tsx
import { AuthForm } from '@/components/auth-form'
import { login } from './actions'

export default function LoginPage() {
  return (
    <AuthForm
      title="Masuk"
      action={login}
      submitLabel="Masuk"
      footerLink={{ href: '/register', label: 'Belum punya akun? Daftar' }}
    />
  )
}
```

- [ ] **Step 9: Buat apps/web/app/(auth)/register/page.tsx**

```tsx
import { AuthForm } from '@/components/auth-form'
import { register } from './actions'

export default function RegisterPage() {
  return (
    <AuthForm
      title="Daftar Akun"
      action={register}
      submitLabel="Daftar"
      footerLink={{ href: '/login', label: 'Sudah punya akun? Masuk' }}
    />
  )
}
```

- [ ] **Step 10: Buat apps/web/app/dashboard/layout.tsx (auth guard)**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <span className="font-semibold text-gray-800">WA Broadcast Tools</span>
        <form action="/api/auth/signout" method="post">
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">
            Keluar
          </button>
        </form>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}
```

- [ ] **Step 11: Buat apps/web/app/dashboard/page.tsx**

```tsx
export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-500">Selamat datang di WA Broadcast Tools.</p>
    </div>
  )
}
```

- [ ] **Step 12: Buat apps/web/app/api/auth/signout/route.ts**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
```

- [ ] **Step 13: Jalankan dev server dan test manual**

```bash
cd "/Applications/Works/QuranBest/Vibe Code/WA Broadcast Tools"
pnpm dev:web
```

Buka http://localhost:3000 — harus redirect ke /login.
Daftar akun baru → harus redirect ke /dashboard.
Refresh /dashboard → tetap di dashboard (auth guard bekerja).
Klik Keluar → harus kembali ke /login.

- [ ] **Step 14: Commit**

```bash
git add .
git commit -m "feat: add auth pages (login, register, signout)"
```

---

### Task 6: Setup Worker Placeholder

**Files:**
- Create: `apps/worker/package.json`
- Create: `apps/worker/tsconfig.json`
- Create: `apps/worker/src/index.ts`

- [ ] **Step 1: Buat apps/worker/package.json**

```json
{
  "name": "worker",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "tsx src/index.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.47.0",
    "@wa-broadcast/db": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

- [ ] **Step 2: Buat apps/worker/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Buat apps/worker/src/index.ts**

```typescript
console.log('[Worker] Started — WA Broadcast Worker v1.0.0')
console.log('[Worker] Waiting for Baileys setup in Plan 3...')

process.on('SIGTERM', () => {
  console.log('[Worker] Shutting down gracefully...')
  process.exit(0)
})
```

- [ ] **Step 4: Install dan test**

```bash
cd "/Applications/Works/QuranBest/Vibe Code/WA Broadcast Tools"
pnpm install
pnpm dev:worker
# Expected output:
# [Worker] Started — WA Broadcast Worker v1.0.0
# [Worker] Waiting for Baileys setup in Plan 3...
```

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: add worker placeholder"
```

---

## Verifikasi Plan 1 Selesai

Setelah semua task selesai, pastikan:

- [ ] `pnpm dev:web` → http://localhost:3000 bisa login/register
- [ ] `/dashboard` ter-protect (redirect ke /login jika belum login)
- [ ] Supabase dashboard → semua tabel terbuat
- [ ] `pnpm dev:worker` → menampilkan pesan startup

**Lanjut ke Plan 2** (Web Dashboard: contacts, media, campaign, sender UI) setelah Plan 1 verified.
