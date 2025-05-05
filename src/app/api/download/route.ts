import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { Buffer } from 'buffer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  let browser;
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url || !url.includes('snapchat.com')) {
      return NextResponse.json(
        { error: 'Please provide a valid Snapchat story URL' },
        { status: 400 }
      );
    }

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('video, img', { timeout: 15000 });
    
    // Wait for all media elements to load
    await page.waitForFunction(() => {
      const videos = Array.from(document.querySelectorAll('video'));
      return videos.every(video => video.readyState >= 3); // HAVE_FUTURE_DATA or more
    }, { timeout: 15000 });
    
    const content = await page.content();
    const $ = cheerio.load(content);

    // Get all media elements
    const mediaElements = $('video, img');
    const mediaList: Array<{
      url: string;
      isVideo: boolean;
      index: number;
    }> = [];
    
    // Extract media URLs from each element
    for (const element of mediaElements) {
      const $element = $(element);
      let mediaUrl = 
        $element.attr('src') ||
        $element.find('source').attr('src') ||
        $element.find('meta[property="og:video"]').attr('content') ||
        $element.find('meta[property="og:image"]').attr('content');
      
      if (!mediaUrl) continue;

      // Handle relative URLs
      if (mediaUrl.startsWith('/')) {
        const parsedUrl = new URL(url);
        mediaUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}${mediaUrl}`;
      }

      const isVideo = element.tagName.toLowerCase() === 'video' || 
                     mediaUrl.toLowerCase().includes('video') ||
                     mediaUrl.toLowerCase().includes('.mp4') ||
                     mediaUrl.toLowerCase().includes('.webm');

      mediaList.push({
        url: mediaUrl,
        isVideo,
        index: mediaList.length + 1
      });
    }

    if (mediaList.length === 0) {
      throw new Error('No media found in story');
    }

    // For single media, we could still return it directly if preferred
    // But for consistency, we'll always return JSON with the media list
    return NextResponse.json({
      mediaList,
      total: mediaList.length,
      success: true
    });

  } catch (error: any) {
    console.error('Error downloading Snapchat story:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to download story',
        success: false
      },
      { status: 500 }
    );
  } finally {
    if (browser) await browser.close();
  }
}