const fs = require("fs");
const path = require("path");
const MainScrapper = require("./MainScrapper");

class Update {
  row;
  pathExcelMassUpdate = path.join(
    process.cwd(),
    "template/mass_update_sales_info_464946005_20230414114201.xlsx"
  );

  constructor() {}

  async run(row = 7) {
    this.row = row;
    const filename = MainScrapper.getInitialInput("filename");
    MainScrapper.setFilename(
      `[${MainScrapper.getDateNow()}] mass-update-${filename}-result`
    );

    return this.readingExcel();
  }

  readingExcel() {
    console.log("==== TRY READING EXCEL FILE ====");
    try {
      const { inputExcel, totalRow } = MainScrapper.getInitialInput();
      const template = inputExcel || this.pathExcelMassUpdate;

      MainScrapper.workboxReadFile(template).then(() => {
        const rows = MainScrapper.getWorksheet(1).getRows(this.row, totalRow);
        const pathFromTitle = [];

        console.log("Convert title ke slug");
        rows.forEach((row) => {
          const replaceSymbol = this.replaceSymbolWithDash(row, 2);

          pathFromTitle.push(replaceSymbol);
        });

        console.log("Start fetching...");
        return this.fetchData(MainScrapper.filterSameData(pathFromTitle));
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
      const grabData = await this.axiosGet(
        `${this.getBaseUrl()}/slug/${pathFromTitle[index]}`
      ).then((res) => res.data);

      console.log(`Updating data ke-${index + 1} dari ${pathFromTitle.length}`);

      if (Object.keys(grabData.data).length === 0) {
        console.log("stop\n\n");
        break;
      }

      // if (index === 5) break;

      newData.push({
        name: grabData.name,
        variants: grabData.variants
      });
      index += 1;
      await MainScrapper.delay(1000);
    }

    return await this.updateData(newData);
  }

  async updateData(newData) {
    const pathNameJson = path.join(
      MainScrapper.getFinalDir(),
      MainScrapper.getFilename(),
      `${MainScrapper.getFilename()}.json`
    );

    if (newData.length === 0) {
      console.log("Data tidak ditemukan!");
      return;
    }

    fs.writeFileSync(pathNameJson, JSON.stringify(newData, null, 4));

    return {
      pathName: pathNameJson,
      data: newData
    };
  }
}

module.exports = new Update();
