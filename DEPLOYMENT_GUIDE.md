# Quick Deployment Checklist

## ⚡ FASTEST: CodeSandbox (2 minutes, no installation)

1. Go to https://codesandbox.io
2. Click "Create" → "React" template
3. Delete default code in App.js
4. Copy/paste your `career-assessment-tool.jsx` content
5. File → Rename to `CareerAssessmentTool.jsx`
6. Update imports to use lucide-react (it's pre-installed)
7. Click "Share" button → Get public URL
8. ✅ Done! Share the URL with anyone

**Pros**: Instant, no setup, free
**Cons**: CodeSandbox branding, slower performance

---

## 🚀 RECOMMENDED: Netlify Drop (5 minutes, professional)

### Step 1: Organize Files
Create a folder called `career-path-navigator` with these files:
```
career-path-navigator/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   └── career-assessment-tool.jsx
```

### Step 2: Move Files
Move the JSX file into a `src` folder:
- Create `src` folder
- Move `career-assessment-tool.jsx` into `src/`
- Move `main.jsx` into `src/`

### Step 3: Deploy
1. Go to https://app.netlify.com/drop
2. Drag the entire `career-path-navigator` folder
3. Wait 30-60 seconds
4. Get your URL: `https://your-site-name.netlify.app`
5. ✅ Done!

**Pros**: Professional URL, fast, free custom domains
**Cons**: Requires file organization

---

## 💻 LOCAL TESTING (5 minutes)

If you want to test before deploying:

1. **Install Node.js** (if not installed):
   - Download from https://nodejs.org
   - Choose LTS version

2. **Organize files** (same as Netlify above)

3. **Open terminal** in the `career-path-navigator` folder

4. **Run these commands**:
   ```bash
   npm install
   npm run dev
   ```

5. **Open browser** to http://localhost:5173

6. ✅ Tool is running locally!

---

## 📧 SHARE VIA EMAIL

**Option A: Share the Code**
1. Attach `career-assessment-tool.jsx` to email
2. Recipient pastes into Claude.ai
3. Claude renders it as interactive app

**Option B: Share the URL**
1. Deploy using any method above
2. Send the public URL
3. Recipient visits URL directly

---

## 🌐 PRODUCTION DEPLOYMENT (30 minutes)

For a fully production-ready deployment:

### Step 1: Set Up Repository
```bash
# Initialize git
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
gh repo create career-path-navigator --public --push
```

### Step 2: Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Step 3: Add Custom Domain (Optional)
1. Buy domain (Namecheap, Google Domains, etc.)
2. In Vercel dashboard: Settings → Domains
3. Add your domain
4. Update DNS records as instructed

---

## ⚠️ IMPORTANT NOTES

### API Key Handling
The current implementation uses Claude's API directly from the browser. This works in the artifact environment but may need modification for production:

**For Production Use:**
1. Set up a backend proxy server
2. Store API keys server-side
3. Implement rate limiting
4. Add authentication if needed

**Quick Backend Example (Optional):**
Create `api/claude.js`:
```javascript
export default async function handler(req, res) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY
    },
    body: JSON.stringify(req.body)
  });
  const data = await response.json();
  res.json(data);
}
```

Then update fetch calls to use `/api/claude` instead.

### File Size
- Total: ~5MB (with all dependencies)
- Loads in 2-3 seconds on average connection
- Consider code splitting for production

---

## 🎯 RECOMMENDATION BY USE CASE

| Use Case | Best Option | Time |
|----------|-------------|------|
| Quick demo to colleague | CodeSandbox | 2 min |
| Share with friends/family | Netlify Drop | 5 min |
| Professional portfolio | Vercel + Custom Domain | 30 min |
| Internal company tool | Private GitHub + Netlify | 15 min |
| Production SaaS | Full backend + Auth | 2-3 hours |

---

## 📞 NEED HELP?

Common issues and solutions:

**"npm: command not found"**
→ Install Node.js from https://nodejs.org

**"Module not found"**
→ Run `npm install` first

**"Port 5173 already in use"**
→ Kill other processes or use `npm run dev -- --port 3000`

**"Build failed"**
→ Check that all files are in correct locations
→ Verify package.json is valid JSON

**"Site is slow"**
→ API calls take 2-5 seconds (normal)
→ Consider adding loading indicators
→ Implement caching for repeat requests

---

## ✅ QUICK START (Choose One)

### For Immediate Sharing:
```
1. Upload to CodeSandbox
2. Share URL
3. Done!
```

### For Professional Deployment:
```
1. Organize files in folder
2. Drag to Netlify Drop
3. Share URL
4. Done!
```

### For Local Testing:
```
1. npm install
2. npm run dev
3. Open localhost:5173
4. Done!
```

---

Ready to deploy? Pick the method that fits your needs and follow the steps above!
