const puppeteer = require('puppeteer');
const fs = require("fs");
const ytch = require('yt-channel-info');

(async () => 
{
  const browser = await puppeteer.launch({  waitUntil: 'domcontentloaded' });
  const page = await browser.newPage();
  load(page, browser);
})();

async function load(page, browser)
{
  const ChannelVideos = await GetChannelVideos("UC4igCP1XK1NWyYoVKVc0rfA");
  const RandomVideo = await GetRandomVideo(ChannelVideos)
  const urlRandomVideo = `https://www.youtube.com/watch?v=${ RandomVideo.videoId }`
  await page.goto(urlRandomVideo)
  setTimeout(async () =>
  {
    await page.evaluate(() =>
    {
      document.querySelector("ytd-comments").scrollIntoView()
    })
    setTimeout(async () =>
    {
      const elements = await page.$$('ytd-comment-renderer')
      if (elements.length == 0)
      {
        load(page, browser);
      }
      for (let i = 0; i < elements.slice(0, 1).length; i++)
      {
        try
        {
          try
          {
            await page.$$('ytd-comment-renderer')[i].scrollIntoView({
              behavior: 'auto',
              block: 'center',
              inline: 'center'
            })
          }
          catch {

          }
          var { x, y, width, height } = await page.$eval("ytd-comment-renderer", item =>
          {
            var { width, height } = item.getBoundingClientRect()
            var x = parseInt(item.offsetLeft - item.scrollLeft)
            var y = parseInt(item.offsetTop - item.scrollTop)
            return { x, y, width, height }
          });
          await elements[i].screenshot({ path: `./comments/${ i }.png`, clip: { x, y, width, height } })
          await browser.close();
        } catch (e)
        {
          load(page,browser)
        }
      }
    }, 3000)
  }, 3000)
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
          var { items: itemsFilho, continuation: continuatioFilho } = await getSla(continuation)
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


async function getSla(continuation)
{
  return ytch.getChannelVideosMore(continuation)
}