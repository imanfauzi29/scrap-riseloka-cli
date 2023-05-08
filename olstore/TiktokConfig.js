const path = require("path");
const excelTemplate = require("../template/category/tiktok-template.json");
const MainScrapper = require("../MainScrapper");
const fs = require("fs");

class TiktokShop {
  static pathExcelTemplate = path.join(
    process.cwd(),
    "template/menswear-tiktok-template.xlsx"
  );

  static uploadRow = 7;
  static updateRow = 7;
  static sheetUpload = "Template";
  static sheetUpdate = "Sheet1";

  /**
   *
   * @param {array} data
   * @param {string} jsonFileName
   * @returns
   */
  static createToExcel(data = [], jsonFileName) {
    const dataLength = data.length;

    if (dataLength === 0) return;

    let myRow = this.uploadRow;

    try {
      const isTemplateExist = fs.existsSync(this.pathExcelTemplate);
      if (!isTemplateExist)
        throw new Error(
          "Template tidak ditemukan, simpan template ke folder template terlebih dahulu."
        );

      MainScrapper.workboxReadFile(this.pathExcelTemplate).then(() => {
        const wrkst = MainScrapper.getWorksheet(this.sheetUpload);
        data.forEach((item) => {
          item?.variants &&
            item.variants.forEach((variant) => {
              if (item.description.length < 20 || item.imgs === null) return;
              const rows = wrkst.getRow(myRow);
              rows.getCell(excelTemplate.Product_Name).value = item.name;
              rows.getCell(excelTemplate.Product_Description).value =
                item.description.substring(0, 3000);
              rows.getCell(excelTemplate["Variation_1 (Colour)"]).value =
                variant.variant_1;
              rows.getCell(excelTemplate["Image_of Variation 1"]).value =
                item.imgs.length > 0 ? item.imgs[0] : null;
              rows.getCell(excelTemplate["Variation_2 (Size)"]).value =
                variant.variant_2;
              rows.getCell(
                excelTemplate["Retail_Price (Local Currency)"]
              ).value = variant.selling_price;
              rows.getCell(excelTemplate.Quantity).value = variant.stock;
              rows.getCell(excelTemplate["Main_Product Image"]).value =
                item.imgs.length > 0 ? item.imgs[0] : null;
              rows.getCell(excelTemplate["Parcel_Weight(g)"]).value =
                variant.weight;
              for (let i = 2; i <= 9; i++) {
                const result = item.imgs[i] ?? null;
                rows.getCell(excelTemplate[`Product_Image ${i}`]).value =
                  result;
              }
              myRow++;
            });
        });

        const pathExl = path.join(
          MainScrapper.getFinalDir(),
          path.join(
            MainScrapper.getInitialInput("filename"),
            jsonFileName.replace(".json", ".xlsx")
          )
        );

        MainScrapper.workboxWriteFile(pathExl);

        console.log(
          `File success created: ${jsonFileName.replace(".json", ".xlsx")}`
        );
      });
    } catch (error) {
      console.log(error);
    }
  }

  static updateStockToExcel(pathName) {
    try {
      const data = MainScrapper.readJSONFile(
        path.join(pathName, `${MainScrapper.getFilename()}.json`)
      );

      const excelFile = MainScrapper.getInitialInput("inputExcel");

      MainScrapper.workboxReadFile(excelFile).then(() => {
        const rows = MainScrapper.getWorksheet(this.updateRow).getRows(
          this.uploadRow,
          100
        );

        rows.forEach((row) => {
          data.forEach((d) => {
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

        MainScrapper.workboxWriteFile(
          path.join(pathName, `${MainScrapper.getFilename()}.xlsx`)
        );

        console.log(`File success created: ${MainScrapper.getFilename()}.xlsx`);
      });
    } catch (error) {
      console.log(error, "WRITE EXCEL ERROR");
    }
  }
}

module.exports = TiktokShop;
