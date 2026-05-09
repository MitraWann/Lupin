/*  

  Made By Lenwy
  Base : Lenwy
  WhatsApp : wa.me/6283829814737
  Telegram : t.me/ilenwy
  Youtube : @Lenwy

  Channel : https://whatsapp.com/channel/0029VaGdzBSGZNCmoTgN2K0u

  Copy Code?, Recode?, Rename?, Reupload?, Reseller? Taruh Credit Ya :D

  Deskripsi: Fungsi Untuk Mengambil Klasemen Liga
  Mohon Untuk Tidak Menghapus Watermark Di Dalam Kode Ini

*/

const axios = require('axios');
const cheerio = require('cheerio');

async function LenLiga(league) {
    let result = [];
    let liga = league.toLowerCase();
    const leagues = {
        perancis: liga === "france" || liga === "prancis" || liga === "perancis" || liga === "ligue 1",
        jerman: liga === "german" || liga === "germany" || liga === "bundes liga" || liga === "bundesliga" || liga === "jerman",
        ind: liga === "indonesia" || liga === "indo" || liga === "ind",
        eng: liga === "inggris" || liga === "premier league" || liga === "english" || liga === "premier" || liga === "england",
        italy: liga === "italia" || liga === "italy" || liga === "serie a",
        spanyol: liga === "spain" || liga === "spanyol" || liga === "la liga" || liga === "laliga",
        ucl: liga === "ucl" || liga === "champion" || liga === "champions"
    };

    try {
        if (leagues.ucl) {
            const { data } = await axios.get("https://www.bola.net/klasemen/champions.html");
            let $ = cheerio.load(data);
            $("div.box-group > div").each(function () {
                const group = $(this).find("h3").text();
                result[group] = [];
                $(this)
                    .find("div > table > tbody > tr")
                    .each(function () {
                        result[group].push({
                            rank: $(this).find("th > div > span:nth-child(1)").text(),
                            name: $(this).find("th > div > span:nth-child(2) a > span:nth-child(2)").text(),
                            match: $(this).find("td:nth-child(2)").text(),
                            point: $(this).find("td:nth-child(3)").text(),
                            win: $(this).find("td:nth-child(4)").text(),
                            draw: $(this).find("td:nth-child(5)").text(),
                            lose: $(this).find("td:nth-child(6)").text(),
                            goals: $(this).find("td:nth-child(7)").text(),
                            gd: $(this).find("td:nth-child(8)").text()
                        });
                    });
            });
            return result;
        }
        if (leagues.eng) {
            const { data } = await axios.get("https://www.bola.net/klasemen/inggris.html");
            let $ = cheerio.load(data);
            $("table.main-table > tbody > tr").each(function () {
                result.push({
                    name: $(this).find("th > div > span:nth-child(2) > a > span:nth-child(2)").text(),
                    rank: $(this).find("th > div > span:nth-child(1)").text(),
                    match: $(this).find("td:nth-child(2)").text(),
                    point: $(this).find("td:nth-child(3)").text(),
                    win: $(this).find("td:nth-child(4)").text(),
                    draw: $(this).find("td:nth-child(5)").text(),
                    lose: $(this).find("td:nth-child(6)").text(),
                    goals: $(this).find("td:nth-child(7)").text(),
                    gd: $(this).find("td:nth-child(8)").text()
                });
            });
            return result;
        }
        if (leagues.jerman) {
            const { data } = await axios.get("https://www.bola.net/klasemen/jerman.html");
            let $ = cheerio.load(data);
            $("table.main-table > tbody > tr").each(function () {
                result.push({
                    name: $(this).find("th > div > span:nth-child(2) > a > span:nth-child(2)").text(),
                    rank: $(this).find("th > div > span:nth-child(1)").text(),
                    match: $(this).find("td:nth-child(2)").text(),
                    point: $(this).find("td:nth-child(3)").text(),
                    win: $(this).find("td:nth-child(4)").text(),
                    draw: $(this).find("td:nth-child(5)").text(),
                    lose: $(this).find("td:nth-child(6)").text(),
                    goals: $(this).find("td:nth-child(7)").text(),
                    gd: $(this).find("td:nth-child(8)").text()
                });
            });
            return result;
        }
        if (leagues.perancis) {
            const { data } = await axios.get("https://www.bola.net/klasemen/prancis.html");
            let $ = cheerio.load(data);
            $("table.main-table > tbody > tr").each(function () {
                result.push({
                    name: $(this).find("th > div > span:nth-child(2) > a > span:nth-child(2)").text(),
                    rank: $(this).find("th > div > span:nth-child(1)").text(),
                    match: $(this).find("td:nth-child(2)").text(),
                    point: $(this).find("td:nth-child(3)").text(),
                    win: $(this).find("td:nth-child(4)").text(),
                    draw: $(this).find("td:nth-child(5)").text(),
                    lose: $(this).find("td:nth-child(6)").text(),
                    goals: $(this).find("td:nth-child(7)").text(),
                    gd: $(this).find("td:nth-child(8)").text()
                });
            });
            return result;
        }
        if (leagues.ind) {
            const { data } = await axios.get("https://www.bola.net/klasemen/indonesia.html");
            let $ = cheerio.load(data);
            $("table.main-table > tbody > tr").each(function () {
                result.push({
                    name: $(this).find("th > div > span:nth-child(2) > a > span:nth-child(2)").text(),
                    rank: $(this).find("th > div > span:nth-child(1)").text(),
                    match: $(this).find("td:nth-child(2)").text(),
                    point: $(this).find("td:nth-child(3)").text(),
                    win: $(this).find("td:nth-child(4)").text(),
                    draw: $(this).find("td:nth-child(5)").text(),
                    lose: $(this).find("td:nth-child(6)").text(),
                    goals: $(this).find("td:nth-child(7)").text(),
                    gd: $(this).find("td:nth-child(8)").text()
                });
            });
            return result;
        }
        if (leagues.spanyol) {
            const { data } = await axios.get("https://www.bola.net/klasemen/spanyol.html");
            let $ = cheerio.load(data);
            $("table.main-table > tbody > tr").each(function () {
                result.push({
                    name: $(this).find("th > div > span:nth-child(2) > a > span:nth-child(2)").text(),
                    rank: $(this).find("th > div > span:nth-child(1)").text(),
                    match: $(this).find("td:nth-child(2)").text(),
                    point: $(this).find("td:nth-child(3)").text(),
                    win: $(this).find("td:nth-child(4)").text(),
                    draw: $(this).find("td:nth-child(5)").text(),
                    lose: $(this).find("td:nth-child(6)").text(),
                    goals: $(this).find("td:nth-child(7)").text(),
                    gd: $(this).find("td:nth-child(8)").text()
                });
            });
            return result;
        }
        if (leagues.italy) {
            const { data } = await axios.get("https://www.bola.net/klasemen/italia.html");
            let $ = cheerio.load(data);
            $("table.main-table > tbody > tr").each(function () {
                result.push({
                    name: $(this).find("th > div > span:nth-child(2) > a > span:nth-child(2)").text(),
                    rank: $(this).find("th > div > span:nth-child(1)").text(),
                    match: $(this).find("td:nth-child(2)").text(),
                    point: $(this).find("td:nth-child(3)").text(),
                    win: $(this).find("td:nth-child(4)").text(),
                    draw: $(this).find("td:nth-child(5)").text(),
                    lose: $(this).find("td:nth-child(6)").text(),
                    goals: $(this).find("td:nth-child(7)").text(),
                    gd: $(this).find("td:nth-child(8)").text()
                });
            });
            return result;
        }
    } catch (error) {
        console.error("Error fetching data: ", error);
        throw new Error("Unable to fetch league data.");
    }
}

module.exports = LenLiga;