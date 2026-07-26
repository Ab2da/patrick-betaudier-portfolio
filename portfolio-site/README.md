# Artist Portfolio — Deployment Guide

This is a real, working website: a public gallery plus a password-protected
`/admin` page for adding and editing paintings. It's built with Next.js and
stores everything (images + details) in Vercel's Blob storage, so you don't
need a separate database.

Follow these steps in order. None of them require writing code.

## 1. Create free accounts

- A **GitHub** account: https://github.com/signup
- A **Vercel** account: https://vercel.com/signup — sign up using your GitHub
  account, it's the easiest path.

## 2. Upload this project to GitHub

1. On GitHub, click **New repository**. Name it anything, e.g. `my-portfolio`.
   Keep it Private if you'd like — that's fine.
2. On the new repo's page, click **uploading an existing file** and drag in
   every file and folder from this project (keep the folder structure intact).
3. Commit the files.

## 3. Import the project into Vercel

1. In Vercel, click **Add New → Project**.
2. Choose **Import Git Repository** and select the repo you just created.
3. Leave all the build settings as-is (Vercel detects Next.js automatically).
4. Before clicking Deploy, open **Environment Variables** and add:
   - `ADMIN_PASSWORD` = a password you'll remember (this is how you log into
     `/admin` — pick something only you know).
5. Click **Deploy**. In a minute or two you'll have a live URL like
   `my-portfolio.vercel.app`.

## 4. Turn on Blob storage

1. In your new Vercel project, go to the **Storage** tab.
2. Click **Create Database** → choose **Blob**.
3. Connect it to this project. Vercel will automatically add the
   `BLOB_READ_WRITE_TOKEN` environment variable for you — you don't need to
   type anything in.
4. Go to **Deployments** and redeploy the latest deployment so it picks up
   the new storage connection.

## 5. Connect your domain

1. In the project, go to **Settings → Domains**.
2. Enter the domain name you already own and follow Vercel's instructions —
   it will show you exactly what DNS records to add at wherever you bought
   the domain (GoDaddy, Namecheap, etc.).
3. DNS changes can take anywhere from a few minutes to a few hours to take
   effect.

## 6. Start using it

- Visit `yourdomain.com` — your public gallery (empty until you add work).
- Visit `yourdomain.com/admin` — log in with the password you set in step 3,
  then add paintings: title, year, medium, dimensions, series/collection,
  a description, and the image file itself.
- Anything you add shows up on the public site immediately.

## Notes

- Image uploads are automatically resized before upload so the site stays
  fast — you don't need to resize photos yourself first.
- The admin password is a real server-side check (not just something in the
  browser), but it's still a single shared password — good for one artist
  managing their own site, not for a team with different permission levels.
- If you ever want to change the admin password, just update the
  `ADMIN_PASSWORD` environment variable in Vercel and redeploy.
