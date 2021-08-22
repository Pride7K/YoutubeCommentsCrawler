const puppeteer = require('puppeteer');
const fs = require("fs");
const ytch = require('yt-channel-info');

(async ()=> 
{
  const browser = await puppeteer.launch({ headless: false, waitUntil: 'domcontentloaded' });
  const page = await browser.newPage();
  load(page);
})();

async function load(page)
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
      if(elements.length == 0)
      {
        load();
      }
      for (let i = 0; i < elements.length; i++)
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
          catch{

          }
          await elements[i].screenshot({ path: `./comments/${ i }.png` })
        } catch (e)
        {
          console.log(`couldnt take screenshot of element with index: ${ i }. cause: `, e)
        }
      }
      await browser.close();
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