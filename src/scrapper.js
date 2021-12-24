import { load } from 'cheerio';
import fetch from 'node-fetch';
import { LINKS } from "./constants.js"
import fs from 'fs'
export class Scrapper {
    constructor() {
        this.questions = {};
        this.totalPages = 0;
        this.currentFetchList = {};
    }

    async init() {
        try {
            console.log("INITIALIZING SCRAPPER");
            this.totalPages = await this.fetchTotalPages();
            let currPage = 100
            while (currPage <= 102) {
                await this.getHomePageQuestionsDetails(`${LINKS.SO_QUESTION}/?page=${currPage}`);
                await this.sleep(1000)
                currPage++;
            }
        } catch (error) {
            console.error("Err: ", error);
        }
    }

    async getHomePageQuestionsDetails(link) {
        try {
            const res = await fetch(link);
            const text = await res.text();
            const $ = load(text);
            const html = $.html();
            const questionElements = $(html).find('#mainbar > #questions > .question-summary');

            for (let p = 0; p < questionElements.length; p++) {
                const ele = questionElements[p];

                const q = this.getHomeQuestionDetail($, ele);

                if (!(q.questionLink in this.questions)) {
                    this.questions[q.questionLink] = q
                    // fetch next 5 questions
                    const { $, html } = await this.getQuestionPageHTML(q.questionLink);
                    const related = this.getRelatedLink($, html);
                    console.log("related: ", related.length);
                    let currentPromises = [];
                    for (let i = 0; i < related.length; i = i + LINKS.MAX_REQ) {
                        for (let j = i; j < i + LINKS.MAX_REQ; j++) {
                            if (j >= related.length) {
                                break;
                            }
                            currentPromises.push(this.getQuestionDetailsFromQPage(related[j]));
                        }
                        await Promise.allSettled(currentPromises);
                        await this.sleep(1000)
                        currentPromises = [];
                    }
                } else {
                    // getting question details from questions home page
                    this.questions[q.questionLink] = { ...q, count: this.questions[q.questionLink].count }
                }
            }

        } catch (error) {
            console.error("Err: ", error);
        }
    }

    getHomeQuestionDetail($, ele) {
        try {
            const title = $(ele).find('.question-hyperlink').text();
            const questionLink = $(ele).find('.question-hyperlink').attr('href');
            const answerCount = $(ele).find('.status > strong').text();
            const upvotes = $(ele).find('.vote-count-post').text();
            return {
                title,
                questionLink,
                answerCount,
                upvotes,
                count: 1
            }
        } catch (error) {
            console.error("Err: ", error);
        }
    }

    async getQuestionDetailsFromQPage(link) {
        try {
            const res = await fetch(`${LINKS.SO_QUESTION}/${link}`);
            const text = await res.text();
            const $ = load(text);
            const html = $.html();
            $(html).find('#question > div.post-layout > div.votecell.post-layout--left > div > div.js-vote-count.flex--item.d-flex.fd-column.ai-center.fc-black-500.fs-title').map((_, ele) => {
                console.log("Vote count: " + $(ele).attr('data-value'));
            })
            $(html).find('#answers-header > div > div.flex--item.fl1 > h2').map((_, ele) => {
                console.log("Answer count: " + $(ele).attr('data-answercount'));
            })

            if (!(link in this.questions)) {
                this.questions[link] = {
                    questionLink: link,
                    title: "will be fetcghed from questions page",
                    answerCount: $(html).find('#answers-header > div > div.flex--item.fl1 > h2').attr('data-answercount') ?? 'Will be fetched later',
                    upvotes: $(html).find('#question > div.post-layout > div.votecell.post-layout--left > div > div.js-vote-count.flex--item.d-flex.fd-column.ai-center.fc-black-500.fs-title').attr('data-value') ?? 'Will be fetched later',
                    count: 1
                }
            } else {
                this.questions[link].count = this.questions[link].count + 1;
            }
            // to avoid 
            await this.sleep(100)
        } catch (error) {
            console.error("Err: ", error);
        }
    }

    async getQuestionPageHTML(qLink) {
        try {
            const res = await fetch(`${LINKS.SO_HOME}/${qLink}`);
            const text = await res.text();
            const $ = load(text);
            const html = $.html();
            return { $, html }
        } catch (error) {
            console.error("Err: ", error);
        }
    }

    getRelatedLink($, html) {
        try {
            let links = []
            $(html).find('#sidebar .module.sidebar-related a.question-hyperlink').map((_, ele) => {
                let link = $(ele).attr('href')
                if (!(link in this.questions)) {
                    links.push(link);
                }
            });
            return links;
        } catch (error) {
            console.error("Err: ", error);
            return [];
        }
    }


    async fetchTotalPages() {
        try {
            const res = await fetch(LINKS.SO_QUESTION);
            const text = await res.text();
            const $ = load(text);
            const html = $.html();

            return parseInt($(html).find('#mainbar > div.s-pagination.site1.themed.pager.float-left > a:nth-child(7)').text());
        } catch (error) {
            console.error("Err: ", error);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    dumpToCSV() {
        let data = 'Question,Answer Count,Upvotes,Count\n';
        for (let ques in this.questions) {
            data += `${this.questions[ques].title?.replace(',', ' ')},${this.questions[ques].answerCount},${this.questions[ques].upvotes},${this.questions[ques].count}\n`;
        }
        fs.writeFileSync(`./data.csv`, data, "utf-8");
    }
}