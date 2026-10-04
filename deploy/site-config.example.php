<?php
/**
 * Private site configuration — copy this file to:
 *
 *   /home/<account>/domains/<your-domain>/private/site-config.php
 *
 * (one level ABOVE public_html; create the "private" folder in hPanel → File Manager).
 * Never place the filled-in copy inside public_html or commit it to Git.
 */

return [

    // ---- Contact form ----------------------------------------------------
    // Where enquiries are delivered.
    'contact_to'   => 'mumeraijaz.writer@gmail.com',

    // Sender address. Must be a mailbox that exists on your domain in
    // hPanel → Emails (e.g. noreply@your-domain.co.uk), otherwise Hostinger
    // will not relay the message.
    'contact_from' => 'noreply@your-domain.co.uk',

    // Submissions allowed per visitor / site-wide, per hour.
    'rate_limit_per_ip' => 5,
    'rate_limit_global' => 60,

    // ---- Site -------------------------------------------------------------
    // Public address of the site, no trailing slash. Used for same-origin
    // checks and the OAuth redirect URL.
    'site_origin'  => 'https://www.your-domain.co.uk',

    // Optional: folder for rate-limit counters and the enquiry log.
    // Defaults to <domain folder>/private/storage.
    'storage_dir'  => '',

    // ---- Content admin login (GitHub OAuth App) ---------------------------
    // Create at github.com → Settings → Developer settings → OAuth Apps:
    //   Homepage URL:            https://www.your-domain.co.uk
    //   Authorization callback:  https://www.your-domain.co.uk/admin/oauth/callback.php
    'github_client_id'     => '',
    'github_client_secret' => '',
];
