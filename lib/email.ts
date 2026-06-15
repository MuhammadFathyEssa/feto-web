// Server-side email helper. Sends transactional email through the FeTo backend,
// which relays via Gmail. Never import this into a client component.

const BACKEND_URL = process.env.BACKEND_URL || "";
const API_KEY = process.env.BACKEND_API_KEY || "";

export async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  if (!BACKEND_URL || !API_KEY) {
    console.error("[email] BACKEND_URL or BACKEND_API_KEY missing");
    return false;
  }
  try {
    const res = await fetch(`${BACKEND_URL}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
      body: JSON.stringify({ to, subject, body }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error(`[email] backend ${res.status}: ${t.slice(0, 200)}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] send error", e);
    return false;
  }
}

// ── Templates ─────────────────────────────────────────────────
const BRAND = "FeTo Executive Intelligence Platform";

export function accessApprovedEmail(name: string, loginUrl: string) {
  return {
    subject: "تم قبول طلبك للوصول إلى FeTo",
    body:
`مرحباً ${name}،

تم قبول طلبك للوصول إلى ${BRAND}.

يمكنك الآن تسجيل الدخول وبدء استخدام المنصة:
${loginUrl}

مع التحية،
فريق FeTo

—
You have been granted access to ${BRAND}. Sign in here: ${loginUrl}`,
  };
}

export function accessRejectedEmail(name: string) {
  return {
    subject: "بخصوص طلبك للوصول إلى FeTo",
    body:
`مرحباً ${name}،

نشكرك على اهتمامك بـ ${BRAND}.

بعد المراجعة، لم نتمكن من الموافقة على طلبك في الوقت الحالي.

مع التقدير،
فريق FeTo

—
After review, we are unable to approve your access request at this time. Thank you for your interest in ${BRAND}.`,
  };
}

export function passwordResetEmail(name: string, resetUrl: string) {
  return {
    subject: "إعادة تعيين كلمة المرور — FeTo",
    body:
`مرحباً ${name}،

تلقّينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في ${BRAND}.

اضغط على الرابط التالي لتعيين كلمة مرور جديدة (صالح لمدة ساعة واحدة):
${resetUrl}

إذا لم تطلب ذلك، تجاهل هذه الرسالة.

مع التحية،
فريق FeTo

—
Reset your password (link valid for 1 hour): ${resetUrl}
If you didn't request this, ignore this email.`,
  };
}
