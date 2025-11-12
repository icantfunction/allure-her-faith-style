export const EMAIL_TEMPLATES = {
  blank: {
    name: "Blank Template",
    description: "Start from scratch",
    html: ""
  },
  newsletter: {
    name: "Newsletter",
    description: "Product updates and news",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: hsl(0 0% 0%); color: hsl(0 0% 100%); padding: 40px 20px; text-align: center; }
    .content { padding: 30px 20px; background: hsl(0 0% 100%); }
    .footer { background: hsl(0 0% 96%); padding: 20px; text-align: center; font-size: 12px; color: hsl(0 0% 40%); }
    .button { display: inline-block; padding: 12px 30px; background: hsl(0 0% 0%); color: hsl(0 0% 100%); text-decoration: none; border-radius: 4px; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{companyName}}</h1>
    </div>
    <div class="content">
      <h2>What's New This Month</h2>
      <p>Hi {{firstName}},</p>
      <p>We have exciting updates to share with you...</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="#" class="button">Read More</a>
      </p>
    </div>
    <div class="footer">
      <p>© 2025 {{companyName}}. All rights reserved.</p>
      <p><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`
  },
  promotion: {
    name: "Promotion/Sale",
    description: "Announce sales and special offers",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: hsl(0 0% 98%); }
    .container { max-width: 600px; margin: 0 auto; background: hsl(0 0% 100%); }
    .banner { background: linear-gradient(135deg, hsl(245 58% 65%) 0%, hsl(270 50% 50%) 100%); color: hsl(0 0% 100%); padding: 60px 20px; text-align: center; }
    .banner h1 { font-size: 48px; margin: 0; }
    .discount { font-size: 72px; font-weight: bold; margin: 20px 0; }
    .content { padding: 40px 20px; text-align: center; }
    .button { display: inline-block; padding: 16px 40px; background: hsl(0 0% 0%); color: hsl(0 0% 100%); text-decoration: none; border-radius: 50px; font-size: 18px; font-weight: bold; }
    .footer { background: hsl(0 0% 96%); padding: 20px; text-align: center; font-size: 12px; color: hsl(0 0% 40%); }
    @media only screen and (max-width: 600px) {
      .banner h1 { font-size: 32px; }
      .discount { font-size: 48px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="banner">
      <h1>EXCLUSIVE OFFER</h1>
      <div class="discount">30% OFF</div>
      <p style="font-size: 20px;">Limited Time Only</p>
    </div>
    <div class="content">
      <h2>Hi {{firstName}}!</h2>
      <p style="font-size: 16px; line-height: 1.6;">
        As a valued customer, enjoy an exclusive 30% discount on your next purchase.
        Use code <strong>SAVE30</strong> at checkout.
      </p>
      <p style="margin: 40px 0;">
        <a href="#" class="button">Shop Now</a>
      </p>
      <p style="color: hsl(0 0% 60%); font-size: 14px;">*Offer expires in 48 hours</p>
    </div>
    <div class="footer">
      <p>© 2025 {{companyName}}. All rights reserved.</p>
      <p><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`
  },
  announcement: {
    name: "Simple Announcement",
    description: "Clean, text-focused message",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: Georgia, serif; background: hsl(0 0% 98%); }
    .container { max-width: 600px; margin: 40px auto; background: hsl(0 0% 100%); border: 1px solid hsl(0 0% 88%); }
    .content { padding: 50px 40px; }
    .content h1 { font-size: 28px; margin-bottom: 20px; color: hsl(0 0% 20%); }
    .content p { font-size: 16px; line-height: 1.8; color: hsl(0 0% 33%); margin-bottom: 20px; }
    .signature { margin-top: 40px; font-style: italic; color: hsl(0 0% 47%); }
    .footer { background: hsl(0 0% 96%); padding: 20px 40px; text-align: center; font-size: 12px; color: hsl(0 0% 60%); }
    @media only screen and (max-width: 600px) {
      .content { padding: 30px 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <h1>Important Update</h1>
      <p>Dear {{firstName}},</p>
      <p>We wanted to personally reach out to share some important news...</p>
      <p>Your feedback and continued support mean everything to us.</p>
      <p class="signature">— The {{companyName}} Team</p>
    </div>
    <div class="footer">
      <p>© 2025 {{companyName}}</p>
      <p><a href="{{unsubscribeUrl}}" style="color: hsl(0 0% 60%);">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`
  }
};

export const PERSONALIZATION_VARIABLES = [
  { token: "{{firstName}}", description: "Subscriber's first name" },
  { token: "{{email}}", description: "Subscriber's email address" },
  { token: "{{companyName}}", description: "Your company name" },
  { token: "{{unsubscribeUrl}}", description: "Unsubscribe link" },
];

export const HTML_SNIPPETS = {
  button: {
    name: "Button/CTA",
    html: `<p style="text-align: center; margin: 30px 0;">
  <a href="YOUR_LINK_HERE" style="display: inline-block; padding: 14px 32px; background: hsl(0 0% 0%); color: hsl(0 0% 100%); text-decoration: none; border-radius: 4px; font-weight: bold;">Click Here</a>
</p>`
  },
  divider: {
    name: "Divider",
    html: `<hr style="border: none; border-top: 1px solid hsl(0 0% 88%); margin: 30px 0;">`
  },
  image: {
    name: "Image",
    html: `<p style="text-align: center; margin: 20px 0;">
  <img src="YOUR_IMAGE_URL" alt="Description" style="max-width: 100%; height: auto; display: block; margin: 0 auto;">
</p>`
  },
  twoColumn: {
    name: "Two Columns",
    html: `<table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
  <tr>
    <td width="48%" style="vertical-align: top; padding-right: 2%;">
      <h3>Column 1</h3>
      <p>Add your content here...</p>
    </td>
    <td width="48%" style="vertical-align: top; padding-left: 2%;">
      <h3>Column 2</h3>
      <p>Add your content here...</p>
    </td>
  </tr>
</table>`
  },
  socialLinks: {
    name: "Social Media Links",
    html: `<p style="text-align: center; margin: 30px 0;">
  <a href="#" style="margin: 0 10px; text-decoration: none; color: hsl(0 0% 20%);">Facebook</a>
  <a href="#" style="margin: 0 10px; text-decoration: none; color: hsl(0 0% 20%);">Instagram</a>
  <a href="#" style="margin: 0 10px; text-decoration: none; color: hsl(0 0% 20%);">Twitter</a>
</p>`
  }
};
