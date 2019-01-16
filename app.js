//usage: node app.js --tag=:tag --dir=:dir

const argv = require('yargs').argv;
const fs = require('fs');
const download = require('image-downloader');
const puppeteer = require('puppeteer');
const URL = require('url').URL;

const tag = argv.tag;
const dir = argv.dir;

if (!fs.existsSync(dir)){
  fs.mkdirSync(dir);
}

if (!tag) {
  console.log('tag needs to be defined!');
  process.exit();
}

if (!dir) {
  console.log('directory needs to be defined!');
  process.exit();
}

function cleanData (data) {
  return data.filter((val)=>{
    return !val.node.is_video;
  }).map((val)=>{
    // grabs the second smallest thumbnail of the image
    return val.node.thumbnail_resources[1].src;
  });
}

async function fetchData () {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  let sharedData, images;

  await page.goto(`https://www.instagram.com/explore/tags/${tag}`);

  sharedData = await page.evaluate(() => {
   return window._sharedData;
  });

  return sharedData.entry_data.TagPage[0].graphql.hashtag.edge_hashtag_to_media.edges;
}

const downloadFile = (url)=>{
  let filename = new URL(url).pathname.split('/')[3]+'.jpg',
    options = {url: url, dest: `${dir}/${filename}`};

  return download.image(options)
    .then(({ filename, image }) => {
      console.log('File saved to', filename)
    })
    .catch((err) => {
      console.error(err)
    });
};


(async () => {
  let images = await fetchData(),
  counter = images.length;
  images = cleanData(images);

  images.map((url)=>{
    return downloadFile(url);
  })

  //TODO: figure out when to run process.exit();
  images.forEach((url)=>{
    downloadFile(url)
      .then(()=>{
        // console.log(`${url} downloaded.`);
        counter--;
        console.log(counter);
      })
      .catch(()=>{
        counter--;
        console.log(counter);
      });
  })
})();
