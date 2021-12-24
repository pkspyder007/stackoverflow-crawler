import { Scrapper } from './scrapper.js';


const start = async () => {
    const scrapper = new Scrapper();
    await scrapper.init();
    // console.log(scrapper.questions);
    // const { $, html } = await scrapper.getQuestionPageHTML('https://stackoverflow.com/questions/424071/how-do-i-list-all-of-the-files-in-a-commit');
    // const related = scrapper.getRelatedLink($, html);
    const q = await scrapper.getQuestionDetailsFromQPage('https://stackoverflow.com/questions/424071/how-do-i-list-all-of-the-files-in-a-commit');
    // console.log(q);
}

(async () => {
    await start()
})()