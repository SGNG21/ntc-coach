import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { type, description, page, url } = await req.json();

    const typeLabel = type === 'bug' ? '🐛 Bug' : type === 'amelioration' ? '💡 Amélioration' : '❓ Question';
    const recipientEmail = process.env.FEEDBACK_EMAIL || 'geoffrey.nozza@gmail.com';
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.log(`[FEEDBACK] ${typeLabel} | Page: ${page}\n${description}`);
      return NextResponse.json({ ok: true });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'NTC Coach <onboarding@resend.dev>',
        to: [recipientEmail],
        subject: `[NTC Coach] ${typeLabel} — ${page}`,
        html: `
          <div style="font-family:sans-serif;max-width:580px;margin:0 auto">
            <div style="background:#1c3d5a;color:white;padding:14px 20px;border-radius:8px 8px 0 0;font-size:14px">
              <strong>NTC Coach</strong> · ${typeLabel}
            </div>
            <div style="background:#f5f5f4;padding:20px;border-radius:0 0 8px 8px;border:1px solid #e7e5e4;border-top:none">
              <table style="font-size:12px;color:#57534e;margin-bottom:14px;border-collapse:collapse">
                <tr><td style="padding:2px 8px 2px 0;font-weight:600">Onglet :</td><td>${page}</td></tr>
                <tr><td style="padding:2px 8px 2px 0;font-weight:600">URL :</td><td style="word-break:break-all">${url}</td></tr>
              </table>
              <div style="background:white;border:1px solid #e7e5e4;border-radius:6px;padding:14px;font-size:13.5px;color:#1c1917;line-height:1.5;white-space:pre-wrap">${description}</div>
            </div>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('Resend error:', err);
      return NextResponse.json({ error: 'Échec envoi email' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Feedback route error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
