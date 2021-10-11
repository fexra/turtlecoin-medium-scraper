# Turtlecoin Medium Scraper

> This script scrapes all articles from medium.com/@turtlecoin, along with any images, and converts the HTML to markdown format and strips any uncessary Medium data. Converted file structure is Jekyll friendly

## Requirements

- Node 12+

## Features

- Scrapes all blog articles by URL
- Converts scraped HTML to Markdown
- Organizes scraped articles by `year-month-day-slug` structure
- Downloads images to a `images` folder and replaces external image links with the internal image links
- Removes extra Medium styling + text
- Jekyll friendly

## Setup

```
npm i
```

## Run

```
npm start
```

All converted items will land in the `dist` folder.
