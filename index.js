// Copyright (c) 2021, Fexra
//
// Please see the included LICENSE file for more information.

"use strict";

const fs = require("fs");
const https = require("https");
const { basename, join } = require("path");
const { extract } = require("article-parser");
const { NodeHtmlMarkdown } = require("node-html-markdown");
const slugify = require("slugify");
const sanitize = require("sanitize-filename");
const articles = require("./source/articles.json");

// Initialize
(async () => {
  try {

    // setup `dist` folder and `dist/images``
    const distFolder = join(__dirname, "dist");
    const articlesFolder = join(distFolder, "articles");
    const imagesFolder = join(distFolder, "images");

    // create the folders if they don't exist
    if (!fs.existsSync(distFolder)) fs.mkdirSync(distFolder);
    if (!fs.existsSync(articlesFolder)) fs.mkdirSync(articlesFolder);
    if (!fs.existsSync(imagesFolder)) fs.mkdirSync(imagesFolder);
    
    // cycle through the medium URLs
    console.log(`Scraping ${articles.length} blog articles`);

    let articleCount = 1;

    for (let article of articles) {
      console.log(`Processing blog article ${articleCount}`);

      // scrape the article by url
      let scrapedArticle = await extract(article.url);

      if (!scrapedArticle) continue;

      // convert article content to markdown
      let markdown = NodeHtmlMarkdown.translate(scrapedArticle.content);

      // find all markdown image tags
      let images = [markdown.match(/(!\[.*?\]\()(.+?)(\))/g)];
      images = images[0];

      console.log(
        `Found ` + images.length + ` images for blog article ` + articleCount
      );

      let imageCount = 0;

      // download each image
      for (const image of images) {
        // skip avatar + preview images
        if (image.includes("1*_Zp5LjJUruaSaS58AHoS0w.png")) continue;
        if (image.includes("q=20")) continue;

        // format image url + extension
        let imageUrl = image.match(/!\[.*?\]\((.*?)\)/)[1];

        console.log(`Processing image ` + imageUrl);

        // create image
        let fileName = sanitize(basename(imageUrl));
        let filePath = join(imagesFolder, fileName);

        if (!fs.existsSync(filePath)) {

          const file = await fs.createWriteStream(filePath);

          try {
            // download image
            await https.get(imageUrl, function (response) {
              response.pipe(file);
            });
          } catch (e) {
            console.warn(`Error downloading image ${imageUrl}`);
          }

          imageCount++;
        }
        else {
          console.log(`Image already downloaded`);
        }
      }

      console.log(
        `Downloaded ` + imageCount + ` images for blog article ` + articleCount
      );

      // cleanup article

      //remove medium header (avatar, author and cleanup date)
      markdown = markdown.replace(
        /\[(.*)\].*-----(.*)--------------------------------\)(\n\n)/g, ''
      );

      // replace external image urls with the scraped internal jekyll ones
      markdown = markdown.replace(
        /!\[\]\(.*\/(.*)\)(\n\n)/g,
        function (match, fileName) {
          if (!fileName.includes("q=20")) {
            return "![]({{ site.baseurl }}/images/" + sanitize(basename(fileName)) + ")\n\n";
          } else {
            return "";
          }
        }
      );
      
      // remove title and add (jekyll style)
      markdown = markdown.replace(/^#.*$/m, '');

      // add jekyll template to the start of the markdown
      let imageUrl = scrapedArticle.image.split('/')
          imageUrl = imageUrl[imageUrl.length - 1];
          imageUrl = sanitize(basename(imageUrl))
          imageUrl = '{{ site.baseurl }}/images/' + imageUrl

      markdown =  `---\nlayout: 'post' \ntitle: '${scrapedArticle.title}' \ndescription: '${scrapedArticle.description}' \nimage: '${imageUrl}' \ndate: '${scrapedArticle.published}' \n---` + markdown

      // store article
      const articleSlug = article.url.match(/([^\/]+$)/)[0].replace(/[^-]+$/,'').slice(0, -1)
      const artitleDate = scrapedArticle.published.substring(0,10);
          
      const convertedArticle = await fs.createWriteStream(
        `${articlesFolder}/${artitleDate}-${articleSlug}.md`
      );
      
      convertedArticle.write(markdown);

      articleCount++;
    }
  } catch (err) {
    console.error(err);
  }
})();
