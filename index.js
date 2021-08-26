const puppeteer = require('puppeteer');
const fs = require("fs");
const ytch = require('yt-channel-info');
const UUID = require('uuid-int');
const generator = UUID(0);

const commentsFolderName = "comments";

(async () => 
{
  const browser = await puppeteer.launch({ headless: false, devtools: true });
  const page = await browser.newPage();
  load(page, browser);
})();

async function load(page, browser)
{
  const ChannelVideos = await GetChannelVideos("UC4igCP1XK1NWyYoVKVc0rfA");
  const RandomVideo = await GetRandomVideo(ChannelVideos)
  const urlRandomVideo = `https://www.youtube.com/watch?v=${ RandomVideo.videoId }`
  await page.goto(urlRandomVideo, { waitUntil: "networkidle0" })
  
  // networkidle0 waits for the network to be idle (no requests for 500ms).
  // The page's JS has likely produced markup by this point, but wait longer
  // if your site lazy loads, etc.
  // https://developers.google.com/web/tools/puppeteer/articles/ssr?hl=pt-br

  await page.waitForSelector('ytd-comments')
  await page.evaluate(() =>
  {
    document.querySelector("ytd-comments").scrollIntoViewIfNeeded()
  })
  await page.waitForSelector('ytd-comment-renderer')
  const elements = await page.$$('ytd-comment-renderer')
  if (elements.length == 0)
  {
    load(page, browser);
  }
  var { x, y, width, height } = await page.$eval("ytd-comment-renderer", item =>
  {
    var { width, height } = item.getBoundingClientRect()
    var x = parseInt(item.offsetLeft - item.scrollLeft)
    var y = parseInt(item.offsetTop - item.scrollTop)
    return { x, y, width, height }
  });
  if (!fs.existsSync(commentsFolderName))
  {
    fs.mkdirSync(commentsFolderName);
  }
  await elements[getRandomNumberInRange(elements)].screenshot({ path: `./${ commentsFolderName }/${ generator.uuid().toString().slice(-5) }.png`, clip: { x, y, width, height } })
  await browser.close();
}

function getRandomNumberInRange(array)
{
  return parseInt(Math.random() * (array.length - 0) + 0);
}

async function RenderAnswers(page)
{
  // future purposes
  await page.$$eval("ytd-button-renderer#more-replies", answers =>
  {
    answers.forEach(answer =>
    {
      answer.click()
    })
  })
}

function GetChannelVideos(channelId)
{
  return new Promise((resolve, reject) =>
  {
    const sortBy = 'newest'
    var continuation;
    var videos = []
    ytch.getChannelVideos(channelId, sortBy).then(async ({ items: itemsPai, continuation: continuatioPai }) =>
    {
      videos.push(...itemsPai)
      continuation = continuatioPai
      if (continuation != null)
      {
        while (continuation != null)
        {
          var { items: itemsFilho, continuation: continuatioFilho } = await getChannelVideosLoop(continuation)
          continuation = continuatioFilho;
          videos.push(...itemsFilho)
        }
      }
      resolve(videos)
    }).catch((err) => { })
  })
}

function GetRandomVideo(videosArray)
{
  return new Promise((resolve, reject) =>
  {
    resolve(videosArray[parseInt(Math.random() * (videosArray.length - 0) + 0)])
  })
}


async function getChannelVideosLoop(continuation)
{
  return ytch.getChannelVideosMore(continuation)
}