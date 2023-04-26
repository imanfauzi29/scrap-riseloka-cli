const path = require("path");
const excelTemplate = require("../template/akulaku-template.json");
const akulakuCategory = require("../template/akulaku_category.json");
const MainScrapper = require("../MainScrapper");

class Akulaku {
  static pathExcelTemplate = path.join(
    process.cwd(),
    "template/Bulk_Upload_Template-Indonesia.xlsx"
  );
  static currentRow = 4;
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
        const worksheet = MainScrapper.getWorksheet("Sheet1");

        data.forEach((item, i) => {
          item &&
            item.variants.forEach((variant) => {
              if (item.description.length < 20 || item.imgs === null) return;
              const row = worksheet.getRow(myRow);
              row.getCell(excelTemplate._Kategori_ID).value =
                akulakuCategory[item.category] ?? null;
              row.getCell(excelTemplate._Nama_Produk).value = item.name;
              row.getCell(excelTemplate._Deskripsi_Produk).value =
                item.description.substring(0, 3000);
              row.getCell(excelTemplate._Produk_SKU).value = item.sku;
              row.getCell(excelTemplate.Warna).value = variant.variant_1;
              row.getCell(excelTemplate._Harga).value = variant.selling_price;
              row.getCell(excelTemplate._Jumlah).value = variant.stock;
              row.getCell(excelTemplate._Merek).value = item.brand;
              row.getCell(excelTemplate["_ID_Template ongkir"]).value = 0;
              row.getCell(excelTemplate["_Panjang_(CM)"]).value = 20;
              row.getCell(excelTemplate["_Lebar_(CM)"]).value = 20;
              row.getCell(excelTemplate["_Tinggi_(CM)"]).value = 5;
              row.getCell(excelTemplate["_Gambar_Utama URL"]).value =
                item.imgs.length > 0 ? item.imgs[0] : null;
              row.getCell(excelTemplate["_Berat_(KG)"]).value =
                MainScrapper.toKilogram(variant.weight);
              for (const i in [...Array(5).keys()]) {
                const index = Number(i) + 1;
                const result = item.imgs[i] ?? null;
                row.getCell(excelTemplate[`Gambar_Banner ${index}`]).value =
                  result;
              }
              myRow += 1;
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

  static updateStockToExcel(pathName, row = 7) {
    try {
      const data = MainScrapper.readJSONFile(
        path.join(pathName, `${MainScrapper.getFilename()}.json`)
      );

      const excelFile = MainScrapper.getInitialInput("inputExcel");

      MainScrapper.workboxReadFile(excelFile).then(() => {
        const rows = MainScrapper.getWorksheet(1).getRows(row, 100);

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

module.exports = Akulaku;
