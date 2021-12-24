import { Scrapper } from './scrapper.js';

const others = [`SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`]
others.forEach((eventType) => {
    process.on(eventType, exitRouter.bind(null, { exit: true }));
});

function exitRouter(options, exitCode) {
    if (exitCode || exitCode === 0) console.log(`ExitCode ${exitCode}`);
    if (options.exit) process.exit();
}

const scrapper = new Scrapper();

const start = async () => {
    await scrapper.init();
    // console.log(scrapper.questions);
    // const { $, html } = await scrapper.getQuestionPageHTML('https://stackoverflow.com/questions/424071/how-do-i-list-all-of-the-files-in-a-commit');
    // const related = scrapper.getRelatedLink($, html);
    // const q = await scrapper.getQuestionDetailsFromQPage('https://stackoverflow.com/questions/424071/how-do-i-list-all-of-the-files-in-a-commit');
    // console.log(q);
}

(async () => {
    await start()
})()

function exitHandler(exitCode) {
    console.log(`ExitCode ${exitCode}`);
    scrapper.dumpToCSV();
    console.log('Exiting finally...')
}

process.on('exit', exitHandler)