import process from "process";
import axios from "axios";
import * as path from "node:path";
import * as cheerio from "cheerio";
import * as fs from "node:fs";


const rootDir = process.cwd();
const weaponsDir = path.join(rootDir, 'files/weapons');
const toolsDir = path.join(rootDir, 'files/tools');
const consumablesDir = path.join(rootDir, 'files/consumables');

async function requestUrl(url) {
    const response = await axios.get(url);
    return response.data;
}

/**
 * @param {string} content
 * @return {{name: string, image: string}[]}
 */
function getNameImages(content) {
    const data = []
    const $ = cheerio.load(content);
    $('#content .fandom-table tbody tr').each((index, element) => {
        /**
         * @var {string} image
         */
        const image = $(element).find('td:nth-child(1) a').attr('href');
        const name = $(element).find('td:nth-child(2)').text()

        if (!image || !name) {
            return
        }
        data.push({name, image: image?.split('/revision')[0]})
    })
    return data
}

/**
 * @param {string} url
 * @param {string} outputPath
 * @return {Promise<void>}
 */
async function downloadImage(url, outputPath) {
    const writer = fs.createWriteStream(outputPath);
    const response = await axios({
        method: 'get',
        responseType: 'stream',
        url: url
    });
    response.data.pipe(writer)
    return new Promise((resolve, reject) => {
        response.data.on('end', () => {
            resolve()
        })

        response.data.on('error', () => {
            reject()
        })
    })

}

function generateFilename(str) {
    return str.replace(/[^a-zA-Z0-9\-]/g, '');
}

(async function init() {
    const weapons = getNameImages(await requestUrl('https://huntshowdown.fandom.com/wiki/Weapons'));
    const tools = getNameImages(await requestUrl('https://huntshowdown.fandom.com/wiki/Tools'));
    const consumables = getNameImages(await requestUrl('https://huntshowdown.fandom.com/wiki/Consumables'));

    for (const weapon of weapons) {
        const filename = generateFilename(weapon.name) + path.extname(weapon.image)
        const filePath = path.join(weaponsDir, filename)
        await downloadImage(weapon.image, filePath)
        console.log('Download weapon')
    }

    for (const tool of tools) {
        const filename = generateFilename(tool.name) + path.extname(tool.image)
        const filePath = path.join(toolsDir, filename)
        await downloadImage(tool.image, filePath)
        console.log('Download tool')
    }

    for (const consumable of consumables) {
        const filename = generateFilename(consumable.name) + path.extname(consumable.image)
        const filePath = path.join(consumablesDir, filename)
        await downloadImage(consumable.image, filePath)
        console.log('Download consumable')
    }
})()