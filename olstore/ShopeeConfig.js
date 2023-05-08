const path = require("path");
const excelTemplate = require("../template/excel_template.json");
const shopeeCategory = require("../template/shopee_category.json");
const MainScrapper = require("../MainScrapper");

class Shopee {
  static pathExcelTemplate = path.join(
    process.cwd(),
    "template/Shopee_mass_upload_11-04-2023_basic_template.xlsx"
  );
  static currentRow = 6;
  constructor() {}

  /**
   *
   * @param {array} data
   * @param {string} jsonFileName
   * @returns
   */
  static createToExcel(data = [], jsonFileName) {
    const dataLength = data.length;

    if (dataLength === 0) return;

    let myRow = this.currentRow;

    try {
      MainScrapper.workboxReadFile(this.pathExcelTemplate).then(() => {
        const worksheet = MainScrapper.getWorksheet("Template");
        data.forEach((item) => {
          item.variants.forEach((variant) => {
            if (item.description.length < 20 || item.imgs === null) return;
            const row = worksheet.getRow(myRow);
            row.getCell(excelTemplate.kategory).value =
              shopeeCategory[item.category] ?? null;
            row.getCell(excelTemplate.product_name).value = item.name;
            row.getCell(excelTemplate.description).value =
              item.description.substring(0, 3000);
            row.getCell(excelTemplate.sku).value = item.sku;
            row.getCell(excelTemplate.kode_integrasi).value = item.id;
            row.getCell(excelTemplate.nama_variasi_1).value = item.variant_1;
            row.getCell(excelTemplate.varian_variasi_1).value =
              variant.variant_1;
            row.getCell(excelTemplate.foto_variant).value =
              item.imgs.length > 0 ? item.imgs[0] : null;
            row.getCell(excelTemplate.nama_variasi_2).value = item.variant_2;
            row.getCell(excelTemplate.varian_variasi_2).value =
              variant.variant_2;
            row.getCell(excelTemplate.harga).value = variant.selling_price;
            row.getCell(excelTemplate.stock).value = variant.stock;
            row.getCell(excelTemplate.kode_variasi).value = variant.variant_id;
            row.getCell(excelTemplate.foto_sampul).value =
              item.imgs.length > 0 ? item.imgs[0] : null;
            row.getCell(excelTemplate.cashless).value = "Aktif";
            row.getCell(excelTemplate.weight).value = variant.weight;
            for (const i in [...Array(8).keys()]) {
              const index = Number(i) + 1;
              const result = item.imgs[i] ?? null;
              row.getCell(excelTemplate[`foto_product_${index}`]).value =
                result;
            }
            myRow += 1;
          });
        });

        const pathExl = path.join(
          MainScrapper.getFinalDir(),
          path.join(
            MainScrapper.getInitialInput("filename"),
            MainScrapper.getInitialInput("platform"),
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

  static updateStockToExcel(pathName, row = 7) {
    try {
      const data = MainScrapper.readJSONFile(
        path.join(pathName, `${MainScrapper.getFilename()}.json`)
      );

      const excelFile = MainScrapper.getInitialInput("inputExcel");

      MainScrapper.workboxReadFile(excelFile).then(() => {
        const rows = MainScrapper.getWorksheet(1).getRows(
          row,
          MainScrapper.getInitialInput("totalRow")
        );

        rows.forEach((row) => {
          data.forEach((d) => {
            const isName = row.getCell(2).value === d.name;
            if (isName) {
              d.variants.forEach((variant) => {
                if (variant.variants_name === row.getCell(4).value) {
                  row.getCell(7).value = MainScrapper.calculateDiscount(
                    variant.selling_price,
                    MainScrapper.getInitialInput("sell_price")
                  );
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

module.exports = Shopee;
