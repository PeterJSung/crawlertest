const puppeteer = require('puppeteer')
const fs = require('fs')
const axios = require('axios')
const imageType = require('image-type')
//https://www.penup.com/main/home
const penupLink = 'https://www.penup.com/main/home'
const windowWidth = 1920
const windowHeight = 1080
const folderName = `images`
const MAX_SCROLL = 5;

fs.readdir(folderName, (err) => {
  if (err) {
    console.error(`${folderName} 폴더가 없어 ${folderName} 폴더를 생성합니다.`);
    fs.mkdirSync(folderName);
  }
});

const penupCrawler = async () => {
 
  const browser = await puppeteer.launch({ 
    headless: false, 
    args: [
      '--no-sandbox', 
      `--window-size=${windowWidth},${windowHeight}`] 
    });
  const pages = await browser.newPage()
  await pages.setViewport({width: windowWidth, height: windowHeight})
  await pages.goto(penupLink)

  let imageList = []
 
  for(let scrollCount = 0; scrollCount < MAX_SCROLL; scrollCount++ ) {
    await pages.waitFor(3000)
    const srcs = await pages.evaluate(() => {
      window.scrollTo(0,0)
      const imageList = []
      const delList = []
      const imageEls = document.querySelectorAll('.grid-item')
      imageEls && imageEls.forEach((eachEls) => {
        const currentImageLink = window.getComputedStyle(eachEls.querySelector(`.artwork-image`))['backgroundImage']
        if(currentImageLink && currentImageLink != 'none') {
          imageList.push(currentImageLink.match(/(?<=\(").+?(?="\))/)[0])
          delList.push(eachEls)
        }
      })
      // delete node 
      delList.forEach(eachEl => {
        eachEl.parentNode.removeChild(eachEl)
      })
      window.scrollBy(0,500)
      return imageList
    })
    imageList = imageList.concat(srcs)
  }
  
  imageList.forEach(async (eachUrl) => {
    const imgResult = await axios.get(eachUrl, {
      responseType: 'arraybuffer',
    });
    const { ext } = imageType(imgResult.data);
    fs.writeFileSync(`${folderName}/${Math.floor(new Date().getTime())}.${ext}`, imgResult.data);
  })
  await pages.close()
  await browser.close()
}

penupCrawler()