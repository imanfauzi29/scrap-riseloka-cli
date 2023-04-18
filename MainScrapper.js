const axios = require("axios");
const fs = require("fs");
const Excel = require("exceljs");
const path = require("path");

class MainScrapper {
  #config = {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36"
    }
  };

  #workbox = new Excel.Workbook();
  #baseUrl = "https://www.riseloka.com/api/product";
  #dateNow = new Date().toLocaleDateString("id-ID", {
    dateStyle: "medium"
  });
  #filename;

  /**
   * @typedef {object} InitialInput
   * @property {string} platform
   * @property {number} typeRequest
   * @property {string} inputExcel
   * @property {string} brand
   * @property {string} category
   * @property {string} filename
   *
   */
  #initialInput;
  #resultDir = "result";
  #finalDir;

  constructor() {}

  /**
   *  @param {InitialInput} name
   * @returns {InitialInput}
   */
  getInitialInput(name) {
    return this.#initialInput[name] ?? this.#initialInput;
  }

  /**
   *
   * @param {{platform: string, typeRequest: number, inputExcel: string, brand?: string, category?: string, filename: string}}  value
   */
  setInitialInput(value) {
    this.#initialInput = value;
  }
  setFinalDir(value) {
    this.#finalDir = value;
  }

  getFinalDir() {
    return this.#finalDir;
  }

  setFilename(value) {
    this.#filename = value;
  }

  getResultDir() {
    return this.#resultDir;
  }

  getBaseUrl() {
    return this.#baseUrl;
  }

  getDateNow() {
    return this.#dateNow;
  }

  getFilename() {
    return this.#filename;
  }

  workboxReadFile(file) {
    if (!file) {
      console.log("Nama file harus di isi!");
      return;
    }
    return this.#workbox.xlsx.readFile(file);
  }

  workboxWriteFile(filename) {
    if (!filename) {
      console.log("Nama file harus di isi!");
      return;
    }
    return this.#workbox.xlsx.writeFile(filename);
  }

  getWorksheet(index) {
    return this.#workbox.getWorksheet(index);
  }

  async axiosGet(url, config = {}) {
    return await axios
      .get(url, { ...this.#config, ...config })
      .then((res) => res.data);
  }

  writeJson(pathName, data) {
    try {
      const resultPath = path.join(pathName, `${this.getFilename()}.json`);
      fs.writeFileSync(resultPath, JSON.stringify(data, null, 4));

      console.log(`JSON File created at ${resultPath} \n`);
    } catch (error) {
      console.log(error, "JSON gagal dibuat!");
      return;
    }
  }

  readJSONFile(pathName) {
    const data = fs.readFileSync(pathName);
    return JSON.parse(data);
  }

  replaceSymbolWithDash(row, cellId) {
    const regexSymbol = new RegExp(/[^\w\d]/, "g");
    const getTitle = row.getCell(cellId).value;

    const replaceSymbol = getTitle
      .replace(regexSymbol, "-")
      .replace(/-+/g, "-");
    return replaceSymbol;
  }

  filterSameData(data = []) {
    return data.filter((v, x) => data.indexOf(v) === x);
  }

  #checkingPath(pathName) {
    return fs.existsSync(pathName);
  }

  checkOrCreatePath(pathName) {
    const isPathExists = this.#checkingPath(pathName);
    if (!isPathExists) {
      fs.mkdirSync(pathName, { recursive: true });
    }
  }

  delay(time) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time);
    });
  }
}

module.exports = new MainScrapper();
