# Career Path Navigator - Deployment Guide

An AI-powered career assessment tool that analyzes resumes, maps skills to Lightcast taxonomy, recommends career paths using O*NET data, and provides educational pathways and job listings.

## Features
- Resume upload and parsing (TXT, DOC, DOCX)
- Lightcast skills taxonomy mapping
- O*NET career matching with SOC codes
- Educational pathway generation
- Job market insights and sample listings
- Skill gap analysis

## Quick Deployment Options

### Option 1: Deploy to Netlify (Easiest - 5 minutes)

1. **Create a free Netlify account**: https://app.netlify.com/signup

2. **Prepare your files**:
   - Put all files in a single folder
   - Make sure you have: package.json, index.html, vite.config.js, main.jsx, career-assessment-tool.jsx

3. **Deploy via Netlify Drop**:
   - Go to https://app.netlify.com/drop
   - Drag and drop your folder
   - Wait 30 seconds
   - Get your live URL (e.g., `https://random-name-123.netlify.app`)

4. **Or deploy via Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   npm install
   npm run build
   netlify deploy --prod
   ```

### Option 2: Deploy to Vercel (Also Easy - 5 minutes)

1. **Create a Vercel account**: https://vercel.com/signup

2. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

3. **Deploy**:
   ```bash
   npm install
   vercel
   ```

4. Follow the prompts, and you'll get a live URL

### Option 3: Deploy to GitHub Pages (Free)

1. **Create a GitHub repository**:
   - Go to https://github.com/new
   - Upload all your files

2. **Add GitHub Pages workflow**:
   - Create `.github/workflows/deploy.yml`
   - GitHub Actions will automatically build and deploy

3. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Select "GitHub Actions" as source
   - Your site will be live at `https://username.github.io/repo-name`

### Option 4: Run Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open browser**:
   - Visit http://localhost:5173

4. **Build for production**:
   ```bash
   npm run build
   ```
   - Output will be in `dist/` folder

## File Structure

```
career-path-navigator/
├── index.html                    # HTML entry point
├── package.json                  # Dependencies
├── vite.config.js               # Build configuration
├── main.jsx                     # React entry point
├── career-assessment-tool.jsx   # Main application component
├── README.md                    # This file
└── (documentation files)
```

## Environment Variables

No environment variables needed! The tool uses Claude's API through the browser, which is configured to work without API keys in the Claude.ai artifact environment.

**Important Note**: If deploying to production, you may need to set up your own API key handling for the Claude API calls. The current implementation works in the Claude.ai artifact environment but may need modification for standalone deployment.

## Sharing the Tool

### Simple Sharing (No Deployment)
1. **Share the .jsx file**: Send `career-assessment-tool.jsx` to someone
2. They can paste it into Claude or any React playground

### Professional Sharing (With Deployment)
1. Deploy to Netlify/Vercel (see above)
2. Share the public URL
3. Anyone can use it immediately - no installation needed

### Private Sharing
1. Deploy and keep the URL private
2. Or add password protection via Netlify/Vercel settings
3. Or host on a private server

## Customization

### Change Location
Edit line with `const [userLocation, setUserLocation] = useState('United States');`

### Modify Branding
- Update title in `index.html`
- Change colors in the gradient classes
- Modify header text in the component

### Add Analytics
Add Google Analytics or similar to `index.html`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-ID"></script>
```

## Troubleshooting

### Build Errors
- Make sure all dependencies are installed: `npm install`
- Check Node.js version: `node --version` (should be v16 or higher)
- Clear cache: `rm -rf node_modules package-lock.json && npm install`

### API Issues
- Claude API calls work in artifact environment
- For production, you may need to implement backend API proxy
- Consider rate limiting for production use

### Deployment Issues
- Check build output: `npm run build`
- Verify all files are included
- Check platform-specific logs (Netlify/Vercel dashboard)

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Performance

- Initial load: ~500KB (including React + dependencies)
- API calls: 2-5 seconds per request
- Supports multiple simultaneous users
- No database required

## Security Notes

⚠️ **Important for Production**:
- Currently uses direct API calls from browser
- For production, implement backend proxy for API calls
- Add rate limiting to prevent abuse
- Consider authentication for sensitive use cases
- Validate all user inputs server-side

## Cost Considerations

- **Hosting**: Free on Netlify/Vercel (generous free tiers)
- **API Calls**: Claude API costs apply (current implementation)
- **Bandwidth**: Negligible for most use cases
- **Maintenance**: Minimal - static site

## License

This tool was created with Claude AI. Modify and distribute as needed.

## Support

For issues or questions:
1. Check console logs (F12 in browser)
2. Review error messages
3. Check API response status codes

## Next Steps

1. Choose a deployment method above
2. Deploy the tool
3. Share the URL
4. (Optional) Add custom domain
5. (Optional) Add analytics

---

**Ready to deploy?** The easiest option is Netlify Drop - just drag and drop your folder and get a live URL in 30 seconds!
# Testing auto-deploy
