require("dotenv").config();
const inquirer = require("inquirer");
const MainScrapper = require("./MainScrapper");
const GetProduct = require("./GetProduct");
const path = require("path");
const Shopee = require("./olstore/ShopeeConfig");
const Akulaku = require("./olstore/AkulakuConfig");
const fs = require("fs");
const UpdateProduct = require("./UpdateProduct");
const TiktokShop = require("./olstore/TiktokConfig");

const UPLOAD_TYPE = 0,
  UPDATE_TYPE = 1;
class Main {
  menu() {
    const choicesList = [
      "Akulaku",
      "Shopee",
      "Tiktok Shop",
      "Tokopedia (soon)",
      "Bukalapak (soon)"
    ];

    console.log("Hi, please select to scrape");
    const questions = [
      {
        type: "list",
        name: "platform",
        message: "Select platform",
        choices: choicesList
      },
      {
        type: "list",
        name: "typeRequest",
        message: "Select type you want",
        choices: (value) => {
          const type = [
            {
              value: 0,
              name: `Mass Upload ${value.platform}`
            },
            {
              value: 1,
              name: `Mass Update ${value.platform}`
            }
          ];
          return type;
        },
        when(value) {
          if (value.platform.includes("soon")) {
            throw new Error(
              `Scrap riseloka export to excel ${value.platform} is comming soon!`
            );
          }
          return true;
        }
      },

      {
        type: "input",
        name: "totalRow",
        message: "Input total row of your update mass upload",
        default: 100,
        when(value) {
          return value.typeRequest === 1;
        }
      },
      {
        type: "input",
        name: "brand",
        message: "Input brand name (optional)",
        when(value) {
          return value.typeRequest === 0;
        }
      },
      {
        type: "input",
        name: "category",
        message: "Input category number (optional)",
        when(value) {
          return value.typeRequest === 0;
        }
      },
      {
        type: "input",
        name: "filename",
        message: "Input filename you want",
        validate(value) {
          return !!value ?? "Please fill the filename";
        }
      },

      {
        type: "input",
        name: "sell_price",
        message: "Input sell price %: ",
        default: 0
      }
    ];

    inquirer
      .prompt(questions)
      .then((answers) => {
        MainScrapper.setInitialInput(answers);
        this.run();
      })
      .catch((error) => console.log(error.message));
  }

  run() {
    const { platform } = MainScrapper.getInitialInput();
    let pathDir = "";

    switch (platform) {
      case "Shopee":
        pathDir = "shopee";
        break;

      case "Akulaku":
        pathDir = "akulaku";
        break;

      case "Tiktok Shop":
        pathDir = "tiktok shop";
        break;
      default:
        break;
    }

    this.uploadType(pathDir);
  }

  async uploadType(pathDir) {
    try {
      const resultDir = path.join(MainScrapper.getResultDir(), pathDir);
      MainScrapper.checkOrCreatePath(path.join(process.cwd(), resultDir));
      MainScrapper.setFinalDir(resultDir);

      const { typeRequest } = MainScrapper.getInitialInput();

      switch (typeRequest) {
        case UPLOAD_TYPE:
          GetProduct.main().then((res) => {
            const { file, jsonFileName } = res;
            this.toExcel(file, jsonFileName);
          });
          break;
        case UPDATE_TYPE:
          await UpdateProduct.run();
          const pathNameJSON = path.join(resultDir, MainScrapper.getFilename());
          this.toUpdateExcel(pathNameJSON);

        default:
          break;
      }
    } catch (error) {
      console.log(error);
    }
  }

  toUpdateExcel(pathNameJSON) {
    const { platform } = MainScrapper.getInitialInput();
    switch (platform) {
      case "Shopee":
        Shopee.updateStockToExcel(pathNameJSON);
        break;
      case "Akulaku":
        Akulaku.updateStockToExcel(pathNameJSON);
        break;
      case "Tiktok Shop":
        TiktokShop.updateStockToExcel(pathNameJSON);
        break;
      default:
        break;
    }
  }

  toExcel(file, jsonFileName) {
    const { platform } = MainScrapper.getInitialInput();
    switch (platform) {
      case "Shopee":
        Shopee.createToExcel(file, jsonFileName);
        break;
      case "Akulaku":
        Akulaku.createToExcel(file, jsonFileName);
        break;
      case "Tiktok Shop":
        TiktokShop.createToExcel(file, jsonFileName);
      default:
        break;
    }
  }
}

const main = new Main();
main.menu();
