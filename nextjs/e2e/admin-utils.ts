import { type Page, type APIRequestContext } from '@playwright/test';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const CONTROL_PLANE_BASE = 'http://localhost:3100';
export const CHURCH_API_BASE = 'http://localhost:3002';

const CONTROL_ADMIN_EMAIL = 'owner@churchnepal.com';
const CONTROL_ADMIN_PASSWORD = 'changeme123';

const TEMP_DIR = path.join(process.env.TEMP || '/tmp', 'kilo-e2e');

let _controlToken: string | null = null;
let _createdChurchSlug: string | null = null;

function sha1Hmac(key: Buffer, message: Buffer): Buffer {
  return crypto.createHmac('sha1', key).update(message).digest();
}

function generateTotpCode(secret: string): string {
  const key = Buffer.from(secret, 'base64');
  const epoch = Math.floor(Date.now() / 1000 / 30);
  const msg = Buffer.alloc(8);
  msg.writeUInt32BE(epoch, 4);
  const hmac = sha1Hmac(key, msg);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, '0');
}

export async function seedChurchAndAdmin(request: APIRequestContext): Promise<{
  email: string;
  password: string;
  slug: string;
}> {
  if (_createdChurchSlug) {
    return {
      email: `admin@${_createdChurchSlug}.churchnepal.com`,
      password: 'testpass123',
      slug: _createdChurchSlug,
    };
  }

  const loginResp = await request.post(`${CONTROL_PLANE_BASE}/api/auth/login`, {
    headers: { 'Content-Type': 'application/json' },
    data: {
      email: CONTROL_ADMIN_EMAIL,
      password: CONTROL_ADMIN_PASSWORD,
      code: generateTotpCode('JBSWY3DPEHPK3PXP'),
    },
  });

  if (!loginResp.ok()) {
    throw new Error(
      `Control-plane login failed (${loginResp.status()}): ${await loginResp.text()}\n` +
        'Ensure control-plane backend is running on port 3100.',
    );
  }

  const loginData = await loginResp.json();
  _controlToken = loginData.access_token ?? loginData.token;

  const slugSuffix = Date.now().toString(36);
  const churchName = `E2E Test Church ${slugSuffix}`;

  const createResp = await request.post(`${CONTROL_PLANE_BASE}/api/churches`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${_controlToken}`,
    },
    data: { name: churchName },
  });

  if (!createResp.ok()) {
    const body = await createResp.text();
    throw new Error(`Create church failed (${createResp.status()}): ${body}`);
  }

  const churchData = await createResp.json();
  const slug: string = churchData.slug;
  const adminEmail: string = churchData.admin_email;
  const adminPassword: string = churchData.admin_password;

  for (let i = 0; i < 40; i++) {
    await new Promise<void>(r => setTimeout(r, 1000));
    const statusResp = await request.get(
      `${CONTROL_PLANE_BASE}/api/churches/${churchData.id}`,
      { headers: { Authorization: `Bearer ${_controlToken}` } },
    );
    if (statusResp.ok()) {
      const data = await statusResp.json();
      if (data.status === 'active') break;
    }
  }

  _createdChurchSlug = slug;
  return { email: adminEmail, password: adminPassword, slug };
}

export async function loginAsAdmin(page: Page, email: string, password: string) {
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Email Address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /Sign In/i }).click();

  await page.waitForURL('**/admin/dashboard', { timeout: 20000 });
  await page.waitForLoadState('networkidle');
}

export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

export async function createTemporaryPng(fileName: string): Promise<string> {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
  const p = path.join(TEMP_DIR, `e2e-${Date.now()}-${fileName}`);
  fs.writeFileSync(
    p,
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    ),
  );
  return p;
}
