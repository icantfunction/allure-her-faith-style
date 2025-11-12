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
  },
  vipBlackCard: {
    name: "VIP Black Card",
    description: "Wallet-ready membership status email",
    html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="x-apple-disable-message-reformatting">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{--brand:#3948AB;--accent:#FDB924;--bg:#0b0b0b;--card:#111;--ink:#eee}
body{margin:0;background:var(--bg);-webkit-text-size-adjust:100%}
table{border-collapse:collapse} img{display:block;border:0}
a{color:inherit;text-decoration:none}
.wrap{max-width:640px;margin:0 auto;background:var(--card);color:var(--ink);font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial}
.pad{padding:24px}
.h1{font-size:28px;line-height:1.15;margin:0 0 8px}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;opacity:.8}
.btn{display:inline-block;background:var(--accent);color:#111;font-weight:700;padding:14px 22px;border-radius:6px}
.cta-row a{margin-right:10px}
.card{background:#0d0d0f;border:1px solid #222;border-radius:14px;overflow:hidden}
.note{opacity:.65;font-size:12px}
@media (prefers-color-scheme: light){
  body{background:#f6f7fb}
  .wrap{background:#fff;color:#111}
  .btn{background:var(--brand);color:#fff}
}
</style>
</head>
<body>
  <div class="wrap">
    <div class="pad">
      <p class="mono" style="margin:0 0 8px 0">Member ID: {{member_id}}</p>
      <h1 class="h1">Welcome to {{program_name}}, {{firstName}}.</h1>
      <p style="margin:0 0 18px 0;opacity:.85">Your Black Card unlocks early access, private drops, and concierge support.</p>
    </div>

    <a href="https://yourdomain.com/vip?token={{token}}">
      <img alt="Your VIP Card" src="https://yourdomain.com/membercard.png?name={{firstName}}&tier={{tier}}&exp={{expiry}}&qr={{token}}"
           width="640" height="360">
    </a>

    <div class="pad">
      <div class="cta-row" style="margin:2px 0 14px">
        <a class="btn" href="https://yourdomain.com/passes/apple/{{token}}">Add to Apple Wallet</a>
        <a class="btn" href="https://yourdomain.com/passes/google/{{token}}">Add to Google Wallet</a>
      </div>

      <div class="card" style="padding:16px;display:flex;gap:16px;align-items:center">
        <img src="https://yourdomain.com/qr/{{token}}.png" width="120" height="120" alt="Scan code">
        <div>
          <p style="margin:0 0 6px 0"><strong>Show this at the door</strong></p>
          <p class="mono" style="margin:0">Valid through {{expiry}} · Tier {{tier}}</p>
        </div>
      </div>

      <div style="margin:18px 0 0 0">
        <p style="margin:0 0 10px 0"><strong>Next VIP window:</strong> {{drop_date}} at {{drop_time}} ({{tz}})</p>
        <a class="btn" href="https://yourdomain.com/calendar/{{drop_id}}.ics">Add to Calendar</a>
        <a class="btn" href="https://yourdomain.com/rsvp?drop={{drop_id}}&token={{token}}">RSVP</a>
      </div>

      <p class="note" style="margin:18px 0 0 0">If your email app blocks wallet passes, tap the card image or use the QR. Questions? Reply to this email—your concierge is real.</p>
    </div>
  </div>
</body>
</html>`
  },
  mysteryUnwrap: {
    name: "Mystery Unwrap",
    description: "Interactive peel-to-reveal product",
    html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="x-apple-disable-message-reformatting">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{--brand:#3948AB;--accent:#FDB924;--bg:#0b0b0b;--ink:#eee}
body{margin:0;background:var(--bg);-webkit-text-size-adjust:100%}
table{border-collapse:collapse} img{display:block;border:0}
a{color:inherit;text-decoration:none}
.wrap{max-width:640px;margin:0 auto;background:#111;color:var(--ink);font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial}
.pad{padding:22px}
.h1{font-size:28px;margin:0 0 10px}
.btn{display:inline-block;background:var(--accent);color:#111;font-weight:700;padding:14px 22px;border-radius:6px}
.reveal input{display:none}
.panel{position:relative;border-radius:14px;overflow:hidden;border:1px solid #222}
.teaser{position:absolute;inset:0;background:
linear-gradient(135deg,rgba(0,0,0,.75),rgba(0,0,0,.35)),
url('https://yourdomain.com/teaser.jpg') center/cover no-repeat;
display:flex;align-items:center;justify-content:center}
.teaser .cta{background:#000a;border:1px solid #333;border-radius:999px;padding:10px 16px}
.revealed{display:none}
#open:checked ~ .panel .teaser{display:none}
#open:checked ~ .panel .revealed{display:block}
.note{opacity:.65;font-size:12px}
@media (prefers-color-scheme: light){
  body{background:#f6f7fb}
  .wrap{background:#fff;color:#111}
  .btn{background:var(--brand);color:#fff}
}
@media (prefers-reduced-motion: reduce){*{animation:none}}
</style>
</head>
<body>
  <div class="wrap">
    <div class="pad">
      <h1 class="h1">{{firstName}}, should we show you a secret?</h1>
      <p style="margin:0 0 16px 0;opacity:.85">Tap the seal to reveal a hidden colorway & price. Limited to {{remaining}} units.</p>

      <div class="reveal">
        <input id="open" type="checkbox">
        <div class="panel">
          <div class="revealed">
            <img src="https://yourdomain.com/secret-hero.jpg" width="640" height="360" alt="Secret colorway">
            <div class="pad" style="padding-top:12px">
              <p style="margin:0 0 8px 0"><strong>Unlocked:</strong> {{secret_name}}</p>
              <p style="margin:0 0 14px 0">VIP Price: <strong>\${{secret_price}}</strong> · Code: <span style="font-family:ui-monospace">{{secret_code}}</span></p>
              <a class="btn" href="https://yourstore.com/cart?sku={{secret_sku}}&src=secret">Add to cart →</a>
              <a class="btn" href="https://yourstore.com/learn?sku={{secret_sku}}">See details</a>
            </div>
          </div>

          <label class="teaser" for="open" aria-label="Unwrap secret">
            <span class="cta">Tap to unwrap 🎁</span>
          </label>
          <img src="https://yourdomain.com/cover.jpg" width="640" height="360" alt="">
        </div>
      </div>

      <p class="note" style="margin:14px 0 0 0">Don't see the peel? Your app shows the secret by default. Outlook gets a static image + working buttons.</p>
    </div>
  </div>
</body>
</html>`
  },
  christianNewsletter: {
    name: "Christian Newsletter",
    description: "Weekly devotional with events and prayer",
    html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="x-apple-disable-message-reformatting">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{--brand:#3948AB;--accent:#FDB924;--bg:#0b0b0b;--ink:#eee;--card:#121214}
body{margin:0;background:var(--bg);-webkit-text-size-adjust:100%}
table{border-collapse:collapse} img{display:block;border:0}
a{color:inherit;text-decoration:none}
.wrap{max-width:700px;margin:0 auto;background:var(--card);color:var(--ink);font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial}
.header{padding:26px 22px;background:
linear-gradient(135deg, rgba(57,72,171,.25), rgba(253,185,36,.18));border-bottom:1px solid #232323}
.logo{font-weight:800;font-size:22px;letter-spacing:.3px}
.verse{font-size:20px;line-height:1.4;margin:12px 0 0}
.pad{padding:22px}
.h2{font-size:18px;margin:0 0 8px 0;text-transform:uppercase;letter-spacing:.8px;color:var(--accent)}
.card{border:1px solid #232323;border-radius:12px;overflow:hidden;background:#0e0e11}
.cta{display:inline-block;background:var(--accent);color:#111;font-weight:700;padding:12px 18px;border-radius:6px}
.row{display:flex;gap:16px;flex-wrap:wrap}
.col{flex:1 1 240px}
hr{border:none;border-top:1px solid #232323;margin:18px 0}
.small{opacity:.65;font-size:12px}
.acco input{display:none}
.acco label{display:block;cursor:pointer;font-weight:700;margin:6px 0}
.acco .pane{max-height:0;overflow:hidden;transition:max-height .35s ease}
.acco input:checked + label + .pane{max-height:2000px}
@media (prefers-color-scheme: light){
  body{background:#f6f7fb}
  .wrap{background:#fff;color:#111}
  .card{background:#fff;border-color:#e9e9ef}
  .cta{background:var(--brand);color:#fff}
}
@media (prefers-reduced-motion: reduce){.acco .pane{transition:none}}
</style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <table role="presentation" width="100%"><tr>
        <td class="logo">Fresh Fire Weekly</td>
        <td align="right"><a href="https://instagram.com/ffdanceministry">Instagram</a> • <a href="https://yourdomain.com">Website</a></td>
      </tr></table>
      <p class="verse"><em>"For our God is a consuming fire."</em> — Hebrews 12:29</p>
    </div>

    <div class="pad">
      <h2 class="h2">Devotional — {{week_title}}</h2>
      <div class="card">
        <img src="https://yourdomain.com/devotional-hero.jpg" width="700" height="320" alt="Devotional image">
        <div class="pad">
          <p style="margin:0 0 10px 0"><strong>{{scripture_ref}}</strong> ({{translation}})</p>
          <p style="margin:0 0 10px 0">{{devotional_intro}}</p>

          <div class="acco" style="margin-top:10px">
            <input id="r1" type="checkbox" checked>
            <label for="r1">Reflection & Prayer</label>
            <div class="pane">
              <p style="margin:8px 0 0 0">{{reflection_paragraph}}</p>
              <p style="margin:10px 0 0 0"><em>Prayer:</em> {{prayer_text}}</p>
            </div>
          </div>

          <a class="cta" href="https://yourdomain.com/reading-plan?week={{week_no}}">Join the reading plan →</a>
        </div>
      </div>
    </div>

    <div class="pad">
      <h2 class="h2">This Week at Church</h2>
      <div class="row">
        <div class="col card">
          <div class="pad">
            <h3 style="margin:0 0 6px 0">Sunday Worship</h3>
            <p style="margin:0 0 8px 0">Sun {{sun_date}} · {{sun_time}} · {{campus_name}}</p>
            <a class="cta" href="https://yourdomain.com/calendar/sunday.ics">Add to Calendar</a>
            <a class="cta" href="https://maps.google.com/?q={{address}}" style="margin-left:8px">Directions</a>
          </div>
        </div>
        <div class="col card">
          <div class="pad">
            <h3 style="margin:0 0 6px 0">Midweek Prayer</h3>
            <p style="margin:0 0 8px 0">Wed {{wed_date}} · {{wed_time}} · Prayer Chapel</p>
            <a class="cta" href="https://yourdomain.com/calendar/midweek.ics">Add to Calendar</a>
            <a class="cta" href="https://yourdomain.com/rsvp?event=midweek" style="margin-left:8px">RSVP</a>
          </div>
        </div>
      </div>
    </div>

    <div class="pad">
      <h2 class="h2">Testimony Spotlight</h2>
      <div class="card">
        <div class="pad">
          <p style="margin:0 0 8px 0"><strong>{{member_name}}</strong> · {{city}}</p>
          <p style="margin:0">{{testimony_excerpt}}</p>
          <hr>
          <a class="cta" href="https://yourdomain.com/testimonies/{{slug}}">Read full story →</a>
        </div>
      </div>
    </div>

    <div class="pad">
      <h2 class="h2">How can we pray for you?</h2>
      <div class="card">
        <div class="pad">
          <p style="margin:0 0 10px 0">Share a request and our team will pray this week.</p>
          <a class="cta" href="https://yourdomain.com/forms/prayer?email={{email}}">Send a prayer request</a>
          <p class="small" style="margin:8px 0 0 0">Replies to this email also go to our pastoral inbox.</p>
        </div>
      </div>
    </div>

    <div class="pad">
      <div class="row">
        <div class="col card">
          <div class="pad">
            <h3 style="margin:0 0 6px 0">Give Online</h3>
            <p style="margin:0 0 10px 0">Your generosity fuels ministry.</p>
            <a class="cta" href="https://yourdomain.com/give?amt=50">Give $50</a>
            <a class="cta" href="https://yourdomain.com/give" style="margin-left:8px">Choose amount</a>
          </div>
        </div>
        <div class="col card">
          <div class="pad">
            <h3 style="margin:0 0 6px 0">Message of the Week</h3>
            <p style="margin:0 0 10px 0">{{sermon_title}} — {{speaker}}</p>
            <a class="cta" href="{{youtube_url}}">Watch on YouTube</a>
            <a class="cta" href="{{spotify_url}}" style="margin-left:8px">Listen on Spotify</a>
          </div>
        </div>
      </div>
    </div>

    <div class="pad">
      <hr>
      <p class="small">You're receiving this because you opted in at services or online. <a href="{{unsubscribeUrl}}">Unsubscribe</a> • <a href="{{prefs}}">Manage preferences</a><br>
      {{church_name}} · {{address}}</p>
    </div>
  </div>
</body>
</html>`
  },
  configurator: {
    name: "Product Configurator",
    description: "Shoppable mini-app inside email",
    html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="x-apple-disable-message-reformatting">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;padding:0;background:#0b0b0b;-webkit-text-size-adjust:100%}
table{border-collapse:collapse}
img{display:block;border:0;line-height:0}
a{color:inherit;text-decoration:none}

input.cfg{display:none}
.cfg-wrap{max-width:640px;margin:0 auto;background:#111;color:#eee;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial}
.pad{padding:24px}

.hero{position:relative}
.frame{display:none}
#c-black:checked ~ .hero .img-black{display:block}
#c-blue:checked  ~ .hero .img-blue{display:block}
#c-sand:checked  ~ .hero .img-sand{display:block}
@supports not (selector(:has(*))) { .img-black{display:block} }

.swatches label{display:inline-block;border:1px solid #333;border-radius:999px;padding:6px 12px;margin:0 8px 0 0;cursor:pointer}
.swatches label span{display:inline-block;width:14px;height:14px;border-radius:50%;vertical-align:middle;margin-right:8px}
.swatch-black span{background:#000}
.swatch-blue  span{background:#3948AB}
.swatch-sand  span{background:#d6c8a5}
.swatches .active{outline:2px solid #888}

.sizes label{display:inline-block;border:1px solid #333;border-radius:8px;padding:8px 12px;margin:8px 8px 0 0;cursor:pointer}
#s-s,#s-m,#s-l,#s-xl{display:none}

.acco input{display:none}
.acco label{display:block;border-top:1px solid #222;padding:14px 0;cursor:pointer}
.acco .pane{max-height:0;overflow:hidden;transition:max-height .35s ease}
.acco input:checked + label + .pane{max-height:2000px}

.btn{display:inline-block;background:#FDB924;color:#111;font-weight:700;padding:14px 22px;border-radius:6px}

@media (prefers-color-scheme: light){
  body{background:#f6f6f9}
  .cfg-wrap{background:#fff;color:#111}
  .btn{background:#3948AB;color:#fff}
}

@media (prefers-reduced-motion: reduce){
  .acco .pane{transition:none}
}
</style>
</head>
<body>
  <div class="cfg-wrap">
    <input class="cfg" type="radio" name="color" id="c-black" checked>
    <input class="cfg" type="radio" name="color" id="c-blue">
    <input class="cfg" type="radio" name="color" id="c-sand">
    <input class="cfg" type="radio" name="size"  id="s-s">
    <input class="cfg" type="radio" name="size"  id="s-m" checked>
    <input class="cfg" type="radio" name="size"  id="s-l">
    <input class="cfg" type="radio" name="size"  id="s-xl">

    <div class="hero">
      <img class="frame img-black" src="https://example.com/hero-black.jpg" width="640" height="360" alt="">
      <img class="frame img-blue"  src="https://example.com/hero-blue.jpg"  width="640" height="360" alt="">
      <img class="frame img-sand"  src="https://example.com/hero-sand.jpg"  width="640" height="360" alt="">
    </div>

    <div class="pad">
      <h1 style="margin:0 0 8px 0;font-size:28px;line-height:1.15">Hey {{firstName}}, build your perfect kit.</h1>
      <p style="margin:0 0 18px 0;opacity:.8">Tap a color and size; the image updates instantly. One tap to checkout loads your selection.</p>

      <div class="swatches" role="group" aria-label="Choose color">
        <label for="c-black" class="swatch-black"> <span></span> Black</label>
        <label for="c-blue"  class="swatch-blue">  <span></span> Royal</label>
        <label for="c-sand"  class="swatch-sand">  <span></span> Sand</label>
      </div>

      <div class="sizes" role="group" aria-label="Choose size">
        <label for="s-s">S</label>
        <label for="s-m">M</label>
        <label for="s-l">L</label>
        <label for="s-xl">XL</label>
      </div>

      <div style="margin:18px 0 24px">
        <a class="btn" href="https://yourstore.com/cart?variant={{color}}-{{size}}&src=email-miniapp">Add to cart →</a>
      </div>

      <div style="border:1px solid #222;border-radius:10px;padding:14px">
        <input type="checkbox" id="before" class="cfg">
        <label for="before" style="display:block;cursor:pointer;margin:0 0 8px 0;font-weight:600">Tap to see Before → After</label>
        <div style="position:relative">
          <img src="https://example.com/before.jpg" width="592" height="320" alt="">
          <img src="https://example.com/after.jpg"  width="592" height="320" alt="" style="position:absolute;top:0;left:0;right:0;bottom:0;opacity:0;transition:opacity .3s">
        </div>
        <style>
          #before:checked ~ * img + img{opacity:1}
        </style>
      </div>

      <div class="acco" style="margin-top:18px">
        <input id="a1" type="checkbox"><label for="a1">Shipping & returns</label>
        <div class="pane"><p style="margin:0 0 12px 0;opacity:.8">Free 30-day returns. Ships in 24h.</p></div>

        <input id="a2" type="checkbox"><label for="a2">Care</label>
        <div class="pane"><p style="margin:0;opacity:.8">Machine wash cold. Hang dry.</p></div>
      </div>

      <p style="opacity:.6;margin:22px 0 0 0;font-size:12px">If your email app doesn't support interactivity, you'll see the default Black / M preview. The checkout button still works for all sizes/colors from the site.</p>
    </div>
  </div>
</body>
</html>`
  },
  liveDrop: {
    name: "Live Drop (AMP)",
    description: "Real-time product drop with poll",
    html: `<!doctype html>
<html ⚡4email>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<style amp4email-boilerplate>body{visibility:hidden}</style>
<script async src="https://cdn.ampproject.org/v0.js"></script>
<script async custom-element="amp-accordion" src="https://cdn.ampproject.org/v0/amp-accordion-0.1.js"></script>
<script async custom-element="amp-carousel"  src="https://cdn.ampproject.org/v0/amp-carousel-0.2.js"></script>
<script async custom-element="amp-form"      src="https://cdn.ampproject.org/v0/amp-form-0.1.js"></script>
<script async custom-element="amp-list"      src="https://cdn.ampproject.org/v0/amp-list-0.1.js"></script>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;margin:0;background:#0b0b0b;color:#fff}
  .wrap{max-width:640px;margin:0 auto;background:#111}
  .pad{padding:20px}
  .btn{display:inline-block;background:#FDB924;color:#111;font-weight:700;padding:12px 18px;border-radius:6px}
</style>
</head>
<body>
  <div class="wrap">
    <amp-carousel width="640" height="360" layout="responsive" type="slides" controls>
      <amp-img src="https://example.com/angle1.jpg" width="640" height="360" layout="responsive"></amp-img>
      <amp-img src="https://example.com/angle2.jpg" width="640" height="360" layout="responsive"></amp-img>
      <amp-img src="https://example.com/angle3.jpg" width="640" height="360" layout="responsive"></amp-img>
    </amp-carousel>

    <div class="pad">
      <h1 style="margin:0 0 8px 0">The {{drop_name}} drops in:</h1>

      <amp-img src="https://yourdomain.com/api/countdown.png?to=2025-11-25T17:00:00Z"
               width="600" height="80" layout="responsive"
               alt="Countdown"></amp-img>

      <amp-list width="600" height="50" layout="fixed-height"
                src="https://yourdomain.com/api/inventory.json">
        <template type="amp-mustache">
          <div style="background:#222;border-radius:6px;overflow:hidden">
            <div style="background:#FDB924;color:#111;height:10px;width:{{percent}}%"></div>
          </div>
          <p style="opacity:.8;margin:8px 0 0 0">{{remaining}} of {{total}} left</p>
        </template>
      </amp-list>

      <form method="post" action-xhr="https://yourdomain.com/api/poll" target="_top">
        <fieldset style="border:0;padding:0;margin:16px 0">
          <legend style="font-weight:700;margin-bottom:8px">Vote the next color</legend>
          <label><input type="radio" name="color" value="royal"> Royal</label><br>
          <label><input type="radio" name="color" value="sand"> Sand</label><br>
          <label><input type="radio" name="color" value="graphite"> Graphite</label>
        </fieldset>
        <button class="btn" type="submit">Vote</button>
        <div submit-success>
          <template type="amp-mustache">
            <p>Thanks! Current leaders:</p>
            <p>Royal {{royal}}% · Sand {{sand}}% · Graphite {{graphite}}%</p>
          </template>
        </div>
        <div submit-error>
          <template type="amp-mustache">
            <p>Could not submit. Please try again.</p>
          </template>
        </div>
      </form>

      <p style="margin:16px 0 0 0"><a class="btn" href="https://yourstore.com/rsvp?drop={{drop_id}}">RSVP to the drop →</a></p>

      <amp-accordion disable-session-states>
        <section>
          <h2 style="color:#fff">Details</h2>
          <p>Ships fast. Free returns. Made in USA.</p>
        </section>
      </amp-accordion>

      <p style="opacity:.6;margin-top:16px;font-size:12px">You're seeing an interactive AMP email. If your app doesn't support AMP, you'll get our HTML version.</p>
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
  { token: "{{member_id}}", description: "Member ID" },
  { token: "{{program_name}}", description: "Program/membership name" },
  { token: "{{tier}}", description: "Membership tier" },
  { token: "{{expiry}}", description: "Expiration date" },
  { token: "{{token}}", description: "Authentication token" },
  { token: "{{drop_date}}", description: "Drop/event date" },
  { token: "{{drop_time}}", description: "Drop/event time" },
  { token: "{{tz}}", description: "Timezone" },
  { token: "{{drop_id}}", description: "Drop/event ID" },
  { token: "{{remaining}}", description: "Remaining units/spots" },
  { token: "{{secret_name}}", description: "Secret product name" },
  { token: "{{secret_price}}", description: "Secret product price" },
  { token: "{{secret_code}}", description: "Secret promo code" },
  { token: "{{secret_sku}}", description: "Secret product SKU" },
  { token: "{{church_name}}", description: "Church/organization name" },
  { token: "{{week_title}}", description: "Week/series title" },
  { token: "{{scripture_ref}}", description: "Scripture reference" },
  { token: "{{translation}}", description: "Bible translation" },
  { token: "{{devotional_intro}}", description: "Devotional introduction" },
  { token: "{{reflection_paragraph}}", description: "Reflection text" },
  { token: "{{prayer_text}}", description: "Prayer text" },
  { token: "{{week_no}}", description: "Week number" },
  { token: "{{sun_date}}", description: "Sunday date" },
  { token: "{{sun_time}}", description: "Sunday time" },
  { token: "{{campus_name}}", description: "Campus name" },
  { token: "{{address}}", description: "Address" },
  { token: "{{wed_date}}", description: "Wednesday date" },
  { token: "{{wed_time}}", description: "Wednesday time" },
  { token: "{{member_name}}", description: "Member name" },
  { token: "{{city}}", description: "City" },
  { token: "{{testimony_excerpt}}", description: "Testimony excerpt" },
  { token: "{{slug}}", description: "URL slug" },
  { token: "{{prefs}}", description: "Preferences URL" },
  { token: "{{sermon_title}}", description: "Sermon/message title" },
  { token: "{{speaker}}", description: "Speaker name" },
  { token: "{{youtube_url}}", description: "YouTube URL" },
  { token: "{{spotify_url}}", description: "Spotify URL" },
  { token: "{{color}}", description: "Product color" },
  { token: "{{size}}", description: "Product size" },
  { token: "{{drop_name}}", description: "Drop name" },
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
