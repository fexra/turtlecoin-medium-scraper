
// Copyright (c) 2021, Fexra
//
// Please see the included LICENSE file for more information.

'use strict'

const fs = require('fs');
const https = require('https');
const { basename, join } = require('path');
const { extract } = require('article-parser');
const { NodeHtmlMarkdown } = require('node-html-markdown');
const slugify = require('slugify');
const sanitize = require('sanitize-filename');
const articles = require('./source/articles.json');

// Initialize
(async () => {
    try {

        console.log(`Scraping ${articles.length} blog articles`);

        let articleCount = 1
      
        for(let article of articles) {

            console.log(`Processing blog article ${articleCount}`)
                  
            // scrape the article by url
            let scrapedArticle = await extract(article.url);

            if(!scrapedArticle) continue
            
            // setup `year/month/{{article-slug}}/images` folder structure
            const date = scrapedArticle.published.split('-');

            const distFolder = join(__dirname, '/dist/');
            const yearFolder = join(distFolder, date[0]);
            const monthFolder = join(yearFolder, date[1]);
            const articleFolder = join(monthFolder, slugify(scrapedArticle.title));
            const imagesFolder = join(articleFolder, 'images');

            // create the folders if they don't exist
            if (!fs.existsSync(distFolder)) fs.mkdirSync(distFolder);
            if (!fs.existsSync(yearFolder)) fs.mkdirSync(yearFolder);
            if (!fs.existsSync(monthFolder)) fs.mkdirSync(monthFolder);
            if (!fs.existsSync(articleFolder)) fs.mkdirSync(articleFolder); 
            if (!fs.existsSync(imagesFolder)) fs.mkdirSync(imagesFolder);

            // convert article content to markdown
            let markdown = NodeHtmlMarkdown.translate(scrapedArticle.content);

            // find all markdown image tags
            let images = [markdown.match(/(!\[.*?\]\()(.+?)(\))/g)];
                images = images[0]

            console.log(`Found ` + images.length + ` images for blog article ` + articleCount)

            let imageCount = 0

            // download each image 
            for(const image of images) {

                // skip avatar + preview images 
                if(image.includes('1*_Zp5LjJUruaSaS58AHoS0w.png')) continue
                if(image.includes('q=20')) continue

                // format image url + extension
                let imageUrl = image.match(/!\[.*?\]\((.*?)\)/)[1]
                
                console.log(`Processing image ` + imageUrl)

                // create image
                let fileName = sanitize(basename(imageUrl))
                let filePath = join(imagesFolder, fileName);

               const file = await fs.createWriteStream(filePath);

               try {
                    // download image
                    await https.get(imageUrl, function(response) {
                        response.pipe(file);
                    });
               }
               catch(e){
                   console.warn(`Error downloading image ${imageUrl}`)
               }
               
               imageCount++
            }

            console.log(`Downloaded ` + imageCount + ` images for blog article ` + articleCount)

            // cleanup article

            //remove medium header (avatar, author and cleanup date)
            markdown = markdown.replace(/\[(.*)\].*-----(.*)--------------------------------\)(\n\n)/g, function (match , hit ) {
                if(hit.endsWith('read')) { return hit.split('·')[0] + '\n\n---\n\n' } else { return '' }
            })

            // replace external image urls with the scraped internal ones
            markdown = markdown.replace(/!\[\]\(.*\/(.*)\)(\n\n)/g, function (match , fileName ) {
                if(!fileName.includes('q=20')) { return '![](./images/' + sanitize(basename(fileName)) + ')\n\n' } else { return ''}
            })
            
            // store article
            const convertedArticle = await fs.createWriteStream(`${ articleFolder }/index.md`);
            convertedArticle.write(markdown)

            articleCount++
        }
        
    } catch (err) {
      console.error(err)
    }
  })()