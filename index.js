require("dotenv").config();
const inquirer = require("inquirer");
const MainScrapper = require("./MainScrapper");
const GetProduct = require("./GetProduct");
const path = require("path");
const Shopee = require("./olstore/ShopeeConfig");
const fs = require("fs");
const UpdateProduct = require("./UpdateProduct");

const UPLOAD_TYPE = 0,
  UPDATE_TYPE = 1;
class Main {
  menu() {
    const choicesList = [
      "Akulaku",
      "Shopee",
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
        name: "inputExcel",
        message: "Input your excel template",
        default(value) {
          if (value.typeRequest === 0) {
            return path.join(
              process.cwd(),
              "template/Shopee_mass_upload_11-04-2023_basic_template.xlsx"
            );
          }
          return path.join(
            process.cwd(),
            "template/mass_update_sales_info_464946005_20230414114201.xlsx"
          );
        },
        validate(value) {
          const isTemplateExist = fs.existsSync(value);
          console.log(value);
          if (!isTemplateExist) return "Template tidak ditemukan!";
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
            Shopee.createToExcel(file, jsonFileName);
          });
          break;
        case UPDATE_TYPE:
          await UpdateProduct.run();
          const pathNameJSON = path.join(resultDir, MainScrapper.getFilename());
          console.log(pathNameJSON);
          Shopee.updateStockToExcel(pathNameJSON);
        default:
          break;
      }
    } catch (error) {
      console.log(error);
    }
  }
}

const main = new Main();
main.menu();
