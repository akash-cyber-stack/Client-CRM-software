import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { env, apiPublicUrl } from '../config/env.js';
import { assertSubscriptionActive } from './companyService.js';
import { toSafeUser, userSelectWithCompany } from '../utils/tenant.js';

const PROVIDERS = {
  google: {
    id: 'google',
    label: 'Google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: 'openid email profile',
    clientId: () => env.googleClientId,
    clientSecret: () => env.googleClientSecret,
  },
  microsoft: {
    id: 'microsoft',
    label: 'Microsoft',
    authUrl: `https://login.microsoftonline.com/${env.microsoftTenantId}/oauth2/v2.0/authorize`,
    tokenUrl: `https://login.microsoftonline.com/${env.microsoftTenantId}/oauth2/v2.0/token`,
    userUrl: 'https://graph.microsoft.com/v1.0/me',
    scope: 'openid email profile User.Read',
    clientId: () => env.microsoftClientId,
    clientSecret: () => env.microsoftClientSecret,
  },
  github: {
    id: 'github',
    label: 'GitHub',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userUrl: 'https://api.github.com/user',
    scope: 'read:user user:email',
    clientId: () => env.githubClientId,
    clientSecret: () => env.githubClientSecret,
  },
};

function signOAuthState(payload) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', env.jwtSecret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyOAuthState(state) {
  const [data, sig] = String(state).split('.');
  if (!data || !sig) return null;
  const expected = crypto.createHmac('sha256', env.jwtSecret).update(data).digest('base64url');
  if (sig !== expected) return null;
  try {
    return JSON.parse(Buffer.from(data, 'base64url').toString());
  } catch {
    return null;
  }
}

export function listOAuthProviders() {
  return Object.values(PROVIDERS).map((p) => ({
    id: p.id,
    label: p.label,
    enabled: Boolean(p.clientId() && p.clientSecret()),
  }));
}

export function getOAuthStartUrl(req, providerId) {
  const provider = PROVIDERS[providerId];
  if (!provider) throw Object.assign(new Error('Unknown provider'), { statusCode: 400 });
  if (!provider.clientId() || !provider.clientSecret()) {
    throw Object.assign(new Error(`${provider.label} login is not configured`), { statusCode: 503 });
  }

  const redirectUri = `${apiPublicUrl(req)}/api/auth/oauth/${providerId}/callback`;
  const state = signOAuthState({ provider: providerId, ts: Date.now() });

  const params = new URLSearchParams({
    client_id: provider.clientId(),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: provider.scope,
    state,
    prompt: 'select_account',
  });

  if (providerId === 'github') {
    params.set('allow_signup', 'true');
  }

  return `${provider.authUrl}?${params.toString()}`;
}

async function exchangeCode(req, provider, code) {
  const redirectUri = `${apiPublicUrl(req)}/api/auth/oauth/${provider.id}/callback`;
  const body = new URLSearchParams({
    client_id: provider.clientId(),
    client_secret: provider.clientSecret(),
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const headers = { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' };
  const res = await fetch(provider.tokenUrl, { method: 'POST', headers, body });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw Object.assign(new Error(data.error_description || data.error || 'OAuth token exchange failed'), {
      statusCode: 502,
    });
  }
  return data.access_token;
}

async function fetchProfile(provider, accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' };
  const res = await fetch(provider.userUrl, { headers });
  const data = await res.json();
  if (!res.ok) {
    throw Object.assign(new Error('Could not load profile from provider'), { statusCode: 502 });
  }

  if (provider.id === 'microsoft') {
    return {
      subject: data.id,
      email: (data.mail || data.userPrincipalName || '').toLowerCase(),
      name: data.displayName || data.givenName || 'User',
    };
  }

  if (provider.id === 'github') {
    let email = data.email;
    if (!email) {
      const er = await fetch('https://api.github.com/user/emails', { headers });
      const emails = await er.json();
      email = emails?.find((e) => e.primary)?.email || emails?.[0]?.email;
    }
    return {
      subject: String(data.id),
      email: String(email || '').toLowerCase(),
      name: data.name || data.login || 'User',
    };
  }

  return {
    subject: data.id,
    email: String(data.email || '').toLowerCase(),
    name: data.name || 'User',
  };
}

function issueSession(user) {
  const token = jwt.sign(
    { userId: user.id, role: user.role, companyId: user.companyId },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
  return { token, user: toSafeUser(user) };
}

export async function handleOAuthCallback(req, providerId, { code, state }) {
  const provider = PROVIDERS[providerId];
  if (!provider) throw Object.assign(new Error('Unknown provider'), { statusCode: 400 });

  const parsed = verifyOAuthState(state);
  if (!parsed?.provider) {
    throw Object.assign(new Error('Invalid OAuth state'), { statusCode: 400 });
  }

  const accessToken = await exchangeCode(req, provider, code);
  const profile = await fetchProfile(provider, accessToken);
  if (!profile.email) {
    throw Object.assign(new Error('Email not available from provider'), { statusCode: 400 });
  }

  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: profile.email },
        { oauthProvider: providerId, oauthSubject: profile.subject },
      ],
    },
    include: { company: true },
  });

  if (!user) {
    throw Object.assign(new Error('No account found. Register with email first, then use social login.'), {
      statusCode: 403,
    });
  }

  if (!user.oauthSubject) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { oauthProvider: providerId, oauthSubject: profile.subject },
      include: { company: true },
    });
  }

  if (user.status !== 'ACTIVE') {
    throw Object.assign(new Error('Your account is inactive'), { statusCode: 403 });
  }

  try {
    assertSubscriptionActive(user.company);
  } catch (err) {
    throw Object.assign(new Error(err.message), { statusCode: 403, code: err.code });
  }

  return issueSession(user);
}

export function oauthSuccessRedirect(token) {
  const base = env.frontendUrl.split(',')[0].trim();
  return `${base}/auth/callback?token=${encodeURIComponent(token)}`;
}

export function oauthErrorRedirect(message) {
  const base = env.frontendUrl.split(',')[0].trim();
  return `${base}/login?oauth_error=${encodeURIComponent(message)}`;
}
