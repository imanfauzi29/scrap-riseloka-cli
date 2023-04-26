const fs = require("fs");
const path = require("path");
const MainScrapper = require("./MainScrapper");
const { glob } = require("glob");
const inquirer = require("inquirer");

class GetRiselokaProduct {
  #jsonFileName;
  constructor() {}

  /**
   *
   * @returns {{file: object, jsonFileName: string}}
   */
  async main() {
    const { filename } = MainScrapper.getInitialInput();
    this.#jsonFileName = `(${MainScrapper.getDateNow()})${
      MainScrapper.getInitialInput().filename
    }.json`;

    MainScrapper.setFilename(filename.replace(/\s/, "_"));

    const checkFileExists = await this.#checkFile().then((res) => res);

    const dir = path.join(
      MainScrapper.getFinalDir(),
      MainScrapper.getInitialInput().filename
    );

    // if true skip grab data continue to excel
    if (checkFileExists) {
      const globDir = path
        .join(dir, `/*${MainScrapper.getInitialInput("filename")}.json`)
        .replace(/\\/g, "/");
      let jsonPath = await glob(globDir);
      if (jsonPath.length > 0) jsonPath = jsonPath[0];

      console.log(globDir, jsonPath, typeof globDir, typeof jsonPath);

      const file = MainScrapper.readJSONFile(jsonPath);

      return {
        file,
        jsonFileName: this.#jsonFileName
      };
    } else {
      const globDir = path
        .join(dir, `/*${MainScrapper.getInitialInput("filename")}.json`)
        .replace(/\\/g, "/");
      const jsonPath = await glob(globDir);

      if (jsonPath.length > 0) {
        jsonPath.forEach((path) => fs.rmSync(path, { force: true }));
      }
      return await this.run();
    }
  }

  async #checkFile() {
    const dir = path.join(
      MainScrapper.getFinalDir(),
      MainScrapper.getInitialInput().filename
    );
    MainScrapper.checkOrCreatePath(dir);

    const globDir = path
      .join(dir, `/*${MainScrapper.getInitialInput("filename")}.json`)
      .replace(/\\/g, "/");
    const jsonPath = await glob(globDir);

    // check for existing file
    if (jsonPath.length > 0) {
      // ask json file is exists (default No)
      const questions = [
        {
          type: "confirm",
          name: "jsonExist",
          message: `file ${
            this.#jsonFileName
          } sudah tersedia di folder ${path.join(
            MainScrapper.getFinalDir(),
            MainScrapper.getInitialInput().filename
          )}`,
          default: false
        }
      ];
      return await inquirer
        .prompt(questions)
        .then((answers) => {
          return !answers.jsonExist;
        })
        .catch((error) => {
          console.log(error.message);
          return false;
        });
    }
    return false;
  }

  async run() {
    try {
      console.log("==== GRABBING DATA ====");
      const { category, brand } = MainScrapper.getInitialInput();
      const data = [];
      let page = 1;
      while (true) {
        const result = await MainScrapper.axiosGet({
          config: {
            params: {
              page,
              category,
              brand,
              sort: "recommendation",
              length: 50
            }
          }
        })
          .then((res) => res.data)
          .catch(console.log);

        if (result.data && result.data.length === 0) {
          console.log("stop");
          break;
        }

        const filterId = result.data.map((v) => v.slug);

        console.log(`Grabbing slug data page=${page}`);

        data.push(...filterId);
        page += 1;
        await MainScrapper.delay(process.env.SLEEP_TIME);
      }

      return await this.grabData(data);
    } catch (error) {
      console.log(error);
    }
  }

  async grabData(data = []) {
    try {
      let newData = [];
      console.log("==== DOWNLOADING DATA ====");
      const totalData = data.length;
      let index = 0;

      if (totalData === 0) {
        console.log("Data not found! maybe try again with another category...");
        return;
      }

      while (true) {
        const grabData = await MainScrapper.axiosGet({
          url: `/slug/${data[index]}`
        })
          .then((res) => res.data)
          .catch(console.log);

        console.log(`Downloading data ke ${index + 1} dari ${totalData + 1}`);

        if (grabData !== undefined && Object.keys(grabData).length === 0) {
          console.log("stop");
          break;
        }

        this.#pushToCategory(grabData?.category);

        newData.push(grabData);
        // newData.push(grabData.data.category);
        index += 1;
        await MainScrapper.delay(process.env.SLEEP_TIME);
      }

      // const filterData = newData.filter((v, x) => newData.indexOf(v) === x);
      const jsonFile = path.join(
        MainScrapper.getFinalDir(),
        path.join(MainScrapper.getInitialInput().filename, this.#jsonFileName)
      );

      fs.writeFileSync(jsonFile, JSON.stringify(newData));

      return {
        file: newData,
        jsonFileName: this.#jsonFileName
      };
    } catch (error) {
      console.log(error);
    }
  }

  #pushToCategory(category) {
    let categoryPath;
    switch (MainScrapper.getInitialInput("platform")) {
      case "Shopee":
        categoryPath = path.join(
          process.cwd(),
          "template/shopee_category.json"
        );
        break;
      case "akulaku":
        categoryPath = path.join(
          process.cwd(),
          "template/akulaku_category.json"
        );
      case "Tiktok Shop":
        categoryPath = path.join(
          process.cwd(),
          "template/tiktok_shop_category.json"
        );
      default:
        break;
    }

    if (!categoryPath) throw new Error("Category path null!");

    this.#pushCategory(categoryPath, category);
  }

  #pushCategory(path, category) {
    if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}));
    let openFile = MainScrapper.readJSONFile(path);

    if (!openFile[category]) {
      openFile = { ...openFile, [category]: "" };
    }

    fs.writeFileSync(path, JSON.stringify(openFile, null, 4));
  }
}

module.exports = new GetRiselokaProduct();
