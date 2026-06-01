# Indian National Congress — Timeline 1885–1947

An interactive educational website helping students learn about the Indian National Congress movement through an engaging, intuitive interface.

## Overview

This is a **government-education style web application** designed for students, teachers, and general learners. It provides an immersive way to explore the INC timeline from its founding in 1885 to Indian independence in 1947.

### Key Features

**Timeline Navigation**
- Year slider with smooth, responsive controls
- Previous/Next session buttons for sequential browsing
- Milestone jump buttons for key historical moments

**Interactive India Map**
- D3.js-based visualization showing session locations
- City pins that highlight the current year's session
- Zoom controls (+, −, reset)
- State and pin tooltips on hover
- Color-coded historical phases

**Session Cards**
- Detailed flashcard view with session information
- President, city, and event highlights
- Phase badges and importance indicators
- Share and bookmark functionality

**Search & Filtering**
- Search by year, city, president, phase, or event
- Filter by historical phase (Moderate, Assertive, Gandhian, etc.)
- Toggle to show only important milestone sessions
- Live search results with instant feedback

**Quiz System**
- 5 quiz categories: Presidents, Cities, Years, Phases, Events
- Score tracking and streak counting
- Correct/incorrect feedback with explanations
- Adaptive questions based on current filters

**Student Tools**
- Bookmark important years for quick reference
- Personal notes per year (saved locally)
- Side-by-side session comparison
- Progress dashboard with statistics
- Native share functionality

**Theme Support**
- Light and dark modes
- Auto-detection of system theme preference
- Persistent theme choice

**Full Responsiveness**
- Works on desktop, tablet, and mobile
- Touch-friendly interface
- Adaptive layout for all screen sizes

## Quick Start

### 1. **Open the Website**

Simply open `index.html` in a modern web browser:

```bash
# Option 1: Direct file opening
open index.html

# Option 2: Using Python's built-in HTTP server
python3 -m http.server 8000
# Then visit: http://localhost:8000
```

### 2. **Start Learning**

1. **Explore the Timeline**: Use the year slider to navigate from 1885 to 1947
2. **View Sessions**: Click on a year to see the INC session details for that year
3. **Check the Map**: Watch the map highlight session locations as you navigate
4. **Try the Quiz**: Click "Test your knowledge" to test your understanding
5. **Search**: Use the search bar to find sessions by year, city, president, or event
6. **Bookmark**: Save important years using the "Bookmark year" button
7. **Take Notes**: Add personal notes to any year for revision

## File Structure

```
├── index.html         # Main HTML structure
├── styles.css         # All styling (light/dark themes)
├── app.js             # Core app state & orchestration
├── timeline.js        # Timeline UI controller
├── map.js             # Interactive map with D3.js
├── quiz.js            # Quiz functionality
├── data.js            # INC session data (1885-1947)
├── map-data.js        # Geographic data for India map
└── README.md          # This file
```

## Data

The application includes:
- **95 INC sessions** from 1885 to 1947
- **Historical information**: Presidents, cities, events, phase classifications
- **Geographic data**: Session locations with coordinates
- **Event highlights**: Key moments and milestones
- **Source references**: Historical sources and citations

## Technologies

- **HTML5** - Semantic structure
- **CSS3** - Modern styling with CSS variables for theming
- **Vanilla JavaScript** - No frameworks (lightweight & fast)
- **D3.js** - Interactive map visualization
- **TopoJSON** - Geographic data format
- **Google Fonts** - Typography (Crimson Pro, DM Sans)
- **LocalStorage** - Client-side data persistence

## Browser Compatibility

Works on all modern browsers:
- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Features Explained

### Timeline Navigation
Drag the slider or use previous/next buttons to move through sessions. The year bar shows the current session and its phase.

### Map Interaction
Hover over states to see session counts. Click a state to jump to its latest session. Use zoom controls to focus on regions.

### Quiz Categories
- **Presidents**: "In which year was X Congress president?"
- **Cities**: "Which city hosted the X session?"
- **Years**: "What year was the X session held?"
- **Phases**: "Which phase was the X session?"
- **Events**: "Which year matches this milestone?"

### Search Tips
- Search by **year**: "1920"
- Search by **city**: "bombay"
- Search by **president**: "gandhi"
- Search by **phase**: "moderate"
- Search by **event**: "partition"

### Bookmarking & Notes
- Bookmark sessions to create a study list
- Add personal notes to any year for revision
- All data is saved in your browser's local storage
- Use "Reset progress" to clear everything

## Customization

### Colors & Styling
Colors are defined in `styles.css` using CSS variables:
- Light theme: `[data-theme="light"]`
- Dark theme: `[data-theme="dark"]`

Change colors by modifying variables like `--accent`, `--bg`, `--txt`, etc.

### Historical Data
Data is stored in `data.js`. Modify the `INC` array to update session information.

### Quiz Questions
Quiz generation is in `quiz.js`. Modify `makeQuestion()` to add custom question types.

## Performance

- **Fast loading**: ~575 KB total (including all data)
- **Lazy map rendering**: Map loads only when needed
- **Optimized D3.js**: Using CDN for fast delivery
- **LocalStorage caching**: All user data stored locally
- **No API calls**: Fully self-contained

## Accessibility

- ARIA labels for all interactive elements
- Keyboard navigation support
- Focus indicators on interactive elements
- Good color contrast ratios
- Semantic HTML structure
- Screen reader friendly

## Known Limitations
- Improving Dark mode theme
- Map requires JavaScript (no fallback for JS-disabled browsers)
- Geographic data only covers India's current borders
- Historical data focuses on major sessions (95 recorded sessions)
- Quiz questions are generated dynamically (limited by data pool)


## Sources & References

Historical data is synthesized from:
- INC official session records
- Standard Indian history textbooks
- Academic journals and papers
- Government archives
- Historical newspapers and documents

See the **Sources** section in the app for detailed citations.

## Contributing

To contribute improvements:
1. Test all features thoroughly
2. Verify historical accuracy
3. Maintain the clean, simple design
4. Keep the government-education style
5. Ensure mobile responsiveness
6. Test accessibility

**Last Updated**: June 2026
**Version**: 1.0
**Status**: Complete & Functional
