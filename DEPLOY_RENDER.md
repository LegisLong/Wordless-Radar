# How to Deploy "Semantic Signal" to Render

This guide explains how to deploy this React application to [Render.com](https://render.com) as a Static Site.

## Prerequisites
1. A GitHub account.
2. A Render account (sign up with GitHub).
3. A Google Gemini API Key.

## Step 1: Push Code to GitHub
1. Create a new repository on GitHub.
2. Commit all the files in this project (ensure `package.json`, `vite.config.ts`, `tsconfig.json`, and `index.html` are included).
3. Push the code to your GitHub repository.

## Step 2: Create a Static Site on Render
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** and select **Static Site**.
3. Connect your GitHub account if you haven't already.
4. Search for and select the repository you just created.

## Step 3: Configure Build Settings
Fill in the settings as follows:

*   **Name**: `semantic-signal` (or any name you like)
*   **Branch**: `main` (or `master`)
*   **Root Directory**: `.` (leave blank)
*   **Build Command**: `npm run build`
    *   *Render will detect the `package.json`, install dependencies, and run the build script.*
*   **Publish Directory**: `dist`
    *   *Vite builds the production files into the `dist` folder.*

## Step 4: Add Environment Variables
The application requires a Google Gemini API Key to generate words.

1. Scroll down to the **Environment Variables** section.
2. Click **Add Environment Variable**.
3. **Key**: `API_KEY`
4. **Value**: Paste your actual Google Gemini API Key (starts with `AIza...`).

## Step 5: Deploy
1. Click **Create Static Site**.
2. Render will start building your app. You can watch the logs in the dashboard.
3. Once the build finishes, you will see a URL (e.g., `https://semantic-signal.onrender.com`).
4. Click the link to play your game!

## Troubleshooting
*   **Blank Screen?** Check the browser console (F12). If you see errors about `API_KEY`, ensure you added the Environment Variable correctly in Render and triggered a redeploy.
*   **Build Fails?** Check the logs. Ensure `npm install` ran successfully and that `vite` is listed in `devDependencies` in `package.json`.
