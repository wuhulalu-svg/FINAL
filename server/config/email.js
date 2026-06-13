async function sendVerificationCode(email, code, type = 'reset') {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  let subject = '';
  let title = '';
  let actionDesc = '';

  if (type === 'reset') {
    subject = 'Smart Healthcare Tracker - 密码重置验证码';
    title = '🔐 密码重置';
    actionDesc = '您正在申请重置账户密码。';
  } else if (type === 'register') {
    subject = 'Smart Healthcare Tracker - 注册验证码';
    title = '📝 注册验证';
    actionDesc = '欢迎注册 Smart Healthcare Tracker！请使用以下验证码完成注册。';
  } else {
    subject = 'Smart Healthcare Tracker - 验证码';
    title = '验证码';
    actionDesc = '您的验证码如下：';
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Smart Healthcare <onboarding@resend.dev>',
        to: [email],
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;">
            <div style="background: white; border-radius: 12px; padding: 30px; text-align: center;">
              <h1 style="color: #667eea; margin-bottom: 20px;">${title}</h1>

              <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
                ${actionDesc}
              </p>

              <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #667eea;">
                  ${code}
                </span>
              </div>

              <p style="color: #666; font-size: 14px;">
                验证码有效期为 <strong>5分钟</strong>
              </p>

              <p style="color: #999; font-size: 12px; margin-top: 30px;">
                如果不是你操作，请忽略此邮件
              </p>

              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">

              <p style="color: #999; font-size: 12px;">
                Smart Healthcare Tracker
              </p>
            </div>
          </div>
        `
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Resend API失败:', data);
      return false;
    }

    console.log(`✅ 邮件发送成功: ${email}`);
    console.log(`📧 messageId: ${data.id}`);

    return true;

  } catch (error) {
    console.error('❌ Resend请求异常:', error);
    return false;
  }
}

module.exports = { sendVerificationCode };
