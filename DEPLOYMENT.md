# Railway Deployment Guide

This guide walks you through deploying the Design Token Pipeline Demo to Railway.

## Prerequisites

- GitHub account
- Railway account (sign up at [railway.app](https://railway.app))

## Deployment Steps

### 1. Sign Up / Log In to Railway

1. Go to [railway.app](https://railway.app)
2. Click "Login" and authenticate with GitHub
3. Authorize Railway to access your repositories

### 2. Create New Project

1. Click "New Project" from the Railway dashboard
2. Select "Deploy from GitHub repo"
3. Choose the repository
4. Select the branch

### 3. Railway Auto-Configuration

Railway will automatically detect:
- Node.js project
- `railway.toml` configuration file
- Start command: `node server.js` (from package.json)
- PORT environment variable (Railway provides this automatically)

### 4. Deploy

1. Railway will automatically start deploying
2. Wait for the build to complete (usually 1-2 minutes)
3. Check the "Deployments" tab to confirm the build succeeded

### 5. Generate Public URL

After a successful deployment, you need to generate a public domain:

1. Click on your service in the Railway dashboard
2. Go to the **"Settings"** tab
3. Scroll down to the **"Networking"** section
4. Click **"Generate Domain"** button
5. Railway will create a public URL like: `your-app-name.up.railway.app`
6. Copy this URL - this is your public demo link!

**Alternative**: Some Railway projects show a domain icon or "View" button at the top of the service card.

### 6. Test the Deployment

1. Visit your Railway-provided URL (e.g., `https://your-app.up.railway.app`)
2. You should see the demo interface
3. Click "Run Pipeline" to execute the token pipeline
4. Verify that tokens are generated and displayed

## Configuration

### Environment Variables (Optional)

If you want to use the real Figma API instead of mock data:

1. In Railway dashboard, go to your project
2. Click on "Variables" tab
3. Add the following variables:
   - `FIGMA_ACCESS_TOKEN`: Your Figma Personal Access Token
   - `FIGMA_FILE_KEY`: Your Figma file key

### Custom Domain (Optional)

1. In Railway dashboard, go to "Settings"
2. Click "Generate Domain" for a custom Railway subdomain
3. Or connect your own domain

## Monitoring

Railway provides:
- Real-time logs (click "Logs" tab)
- Metrics (CPU, memory usage)
- Build history
- Automatic deployments on git push

## Troubleshooting

### Can't Find Public URL

If you don't see a public URL after deployment:

1. **Generate a domain first**: Settings → Networking → "Generate Domain"
2. Railway doesn't automatically create public URLs - you must generate one manually
3. Look for the domain/globe icon at the top of your service card
4. Check the "Settings" tab under "Networking" or "Domains" section

### Build Fails

- Check the build logs in Railway dashboard
- Ensure all dependencies are in `package.json`
- Verify `railway.toml` is correctly formatted
- Ensure Node.js version is 20+ (specified in `package.json` engines field)

### Node.js Version Error

If you see `SyntaxError: Invalid regular expression flags`:
- This means Railway is using Node.js 18 instead of 20+
- Verify `package.json` has: `"engines": { "node": ">=20.0.0" }`
- Redeploy after adding the engines field

### Server Won't Start

- Check server logs for errors
- Ensure `PORT` environment variable is used: `process.env.PORT || 3000`
- Verify `start` script in `package.json` is correct

### Pipeline Execution Fails

- Check server logs when clicking "Run Pipeline"
- Ensure all pipeline dependencies are installed
- Verify file write permissions (should work by default on Railway)

## Local Development

To run the server locally:

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or use dev script
npm run dev
```

Visit `http://localhost:3000` to see the demo.

## Updating the Deployment

Railway automatically redeploys when you push to the connected branch:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Railway will detect the push and redeploy automatically.

## Cost

Railway offers:
- **Free Trial**: $5 credit to start
- **Hobby Plan**: $5/month for hobby projects
- **Pro Plan**: Pay-as-you-go for production

This demo should comfortably run on the Hobby plan.

## Support

For Railway-specific issues:
- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)

For demo issues:
- GitHub Issues: [github.com/whatnextjamie/design-token-pipeline-demo/issues](https://github.com/whatnextjamie/design-token-pipeline-demo/issues)
