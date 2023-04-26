require("dotenv").config();
const path = require("path");
const fs = require("fs");
const MainScrapper = require("./MainScrapper");
const inquirer = require("inquirer");

const defaultTemplateFolder = path.join(process.cwd(), "template");

function excel({ file_name, excel_template, worksheet, row }) {
  try {
    const pathJson = path.join(
      defaultTemplateFolder,
      "category",
      `${file_name}.json`
    );

    MainScrapper.checkOrCreatePath(
      path.join(defaultTemplateFolder, "category")
    );

    if (!fs.existsSync(pathJson)) {
      fs.writeFileSync(pathJson, JSON.stringify({}, null, 4));
    }

    MainScrapper.workboxReadFile(
      path.join(defaultTemplateFolder, excel_template)
    )
      .then(() => {
        const rows = MainScrapper.getWorksheet(worksheet).getRow(row);
        let i = 1;

        while (true) {
          let text = "";
          const cell = rows.getCell(i).value;
          if (cell === null) break;
          const requiredCell = new RegExp(/\*/g).test(cell);

          if (
            cell?.richText &&
            new RegExp(/\*/g).test(cell?.richText[0].text)
          ) {
            text = cell?.richText[0].text.replace("*", "_").replace(" ", "_");
          } else if (requiredCell) {
            text = cell.replace("*", "_").replace(" ", "_");
          } else {
            text = cell.replace(" ", "_");
          }

          let jsonFile = MainScrapper.readJSONFile(pathJson);
          if (!jsonFile[text]) {
            jsonFile = { ...jsonFile, [text]: i };
          }

          fs.writeFileSync(pathJson, JSON.stringify(jsonFile, null, 4));
          i = i + 1;
        }
      })
      .catch(console.log);
  } catch (error) {
    console.log(error);
  }
}

function run() {
  const questions = [
    {
      type: "input",
      name: "file_name",
      message: "Input file name",
      validate: (value) => {
        if (!value) return "Value must been filled!";
        return true;
      }
    },
    {
      type: "input",
      name: "excel_template",
      message: "Input template excel",
      default: "Bulk_Upload_Template-Indonesia.xlsx",
      validate: (value) => {
        const isTemplateExist = fs.existsSync(
          path.join(defaultTemplateFolder, value)
        );
        if (!isTemplateExist) return "Template tidak ditemukan!";
        return true;
      }
    },
    {
      type: "input",
      name: "worksheet",
      message: "Input worksheet",
      default: 1
    },
    {
      type: "input",
      name: "row",
      message: "Input row",
      default: 2
    }
  ];
  inquirer
    .prompt(questions)
    .then((result) => {
      excel(result);
    })
    .catch(console.log);
}

run();
