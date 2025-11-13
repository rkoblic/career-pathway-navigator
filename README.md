# Career Path Navigator - Deployment Guide

An AI-powered career assessment tool that analyzes resumes, maps skills to Lightcast taxonomy, recommends career paths using O*NET data, and provides educational pathways and job listings.

## Features

### Core Capabilities
- **Resume upload and parsing** (TXT, DOC, DOCX)
- **Contact information extraction** - Automatically extracts name, email, phone, city, and LinkedIn URL
- **Lightcast skills taxonomy mapping** with enhanced transparency:
  - Skill definitions from Lightcast
  - Evidence from resume showing why each skill was identified
  - AI confidence scores (0-100%) for each skill inference
- **O*NET career matching** with SOC codes
- **Educational pathway generation** with:
  - Structured learning steps with timelines
  - Curated resources (courses, books, certifications)
  - Hands-on project suggestions
  - Skills covered per step
- **Job market insights** including:
  - Current job market statistics
  - Sample job listings with requirements
  - Top hiring companies
  - Salary ranges and remote work availability
- **Skill gap analysis** with visual skill matching

## Recent Updates

### Enhanced Skill Transparency (Latest)
- **Skill Definitions**: Each extracted skill now includes a Lightcast-style definition explaining what the skill entails
- **Evidence Tracking**: See the exact quote from your resume that led to each skill being identified
- **Confidence Scoring**: AI provides 0-100% confidence scores with color-coded indicators:
  - 90-100% (Green): Explicitly stated with context
  - 70-89% (Blue): Directly mentioned in resume
  - 50-69% (Yellow): Strongly implied by experience
  - 30-49% (Orange): Inferred from related skills
  - 0-29% (Red): Weak inference

### Improved Educational Pathways & Job Listings
- **Increased API token limits**: Educational pathways (16,000 tokens), Job listings (12,000 tokens) for comprehensive responses
- **Better JSON extraction**: Robust bracket matching algorithm handles complex nested structures
- **Comprehensive debugging**: Detailed console logging for troubleshooting
- **Fallback UI**: Clear error messages when data can't be loaded

### Contact Information Extraction
- Persistent contact information panel on Step 1
- Automatically extracts: Name, Email, Phone, City/Location, LinkedIn URL
- Manual editing available at any time

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
├── src/
│   ├── main.jsx                 # React entry point
│   └── career-assessment-tool.jsx   # Main application component
├── api/
│   └── claude.js                # Serverless API endpoint for Claude API
├── README.md                    # This file
├── DEPLOYMENT_GUIDE.md          # Detailed deployment instructions
└── (documentation files)
```

## Environment Variables

### For Production Deployment (Vercel/Netlify)

You **must** set up the following environment variable:

- `ANTHROPIC_API_KEY`: Your Claude API key from Anthropic

**Setup Instructions:**

1. **Get API Key**: Visit https://console.anthropic.com/ to get your API key
2. **Add to Vercel**:
   - Go to Project Settings → Environment Variables
   - Add `ANTHROPIC_API_KEY` with your key
3. **Add to Netlify**:
   - Go to Site Settings → Environment Variables
   - Add `ANTHROPIC_API_KEY` with your key

**How it works**: The serverless function at `/api/claude.js` proxies all Claude API requests server-side, keeping your API key secure and hidden from client-side code.

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
- **Missing API Key**: Ensure `ANTHROPIC_API_KEY` environment variable is set in your deployment platform
- **Empty Educational Pathways/Job Listings**:
  1. Open browser Developer Tools (F12)
  2. Go to Console tab
  3. Look for debug output starting with `=== EDUCATIONAL PATHWAY DEBUG ===` or `=== JOB LISTINGS DEBUG ===`
  4. Check if `learningSteps` or `sampleListings` arrays exist and have items
  5. Look for truncation warnings (`stop_reason: max_tokens`)
- **Rate Limiting**: Consider implementing rate limiting for production use
- **API Timeouts**: Large resumes may take 10-30 seconds to process

### Deployment Issues
- Check build output: `npm run build`
- Verify all files are included
- Check platform-specific logs (Netlify/Vercel dashboard)
- Ensure API endpoint (`/api/claude.js`) is deployed correctly

### Debugging Features
The application includes comprehensive debugging capabilities:
- **Console Logging**: All API calls log response lengths and stop reasons
- **Data Validation**: Warnings appear when expected data structures are missing
- **Fallback UI**: Friendly error messages guide users when issues occur
- **Structure Validation**: Checks for proper JSON structure before rendering

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## Performance

- **Initial load**: ~500KB (including React + dependencies)
- **API call times**:
  - Resume analysis: 5-10 seconds
  - Lightcast mapping: 5-10 seconds
  - Career path generation: 10-15 seconds
  - Educational pathways: 15-30 seconds (16K tokens)
  - Job listings: 10-20 seconds (12K tokens)
- **Token limits**:
  - Resume parsing: 500 tokens
  - Contact extraction: 500 tokens
  - Skill extraction: 8,000 tokens
  - Lightcast mapping: 10,000 tokens
  - Educational pathways: 16,000 tokens
  - Job listings: 12,000 tokens
- **Scalability**: Supports multiple simultaneous users
- **Data storage**: No database required - stateless application

## Security Notes

✅ **Production-Ready Security**:
- **API Key Protection**: API calls are proxied through serverless function (`/api/claude.js`), keeping keys secure on the server
- **No client-side exposure**: Anthropic API key never exposed to browser
- **Server-side validation**: All requests go through backend proxy

⚠️ **Additional Recommendations**:
- **Rate limiting**: Implement request throttling to prevent abuse
- **Authentication**: Add user authentication for internal/commercial use
- **Input validation**: Resume file size limits and content validation
- **CORS policies**: Configure appropriate CORS headers for your domain
- **Monitoring**: Track API usage and costs through Anthropic Console

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
