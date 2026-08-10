# Setup — one time, about 20 minutes

Follow in order. Nothing here needs the command line.

---

## 1 · GitHub account

1. Go to **github.com** → **Sign up**. Use the work email.
2. Verify the email.
3. Free plan is fine.

## 2 · Copy this repository

Two options — pick one.

**Fork it** *(simplest)*
On this repo's page, press **Fork** → **Create fork**. It becomes
`github.com/HER-USERNAME/invoice-template`.

**Or use it as a template**
Repo **Settings** → tick **Template repository** → then **Use this template**
→ **Create a new repository**. Cleaner history; do this if she wants a fresh start.

> Consider making her copy **Private** — invoices contain client details.
> Settings → General → Danger Zone → Change visibility.

## 3 · Create the access token

This is what lets the app save invoices back to GitHub.

1. GitHub → click the avatar → **Settings**
2. Scroll down → **Developer settings**
3. **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
4. Fill in:
   - **Name:** `invoice-app`
   - **Expiration:** 1 year *(diary a reminder to regenerate)*
   - **Repository access:** *Only select repositories* → pick her invoice repo
   - **Permissions** → *Repository permissions* → **Contents** → **Read and write**
5. **Generate token**
6. **Copy it now.** It is shown once. Paste it somewhere safe temporarily.

## 4 · Deploy on Vercel

1. **vercel.com** → **Sign up** → **Continue with GitHub** → authorise.
2. **Add New… → Project**
3. Find her invoice repo → **Import**
4. Before pressing Deploy, open **Environment Variables** and add these four:

| Name | Value |
|---|---|
| `GITHUB_OWNER` | her GitHub username |
| `GITHUB_REPO` | `invoice-template` *(or whatever she named it)* |
| `GITHUB_BRANCH` | `main` |
| `GITHUB_TOKEN` | the token from step 3 |

5. **Deploy.** About a minute.
6. She gets a URL like `invoice-template-karol.vercel.app`. **Bookmark it.**

> Rename it under **Settings → Domains** if she wants something tidier.

## 5 · Make it hers

Open the deployed site → **Settings** tab to see what's currently set. Then either
edit the files in GitHub, or just ask Claude:

> *"Set my business details: name, address, phone, email, hourly rate, payment terms."*

Do the same for `data/clients.json` with her real clients.

## 6 · Delete the sample invoice

`data/invoices/INV-0001.json` is a placeholder. In GitHub, open it → trash icon →
**Commit changes**. Her first real invoice will then be `INV-0001`.

---

## Connect Claude

In Claude, create a **Project** called *Invoices*, and connect the **GitHub connector**
to her repo. Then she can say things like:

- *"Change my hourly rate to $55"*
- *"Add a new client — Ojai Property Group"*
- *"Make the invoice header dark green"*
- *"Add a line for materials to invoice INV-0004"*

Claude reads `CLAUDE.md` in the repo and knows where everything is.

---

## If something breaks

**"Not connected yet" on the dashboard** → an environment variable is wrong.
Vercel → Settings → Environment Variables → check all four → **Redeploy**.

**Saving fails** → the token expired or lacks *Contents: Read and write*.
Generate a new one, update `GITHUB_TOKEN` in Vercel, redeploy.

**A change to the code didn't appear** → Vercel → Deployments → check the newest
build succeeded. New *invoices* appear instantly; code changes need a rebuild.
