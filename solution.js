var axios = require('axios');
var cheerio = require('cheerio') ;
var fs = require('fs');

class ScrapeSolution {
    constructor(url) {
        this.urlArtikel = url + "/artikel"
        this.url = url
    }

    scrapeAll() {
        const { urlArtikel } = this
        this.scrapePage(urlArtikel)
            .then( scrapeResult => this.listArticleUrl(scrapeResult)
            .then( list => this.getArticleDetails(list)
            .then( arrayResult => this.createJsonFile(arrayResult))
        ))      
    }

    scrapePage(url) {
        return new Promise(resolve => {
            axios(url).then( response => {
                if (response.status == 200) {
                    resolve(response.data)
                }
                resolve("Server was busy")
            }) 
        })
    }

    listArticleUrl(scrapeResult) {
        let result = []
        const { url } = this;        
        return new Promise( resolve => {
            const $ = cheerio.load(scrapeResult);          
            $('.article-list-item  a[href]').each((index, elem)=>{
                const link = $(elem).attr('href')                
                result.push(url+link)
            });
            resolve(result)
        }) 
    }

    getArticleDetails(urlList) {
        const len = urlList.length
        const result = []
        const promises = []
        return new Promise( resolve => {
            for (let i = 0; i < len; i++) {
                promises.push(this.scrapePage(urlList[i])
                .then( scrapeResult => this.getObjectDetails(scrapeResult,urlList[i])
                .then( objectDetails => result.push(objectDetails))
                ))
            }
            Promise.all(promises).then(() => resolve({ articles: result }))           
        })
    }

    getObjectDetails(scrape, pageUrl) {
        const { url } = this
        const relatedUrls = []
        const relatedTitles = []
        return new Promise( resolve => {
            const $ = cheerio.load(scrape);

            //Collect relatedUrls
            $('.margin-bottom-30  > .side-list-panel a[href]').each((index, elem) =>{
                const urls = $(elem).attr('href') 
                relatedUrls.push(url+urls)
            });

            // Collect relatedTitles
            $('.margin-bottom-30 > .side-list-panel h5[class]').each((index, elem) =>{
                const title = $(elem).text()
                relatedTitles.push(title)    
            });

            const title = $("title").next().next().attr('content')
            const author = $(".author-name").text().trim()
            const postDate = $(".post-date").children().text().trim()
            const articles = {
                url: pageUrl,
                title: title,
                author: author,
                postDate: postDate,
                relatedArticles: this.mergeArray(relatedUrls,relatedTitles)
            }
            resolve(articles)
        }) 

    }

    mergeArray(urlList,titleList) {
        const len = 5
        const result = []
        for (let i = 0; i< len;i++) {
            const obj = {url: urlList[i], title: titleList[i]}
            result.push(obj)
        }
        return result
    }

    createJsonFile(result) {
        const stringified = JSON.stringify(result, null, 2)
        fs.writeFile("solution.json",stringified, (err, result)=>{
            if (err) {
                console.log("error",err);
            } else {
                console.log("Successfully create JSON file! please find solution.json on the root of this project directory"); 
            }
        })
    }
}

const finalResult = new ScrapeSolution('https://www.cermati.com')
finalResult.scrapeAll()