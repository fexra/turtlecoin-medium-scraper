# Turtlecoin Medium Scraper
> This script scrapes all articles from medium.com/@turtlecoin, along with any images, and converts the html to markdown format.

## Requirements
- Node 12+

## Features
- Scrapes all blog articles by URL
- Converts scraped HTML to Markdown
- Organizes scraped articles by `year|month|slug` folder structure
- Downloads images and replaces external image links with the internal image links
- Removes extra Medium styling + text

## Setup
```
npm i
```

## Run
```
npm start
```

All converted items will land in the `dist` folder.