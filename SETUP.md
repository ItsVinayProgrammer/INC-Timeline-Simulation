# INC Timeline — Setup & Deployment Guide

## Local Development

### 1. Clone or Download the Project

```bash
# Navigate to the project directory
cd /path/to/INC\ Timeline
```

### 2. Run a Local Server

**Python 3** (Recommended):
```bash
python3 -m http.server 8000
# Visit: http://localhost:8000
```

**Python 2**:
```bash
python -m SimpleHTTPServer 8000
# Visit: http://localhost:8000
```

**Node.js (http-server)**:
```bash
npm install -g http-server
http-server
```

**Live Server** (VS Code Extension):
```
Right-click index.html → Open with Live Server
```

### 3. Verify All Features

Once the server is running, test these features:

#### Basic Navigation
- [ ] Year slider works (drag and see updates)
- [ ] Previous/Next buttons navigate to sessions
- [ ] Year number updates in real-time
- [ ] Phase label updates correctly
- [ ] Era badge shows correct phase

#### Timeline Display
- [ ] Session card shows correctly
- [ ] President information displays
- [ ] Event descriptions are readable
- [ ] Bookmark button works
- [ ] Share button works

#### Map Display
- [ ] Map loads without errors
- [ ] Pins appear for current year
- [ ] Map is interactive (can hover)
- [ ] Zoom controls work (+/−/reset)
- [ ] Tooltip shows when hovering pins/states

#### Search & Filter
- [ ] Search input accepts text
- [ ] Results update as you type
- [ ] Phase filter dropdown works
- [ ] Important toggle works
- [ ] Clear button resets search

#### Quiz
- [ ] "Test your knowledge" button opens quiz
- [ ] Questions display correctly
- [ ] Answer options are clickable
- [ ] Feedback shows after answering
- [ ] Next button appears after answer
- [ ] Score updates in header

#### Theme
- [ ] Light theme button works
- [ ] Dark theme button works
- [ ] Theme persists after refresh
- [ ] All colors are readable in both themes

#### Other Features
- [ ] Bookmarks save and persist
- [ ] Notes save and persist
- [ ] Compare sessions works
- [ ] Progress dashboard updates
- [ ] Reset progress button works

## Deployment

### Option 1: Static Hosting (GitHub Pages, Netlify, Vercel)

**GitHub Pages**:
1. Create a GitHub repository
2. Push all files to `main` branch
3. Go to Settings → Pages
4. Select "Deploy from main branch"
5. Your site is live at `https://username.github.io/repo-name`

**Netlify**:
1. Connect your Git repository
2. Set build command: (leave empty - static site)
3. Set publish directory: `.` (root)
4. Deploy!

**Vercel**:
1. Import the project
2. Framework preset: Other
3. Deploy!

### Option 2: Traditional Web Server

**Apache**:
```apache
# .htaccess
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [QSA,L]
```

**Nginx**:
```nginx
server {
    root /var/www/inc-timeline;
    try_files $uri /index.html;
    location ~* \.(js|css|png|jpg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Option 3: Docker

Create a `Dockerfile`:
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
```

Build and run:
```bash
docker build -t inc-timeline .
docker run -p 80:80 inc-timeline
```

## Performance Optimization

### CDN Caching
Set cache headers for static assets:
```
Cache-Control: max-age=31536000  # 1 year for immutable assets
Cache-Control: max-age=3600      # 1 hour for HTML
```

### Compression
Enable gzip compression:
```
.js, .css, .json files → gzip 70-80% reduction
```

### Minification (Optional)
If deploying to production, minify:
- JavaScript files
- CSS files
- HTML file

Tools: `terser`, `cssnano`, `html-minifier`

## Environment Configuration

### .env (if using a build process)
```bash
REACT_APP_TITLE=INC Timeline
REACT_APP_VERSION=1.0
```

### Settings
All settings are in the application and stored in `localStorage`:
- Theme preference
- Quiz scores
- Bookmarks
- Notes
- Search queries

## Troubleshooting

### Map Not Loading
- Check browser console for errors (F12)
- Verify D3.js CDN is accessible
- Check TopoJSON CDN link is valid
- Ensure map-data.js has valid GeoJSON

### Quiz Not Working
- Verify data.js is loaded first
- Check quiz.js is loaded after data
- Check browser console for JavaScript errors
- Verify INC dataset has entries

### Styling Issues
- Clear browser cache (Ctrl+Shift+Del)
- Check styles.css is linked correctly
- Verify Google Fonts CDN is accessible
- Check for conflicting browser extensions

### Performance Issues
- Check Network tab in DevTools
- Look for slow CDN requests
- Verify map isn't re-rendering unnecessarily
- Check for memory leaks in quiz

## Best Practices

### For Students
1. **Start with timeline exploration** - understand the chronology
2. **Use search strategically** - find sessions by president or city
3. **Take notes** - write down key insights
4. **Quiz regularly** - test knowledge after each phase
5. **Bookmark important sessions** - for quick review
6. **Compare sessions** - understand phase changes

### For Teachers
1. **Assign topics** - e.g., "Search for Gandhian era sessions"
2. **Create quiz competitions** - track scores with students
3. **Use comparisons** - show evolution over time
4. **Print references** - use Sources section for citations
5. **Combine with textbook** - don't replace, complement

### For Developers
1. **Follow existing patterns** - check similar code before adding
2. **Use semantic HTML** - improves accessibility
3. **Test on mobile** - ensure responsive design
4. **Check console** - no errors or warnings
5. **Validate data** - ensure historical accuracy

## Maintenance

### Regular Updates
- **Monthly**: Review user feedback
- **Quarterly**: Verify historical data accuracy
- **Yearly**: Update sources and references
- **As needed**: Fix bugs and add features

### Monitoring
- Error tracking (Sentry, Rollbar)
- Analytics (Google Analytics, Plausible)
- User feedback (forms, surveys)
- Performance metrics (Lighthouse)

### Backup
- Git version control
- Regular backups of data.js
- Export user quiz scores if needed

## Support & Help

### Common Questions

**Q: Can I download and use offline?**
A: Yes! Download all files and open index.html locally.

**Q: Can I modify the historical data?**
A: Yes! Edit data.js and map-data.js as needed.

**Q: How do I add more quiz questions?**
A: Questions are auto-generated from data.js sessions.

**Q: Can I use this for commercial purposes?**
A: Check the license - this is for educational use.

### Getting Help
1. Check README.md first
2. Search the code comments
3. Review console errors (F12)
4. Check browser compatibility
5. Test with sample data

---

**Last Updated**: June 2026
**Version**: 1.0
