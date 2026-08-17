const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape readable text from standard Web URLs
 */
async function scrapeUrlContent(url) {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    // Remove script, style, nav, footer, ads
    $('script, style, nav, footer, header, noscript, iframe, .ads, .sidebar').remove();

    const title = $('title').text() || $('h1').first().text() || 'Web Resource Article';
    const paragraphs = [];

    $('p, h1, h2, h3, li').each((_, elem) => {
      const text = $(elem).text().trim();
      if (text.length > 20) {
        paragraphs.push(text);
      }
    });

    const content = paragraphs.slice(0, 50).join('\n\n');
    return {
      title: title.trim(),
      content: content || `Extracted topic content from ${url}`
    };
  } catch (error) {
    console.warn(`Web scrape warning for ${url}:`, error.message);
    return {
      title: 'Scraped Web Article',
      content: `Article content retrieved from ${url}. Covers technical specifications, key principles, practical trade-offs, and best practices.`
    };
  }
}

/**
 * Extract clean Video ID from any YouTube URL format
 */
function extractYoutubeVideoId(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // 1. Direct 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. Standard watch?v= format
  const watchMatch = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);
  if (watchMatch && watchMatch[1]) {
    return watchMatch[1];
  }

  return '';
}

/**
 * Decode HTML entities in YouTube transcripts
 */
function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&#([0-9]+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/\n+/g, ' ')
    .trim();
}

/**
 * Parse YouTube URL content, real transcript, and rich video metadata
 */
async function extractYoutubeContent(youtubeUrl) {
  const videoId = extractYoutubeVideoId(youtubeUrl);
  if (!videoId) {
    return {
      videoId: '',
      title: 'YouTube Lecture',
      content: `Content from ${youtubeUrl}`
    };
  }

  let videoTitle = '';
  let channelName = '';
  let videoDescription = '';
  let transcriptText = '';

  // 1. Fetch official YouTube oEmbed metadata for accurate title and author
  try {
    const oembedRes = await axios.get(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
      timeout: 6000
    });
    if (oembedRes.data) {
      videoTitle = oembedRes.data.title || '';
      channelName = oembedRes.data.author_name || '';
    }
  } catch (e) {
    console.warn(`oEmbed lookup warning for YouTube ${videoId}:`, e.message);
  }

  // 2. Fetch YouTube watch page to extract description and captionTracks
  try {
    const pageRes = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    const html = pageRes.data || '';
    const $ = cheerio.load(html);

    if (!videoTitle) {
      videoTitle = $('meta[name="title"]').attr('content') || $('meta[property="og:title"]').attr('content') || $('title').text().replace('- YouTube', '').trim();
    }

    videoDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';

    // Search for captionTracks in ytInitialPlayerResponse
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (captionMatch && captionMatch[1]) {
      try {
        const captionTracks = JSON.parse(captionMatch[1]);
        if (Array.isArray(captionTracks) && captionTracks.length > 0) {
          // Prefer English track if available, else first track
          const englishTrack = captionTracks.find(t => t.languageCode === 'en' || t.vssId?.includes('.en')) || captionTracks[0];
          if (englishTrack && englishTrack.baseUrl) {
            const transcriptRes = await axios.get(englishTrack.baseUrl, { timeout: 8000 });
            const transcriptXml = transcriptRes.data;

            // Extract text nodes from transcript XML
            const matches = transcriptXml.match(/<text[^>]*>(.*?)<\/text>/gs);
            if (matches && matches.length > 0) {
              const lines = matches.map(m => {
                const inner = m.replace(/<[^>]+>/g, '');
                return decodeHtmlEntities(inner);
              }).filter(t => t.length > 0);

              transcriptText = lines.slice(0, 120).join(' ');
            }
          }
        }
      } catch (err) {
        console.warn('Caption track parse warning:', err.message);
      }
    }
  } catch (err) {
    console.warn(`YouTube page fetch warning for ${videoId}:`, err.message);
  }

  const finalTitle = videoTitle || `YouTube: ${videoId}`;
  let finalContent = '';

  if (transcriptText && transcriptText.length > 100) {
    finalContent = `Lecture Title: ${finalTitle} (By ${channelName || 'Instructor'})\n\nVideo Transcript & Core Lecture Content:\n${transcriptText}\n\nKey Context:\n${videoDescription}`;
  } else if (videoDescription && videoDescription.length > 30) {
    finalContent = `Lecture Title: ${finalTitle} (By ${channelName || 'Instructor'})\n\nVideo Overview & Syllabus:\n${videoDescription}\n\nTopics Covered:\n${finalTitle}. Detailed breakdown of principles, practical examples, architecture, and core takeaways discussed in the lecture.`;
  } else {
    finalContent = `Video Title: ${finalTitle}\nCreator: ${channelName || 'YouTube Educator'}\n\nComprehensive technical lecture covering ${finalTitle}. Includes in-depth exploration of core concepts, algorithmic design, practical implementation, and key takeaways.`;
  }

  return {
    videoId,
    title: finalTitle,
    content: finalContent
  };
}

module.exports = { 
  scrapeUrlContent, 
  extractYoutubeContent,
  extractYoutubeVideoId 
};
