import puppeteer from "puppeteer";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { JSDOM } from "jsdom";
import DOMPurify from "dompurify";

export async function GET(req: Request) {
  try {
    const url = "https://mbbsapp.com/mbbs-gujarat/";
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Wait until content loads
    await page.waitForSelector(".entry-content, article, .post-content, .content-area, main");

    const rawContent = await page.evaluate(() => {
      let data = [];
      
      // First, try to identify the main content area using common selectors
      const mainContentSelectors = [
        '.entry-content', 
        'article', 
        '.post-content', 
        '.content-area', 
        'main',
        '#content',
        '.main-content'
      ];
      
      let mainContent = null;
      for (const selector of mainContentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          mainContent = element;
          break;
        }
      }
      
      // If we couldn't find the main content, fall back to the body
      if (!mainContent) {
        mainContent = document.body;
      }
      
      // Select all elements we're interested in within the main content
      const elements = Array.from(mainContent.querySelectorAll("h1, h2, h3, p, table, ul"));
      
      // Process each element in order
      for (const el of elements) {
        // Skip elements that are likely part of navigation, sidebar, or footer
        if (
          el.closest('nav') || 
          el.closest('header') || 
          el.closest('footer') || 
          el.closest('.sidebar') || 
          el.closest('#sidebar') ||
          el.closest('.menu') ||
          el.closest('.navigation')
        ) {
          continue;
        }
        
        const tagName = el.tagName.toLowerCase();
        if (tagName === 'table') {
          // For tables, save the HTML
          data.push({
            type: 'table',
            content: el.outerHTML
          });
        } else if (tagName === 'ul') {
          // For lists, save the HTML
          data.push({
            type: 'list',
            content: el.outerHTML
          });
        } else {
          // For headings and paragraphs, save the text
          data.push({
            type: tagName,
            content: el.textContent?.trim() || ""
          });
        }
      }
      
      return data.filter(item => item.content.length > 0);
    });

    await browser.close();

    // Sanitize HTML content
    const window = new JSDOM("").window;
    const purify = DOMPurify(window);
    
    const sanitizedContent = rawContent.map(item => {
      if (item.type === 'table') {
        // Sanitize table HTML
        return {
          type: 'table',
          content: purify.sanitize(item.content, {
            ALLOWED_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'strong', 'br'],
            ALLOWED_ATTR: ['class', 'style', 'data-align']
          })
        };
      } else if (item.type === 'list') {
        // Sanitize list HTML
        return {
          type: 'list',
          content: purify.sanitize(item.content, {
            ALLOWED_TAGS: ['ul', 'li', 'strong', 'br', 'a', 'p', 'span'],
            ALLOWED_ATTR: ['class', 'style', 'href', 'target']
          })
        };
      }
      // For text elements, just return them as is
      return item;
    });

    // Group content by h2 headings with simplified structure
    const groupedContent = [];
    let currentSection = null;
    let pageTitle = null;

    sanitizedContent.forEach((item) => {
      // First h1 is typically the page title
      if (item.type === 'h1' && !pageTitle) {
        pageTitle = item.content;
        // Add page title section with simplified structure
        groupedContent.push({
          title: item.content,
          content: []
        });
      } 
      // Start a new section for each h2
      else if (item.type === 'h2') {
        currentSection = {
          title: item.content,
          content: []
        };
        groupedContent.push(currentSection);
      } 
      // Add content to the current section if it exists, otherwise add to general content
      else if (currentSection) {
        if (item.type === 'table') {
          // For tables, use "table" as the key
          currentSection.content.push({
            table: item.content
          });
        } else if (item.type === 'list') {
          // For lists, use "list" as the key
          currentSection.content.push({
            list: item.content
          });
        } else {
          // For other content types, use "content" as the key
          currentSection.content.push({
            content: item.content
          });
        }
      } 
      // If no section has been created yet, add to general content
      else {
        if (groupedContent.length > 0) {
          if (item.type === 'table') {
            groupedContent[0].content.push({
              table: item.content
            });
          } else if (item.type === 'list') {
            groupedContent[0].content.push({
              list: item.content
            });
          } else {
            groupedContent[0].content.push({
              content: item.content
            });
          }
        } else {
          let contentObject;
          if (item.type === 'table') {
            contentObject = { table: item.content };
          } else if (item.type === 'list') {
            contentObject = { list: item.content };
          } else {
            contentObject = { content: item.content };
          }

          groupedContent.push({
            title: "General Content",
            content: [contentObject]
          });
        }
      }
    });

    // Create folder if not exists
    const dir = join(process.cwd(), "src/data");
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const filePath = join(dir, "gujaratData.json");
    writeFileSync(filePath, JSON.stringify({ 
      title: pageTitle,
      sections: groupedContent 
    }, null, 2));

    return new Response(
      JSON.stringify({ 
        message: "Scraping Successful", 
        title: pageTitle,
        sections: groupedContent 
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Scraping Error:", error);
    return new Response(JSON.stringify({ message: "Failed to scrape data", error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
    });
  }
}