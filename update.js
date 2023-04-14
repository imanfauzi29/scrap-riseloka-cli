const axios = require("axios");
const fs = require("fs");
const Excel = require("exceljs");
const readline = require("readline-sync");
const path = require("path");
const excelTemplate = require("./template/excel_template.json");
const shopeeCategory = require("./template/shopee_category.json");

class Update {
  #workbox = new Excel.Workbook();
  #baseUrl = "https://www.riseloka.com/api/product";
  #dateNow = new Date().toLocaleDateString("id-ID", { dateStyle: "medium" });
  #pathNameResult = path.join(__dirname, "result/update");
  row;
  filename;
  pathExcelMassUpdate;

  constructor(row = 7) {
    this.row = row;
    this.filename = `[${this.#dateNow}] mass-update-shopee-result`;
  }

  async run() {
    const template = readline.question("Masukan nama template mass update: ");
    const result = readline.question(
      `Masukan result nama file ([${
        this.#dateNow
      }] mass-update-shopee-[namafile]): `
    );

    if (!template) {
      console.log("Masukan nama template shopee");
      return;
    }

    // check template
    const pathExcel = path.join(__dirname, `template/${template}`);
    const isTemplateExist = fs.existsSync(pathExcel);
    if (!isTemplateExist) {
      console.log(
        "Template tidak ditemukan! pastikan template sudah disimpan difolder 'template'"
      );
      return;
    }

    this.pathExcelMassUpdate = pathExcel;

    if (result) {
      this.filename = this.filename.replace("result", result);
    }

    this.readingExcel();
  }

  readingExcel() {
    console.log("==== TRY READING EXCEL FILE ====");
    try {
      this.#workbox.xlsx.readFile(this.pathExcelMassUpdate).then(() => {
        const worksheet = this.#workbox.getWorksheet(1);
        const rows = worksheet.getRows(this.row, 100);
        const pathFromTitle = [];

        console.log("Title jadikan slug");
        rows.forEach((row) => {
          const regexSymbol = new RegExp(/[^\w\d]/, "g");
          const getTitle = row.getCell(2).value;

          const replaceSymbol = getTitle
            .replace(regexSymbol, "-")
            .replace(/-+/g, "-");

          pathFromTitle.push(replaceSymbol);
        });

        console.log("Start fetching...");
        const filterSameData = pathFromTitle.filter(
          (v, x) => pathFromTitle.indexOf(v) === x
        );
        this.fetchData(filterSameData);
      });
    } catch (error) {
      console.log(error);
    }
  }

  async fetchData(pathFromTitle = []) {
    const newData = [];
    if (pathFromTitle.length === 0) {
      console.log("Data tidak ditemukan!");
      return;
    }

    let index = 0;

    while (true) {
      const grabData = await axios
        .get(`${this.#baseUrl}/slug/${pathFromTitle[index]}`)
        .then((res) => res.data);

      console.log(`Updating data ke-${index + 1} dari ${pathFromTitle.length}`);

      if (Object.keys(grabData.data).length === 0) {
        console.log("stop\n\n");
        break;
      }

      // if (index === 5) break;

      newData.push({
        name: grabData.data.name,
        variants: grabData.data.variants
      });
      index += 1;
      await this.delay(1000);
    }

    this.updateData(newData);
  }

  async updateData(newData) {
    const pathName = path.join(this.#pathNameResult, this.filename);

    if (newData.length === 0) {
      console.log("Data tidak ditemukan!");
      return;
    }

    // checkPath
    if (!fs.existsSync(this.#pathNameResult))
      fs.mkdirSync(this.#pathNameResult);

    if (!fs.existsSync(pathName)) fs.mkdirSync(pathName);

    this.writeJson(pathName, newData);
    this.writeToExcel(pathName);
  }

  writeJson(path, data) {
    try {
      const pathName = `${path}/${this.filename}.json`;
      fs.writeFileSync(pathName, JSON.stringify(data, null, 4));

      console.log(`JSON File created at ${pathName} \n`);
    } catch (error) {
      console.log(error, "JSON gagal dibuat!");
      return;
    }
  }

  writeToExcel(pathName) {
    try {
      let data = fs.readFileSync(path.join(pathName, `${this.filename}.json`));
      data = JSON.parse(data);

      this.#workbox.xlsx.readFile(this.pathExcelMassUpdate).then(() => {
        const worksheet = this.#workbox.getWorksheet(1);
        const rows = worksheet.getRows(this.row, 100);

        rows.forEach((row, i) => {
          data.forEach((d, j) => {
            const isName = row.getCell(2).value === d.name;
            if (isName) {
              d.variants.forEach((variant) => {
                if (variant.variants_name === row.getCell(4).value) {
                  row.getCell(7).value = variant.selling_price;
                  row.getCell(8).value = variant.stock;
                }
              });
            }
          });
        });

        this.#workbox.xlsx.writeFile(
          path.join(pathName, `${this.filename}.xlsx`)
        );

        console.log(`File success created: ${this.filename}.xlsx`);
      });
    } catch (error) {
      console.log(error, "WRITE EXCEL ERROR");
    }
  }

  delay(time) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time);
    });
  }
}

const row = 7;
const update = new Update(row);
update.run();
